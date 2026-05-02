from __future__ import annotations
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from datetime import date
from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.project import ProjectMember
from app.models.task import Task, TaskStatus
from app.schemas.task import DashboardStats, TaskOut

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Superadmin: stats across all projects
    if current_user.role == "superadmin":
        base = db.query(Task)
    else:
        memberships = db.query(ProjectMember).filter(ProjectMember.user_id == current_user.id).all()
        project_ids = [m.project_id for m in memberships]
        if not project_ids:
            return DashboardStats(total_tasks=0, todo=0, in_progress=0, done=0, overdue=0, my_tasks=[])
        base = db.query(Task).filter(Task.project_id.in_(project_ids))

    today = date.today()
    total = base.count()
    todo = base.filter(Task.status == TaskStatus.todo).count()
    in_progress = base.filter(Task.status == TaskStatus.in_progress).count()
    done_count = base.filter(Task.status == TaskStatus.done).count()
    overdue = base.filter(Task.due_date < today, Task.status != TaskStatus.done).count()

    # "my tasks": tasks assigned to current user (not done), or all pending for superadmin
    if current_user.role == "superadmin":
        my_tasks_q = (
            db.query(Task)
            .options(joinedload(Task.assignees), joinedload(Task.creator))
            .filter(Task.status != TaskStatus.done)
            .order_by(Task.due_date.asc().nullslast())
            .limit(10)
        )
    else:
        my_tasks_q = (
            db.query(Task)
            .options(joinedload(Task.assignees), joinedload(Task.creator))
            .filter(
                Task.project_id.in_(project_ids),
                Task.assignees.any(User.id == current_user.id),
                Task.status != TaskStatus.done,
            )
            .order_by(Task.due_date.asc().nullslast())
            .limit(10)
        )

    return DashboardStats(
        total_tasks=total,
        todo=todo,
        in_progress=in_progress,
        done=done_count,
        overdue=overdue,
        my_tasks=[TaskOut.model_validate(t) for t in my_tasks_q.all()],
    )
