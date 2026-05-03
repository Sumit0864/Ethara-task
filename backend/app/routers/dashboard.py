from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func as sqla_func
from datetime import date
from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.project import ProjectMember
from app.models.task import Task, TaskStatus
from app.models.team import Team
from app.models.time_record import TimeRecord
from app.schemas.task import DashboardStats, TaskOut
from pydantic import BaseModel

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


class TeamOverview(BaseModel):
    team_id: str
    team_name: str
    member_count: int
    lead_name: Optional[str] = None


class ExtendedDashboardStats(DashboardStats):
    total_users: int = 0
    total_teams: int = 0
    total_hours_logged: float = 0.0
    teams: List[TeamOverview] = []


@router.get("/stats", response_model=ExtendedDashboardStats)
def get_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()

    if current_user.role == "superadmin":
        base = db.query(Task)
        total_users = db.query(User).count()
        total_teams = db.query(Team).count()
        total_hours = db.query(sqla_func.coalesce(sqla_func.sum(TimeRecord.hours), 0.0)).scalar()

        # Team overviews
        teams_data = db.query(Team).options(joinedload(Team.lead), joinedload(Team.members)).all()
        teams_overview = [
            TeamOverview(
                team_id=str(t.id),
                team_name=t.name,
                member_count=len(t.members),
                lead_name=t.lead.full_name if t.lead else None,
            )
            for t in teams_data
        ]

    elif current_user.role == "team_lead":
        lead_team = db.query(Team).filter(Team.lead_id == current_user.id).first()
        if lead_team:
            team_user_ids = [u.id for u in db.query(User).filter(User.team_id == lead_team.id).all()]
            # Tasks assigned to team members
            base = db.query(Task).filter(Task.assignees.any(User.id.in_(team_user_ids)))
            total_users = len(team_user_ids)
            total_teams = 1
            total_hours = db.query(sqla_func.coalesce(sqla_func.sum(TimeRecord.hours), 0.0)).filter(
                TimeRecord.user_id.in_(team_user_ids)
            ).scalar()
            teams_overview = [
                TeamOverview(
                    team_id=str(lead_team.id),
                    team_name=lead_team.name,
                    member_count=total_users,
                    lead_name=current_user.full_name,
                )
            ]
        else:
            base = db.query(Task).filter(Task.assignees.any(User.id == current_user.id))
            total_users = 0
            total_teams = 0
            total_hours = 0.0
            teams_overview = []
    else:
        # Tasker: only their assigned tasks
        base = db.query(Task).filter(Task.assignees.any(User.id == current_user.id))
        total_users = 0
        total_teams = 0
        total_hours = db.query(sqla_func.coalesce(sqla_func.sum(TimeRecord.hours), 0.0)).filter(
            TimeRecord.user_id == current_user.id
        ).scalar()
        teams_overview = []

    total = base.count()
    todo = base.filter(Task.status == TaskStatus.todo).count()
    in_progress = base.filter(Task.status == TaskStatus.in_progress).count()
    done_count = base.filter(Task.status == TaskStatus.done).count()
    overdue = base.filter(Task.due_date < today, Task.status != TaskStatus.done).count()

    # My tasks
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
                Task.assignees.any(User.id == current_user.id),
                Task.status != TaskStatus.done,
            )
            .order_by(Task.due_date.asc().nullslast())
            .limit(10)
        )

    return ExtendedDashboardStats(
        total_tasks=total,
        todo=todo,
        in_progress=in_progress,
        done=done_count,
        overdue=overdue,
        my_tasks=[TaskOut.model_validate(t) for t in my_tasks_q.all()],
        total_users=total_users,
        total_teams=total_teams,
        total_hours_logged=float(total_hours),
        teams=teams_overview,
    )
