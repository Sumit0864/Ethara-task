from __future__ import annotations
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
import uuid
from app.schemas.auth import UserOut


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class MemberOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    project_id: uuid.UUID
    role: str
    joined_at: datetime
    user: UserOut

    model_config = {"from_attributes": True}


class ProjectOut(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    owner: UserOut

    model_config = {"from_attributes": True}


class ProjectDetailOut(ProjectOut):
    members: List[MemberOut] = []


class MemberAdd(BaseModel):
    email: str
    role: str = "member"


class MemberRoleUpdate(BaseModel):
    role: str
