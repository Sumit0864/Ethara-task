from __future__ import annotations
from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional, List
import uuid
from app.schemas.auth import UserOut


class TimeRecordCreate(BaseModel):
    date: date
    hours: float
    description: Optional[str] = None


class TimeRecordUpdate(BaseModel):
    date: Optional[date] = None
    hours: Optional[float] = None
    description: Optional[str] = None


class TimeRecordOut(BaseModel):
    id: uuid.UUID
    task_id: uuid.UUID
    user_id: uuid.UUID
    date: date
    hours: float
    description: Optional[str]
    created_at: datetime
    user: UserOut

    model_config = {"from_attributes": True}


class TimeRecordWithTask(TimeRecordOut):
    """Includes task title for timesheet views."""
    task_title: Optional[str] = None
