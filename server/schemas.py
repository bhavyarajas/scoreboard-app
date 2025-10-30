from typing import Optional, Literal, Dict, Any, List
from pydantic import BaseModel

class Action(BaseModel):
    person: str
    game: str
    type: Literal["add", "increment"]
    # can be negative, can be float
    amount: Optional[float] = None
    meta: Optional[Dict[str, Any]] = None

class ScoreResponse(BaseModel):
    person: str
    game: str
    total: float

class ScoresEnvelope(BaseModel):
    scores: List[ScoreResponse]