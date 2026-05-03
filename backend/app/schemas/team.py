from __future__ import annotations
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
import uuid
from app.schemas.auth import UserOut


class TeamCreate(BaseModel):
    name: str
    description: Optional[str] = None
    lead_id: Optional[uuid.UUID] = None


class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    lead_id: Optional[uuid.UUID] = None


class TeamOut(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]
    lead_id: Optional[uuid.UUID]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TeamDetailOut(TeamOut):
    lead: Optional[UserOut] = None
    members: List[UserOut] = []
