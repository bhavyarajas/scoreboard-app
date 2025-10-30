from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint, DateTime, JSON, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from db import Base

class Person(Base):
    __tablename__ = "people"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)

class Game(Base):
    __tablename__ = "games"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False, index=True)
    label = Column(String, nullable=False)

class Score(Base):
    __tablename__ = "scores"
    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(Integer, ForeignKey("people.id"), nullable=False)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False)
    total = Column(Float, nullable=False, default=0.0)
    __table_args__ = (UniqueConstraint("person_id", "game_id", name="uq_person_game"),)

    person = relationship("Person")
    game = relationship("Game")

class Log(Base):
    __tablename__ = "logs"
    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(Integer, ForeignKey("people.id"), nullable=False)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False)
    delta = Column(Integer, nullable=False)
    meta = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    person = relationship("Person")
    game = relationship("Game")