from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Union

from db import SessionLocal
from models import Person, Game, Score, Log
from seed import init_db, seed_data, get_seed_config
from schemas import Action, ScoreResponse, ScoresEnvelope

app = FastAPI(title="Scoreboard API")

# CORS for localhost dev (CRA: 3000; Vite allowed too per spec)
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "https://scoreboard-app-snowy.vercel.app",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.on_event("startup")
def on_startup():
    init_db()
    with SessionLocal() as db:
        seed_data(db)

@app.get("/config")
def get_config():
    return get_seed_config()

@app.get("/scores", response_model=ScoresEnvelope)
def get_scores(db: Session = Depends(get_db)):
    rows = (
        db.query(Score, Person, Game)
        .join(Person, Score.person_id == Person.id)
        .join(Game, Score.game_id == Game.id)
        .all()
    )
    data = [
        ScoreResponse(person=p.name, game=g.key, total=s.total)
        for (s, p, g) in rows
    ]
    return {"scores": data}

@app.post("/action", response_model=ScoreResponse)
def post_action(payload: Action, db: Session = Depends(get_db)):
    # Validate person
    person = db.query(Person).filter(Person.name == payload.person).first()
    if not person:
        raise HTTPException(status_code=400, detail="Invalid person")

    # Validate game
    game = db.query(Game).filter(Game.key == payload.game).first()
    if not game:
      raise HTTPException(status_code=400, detail="Invalid game")

    # get score row
    score = (
        db.query(Score)
        .filter(Score.person_id == person.id, Score.game_id == game.id)
        .with_for_update()
        .first()
    )
    if not score:
        score = Score(person_id=person.id, game_id=game.id, total=0.0)
        db.add(score)
        db.flush()

    # SCORING TABLE (backend truth)
    RING_TOSS_VALUES = [25, 50, 75, 100]
    JEOPARDY_VALUES = {100, 200, 300, 400, 500}

    if payload.type == "add":
        if payload.amount is None:
            raise HTTPException(status_code=400, detail="Missing amount for add")
        amount = float(payload.amount)

        # ring toss
        if game.key == "ring_toss":
            if amount not in RING_TOSS_VALUES:
                raise HTTPException(status_code=400, detail="Ring Toss amount must be one of 25,50,75,100")
            score.total += amount

        # jeopardy
        elif game.key == "jeopardy":
            if amount not in JEOPARDY_VALUES:
                raise HTTPException(status_code=400, detail="Jeopardy amount must be one of 100,200,300,400,500")
            score.total += amount
            meta = payload.meta or {"value": amount}
            db.add(Log(person_id=person.id, game_id=game.id, delta=amount, meta=meta))

        # pin the spider
        elif game.key == "pin_spider":
            if amount != 150:
                raise HTTPException(status_code=400, detail="Pin the Spider must be 150")
            score.total += amount

        # mime
        elif game.key == "mime":
            if amount != 125:
                raise HTTPException(status_code=400, detail="Mime must be 125")
            score.total += amount

        # bingo
        elif game.key == "bingo":
            if amount != 150:
                raise HTTPException(status_code=400, detail="Bingo must be 150")
            score.total += amount

        # eye toss (win or lose)
        elif game.key == "eye_toss":
            if amount not in (200.0, -100.0):
                raise HTTPException(status_code=400, detail="Eye Toss must be 200 or -100")
            score.total += amount

        # roulette (win or lose)
        elif game.key == "roulette":
            if amount not in (250.0, -100.0):
                raise HTTPException(status_code=400, detail="Roulette must be 250 or -100")
            score.total += amount

        else:
            raise HTTPException(status_code=400, detail=f"Add not supported for {game.key}")

    elif payload.type == "increment":
        # keep this only for backward-compat (old UI)
        # but make it map to correct game values if you still call increment
        if game.key == "pin_spider":
            score.total += 150
        elif game.key == "mime":
            score.total += 125
        elif game.key == "bingo":
            score.total += 150
        elif game.key == "eye_toss":
            score.total += 200
        elif game.key == "roulette":
            score.total += 250
        else:
            score.total += 1  # fallback
    else:
        raise HTTPException(status_code=400, detail="Invalid action type")

    db.commit()
    db.refresh(score)
    return ScoreResponse(person=person.name, game=game.key, total=score.total)
