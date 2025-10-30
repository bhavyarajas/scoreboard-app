from sqlalchemy.orm import Session
from models import Person, Game, Score
from db import Base, engine

# Single source of truth seed lists
PEOPLE = ["Aadit","Akshita","Anant","Arjun","Ishaan", "Jigar","Kabir", "Mayukha","Nandini","Priyanka", "Sania"]

GAMES = [
    {"key": "ring_toss", "label": "Ring Toss"},
    {"key": "pin_spider", "label": "Pin Spider"},
    {"key": "mime", "label": "Mime"},
    {"key": "eye_toss", "label": "Eye Toss"},
    {"key": "roulette", "label": "Roulette"},
    {"key": "jeopardy", "label": "Jeopardy"},
    {"key": "bingo", "label": "Bingo"},
]

def init_db():
    Base.metadata.create_all(bind=engine)

def seed_data(db: Session):
    # Seed people
    existing_people = {p.name for p in db.query(Person).all()}
    for name in PEOPLE:
        if name not in existing_people:
            db.add(Person(name=name))
    db.flush()

    # Seed games
    existing_games = {g.key for g in db.query(Game).all()}
    for g in GAMES:
        if g["key"] not in existing_games:
            db.add(Game(key=g["key"], label=g["label"]))
    db.flush()

    # Seed zeroed scores for all person×game pairs
    people = db.query(Person).all()
    games = db.query(Game).all()
    existing_pairs = {(s.person_id, s.game_id) for s in db.query(Score).all()}
    for p in people:
        for g in games:
            if (p.id, g.id) not in existing_pairs:
                db.add(Score(person_id=p.id, game_id=g.id, total=0))
    db.commit()

def get_seed_config():
    return {
        "people": PEOPLE,
        "games": [{"key": g["key"], "label": g["label"]} for g in GAMES]
    }