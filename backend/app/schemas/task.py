from __future__ import annotations
from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional, List
import uuid
from app.schemas.auth import UserOut


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "todo"
    priority: str = "medium"
    assignee_ids: List[uuid.UUID] = []   # multiple assignees
    due_date: Optional[date] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee_ids: Optional[List[uuid.UUID]] = None   # replaces full list when provided
    due_date: Optional[date] = None


class TaskOut(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    title: str
    description: Optional[str]
    status: str
    priority: str
    created_by: uuid.UUID
    due_date: Optional[date]
    created_at: datetime
    updated_at: datetime
    assignees: List[UserOut] = []
    creator: UserOut

    model_config = {"from_attributes": True}


class DashboardStats(BaseModel):
    total_tasks: int
    todo: int
    in_progress: int
    done: int
    overdue: int
    my_tasks: List[TaskOut]
