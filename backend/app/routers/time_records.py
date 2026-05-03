from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.task import Task
from app.models.team import Team
from app.models.time_record import TimeRecord
from app.schemas.time_record import TimeRecordCreate, TimeRecordUpdate, TimeRecordOut, TimeRecordWithTask
import uuid
from datetime import date

router = APIRouter(tags=["time-records"])


@router.post("/api/tasks/{task_id}/time-records", response_model=TimeRecordOut, status_code=201)
def create_time_record(
    task_id: uuid.UUID,
    payload: TimeRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if payload.hours <= 0 or payload.hours > 24:
        raise HTTPException(status_code=400, detail="Hours must be between 0 and 24")

    record = TimeRecord(
        task_id=task_id,
        user_id=current_user.id,
        date=payload.date,
        hours=payload.hours,
        description=payload.description,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return (
        db.query(TimeRecord)
        .options(joinedload(TimeRecord.user))
        .filter(TimeRecord.id == record.id)
        .first()
    )


@router.get("/api/tasks/{task_id}/time-records", response_model=List[TimeRecordOut])
def list_task_time_records(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return (
        db.query(TimeRecord)
        .options(joinedload(TimeRecord.user))
        .filter(TimeRecord.task_id == task_id)
        .order_by(TimeRecord.date.desc())
        .all()
    )


@router.get("/api/my/time-records", response_model=List[TimeRecordWithTask])
def list_my_time_records(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = (
        db.query(TimeRecord)
        .options(joinedload(TimeRecord.user), joinedload(TimeRecord.task))
        .filter(TimeRecord.user_id == current_user.id)
    )
    if start_date:
        q = q.filter(TimeRecord.date >= start_date)
    if end_date:
        q = q.filter(TimeRecord.date <= end_date)

    records = q.order_by(TimeRecord.date.desc()).all()

    result = []
    for r in records:
        out = TimeRecordWithTask.model_validate(r)
        out.task_title = r.task.title if r.task else None
        result.append(out)
    return result


@router.get("/api/team/time-records", response_model=List[TimeRecordWithTask])
def list_team_time_records(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    user_id: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Team leads see their team's time records; superadmin sees all."""
    if current_user.role not in ("superadmin", "team_lead"):
        raise HTTPException(status_code=403, detail="Not authorized")

    q = db.query(TimeRecord).options(joinedload(TimeRecord.user), joinedload(TimeRecord.task))

    if current_user.role == "team_lead":
        lead_team = db.query(Team).filter(Team.lead_id == current_user.id).first()
        if not lead_team:
            return []
        team_user_ids = [u.id for u in db.query(User).filter(User.team_id == lead_team.id).all()]
        q = q.filter(TimeRecord.user_id.in_(team_user_ids))

    if user_id:
        q = q.filter(TimeRecord.user_id == user_id)
    if start_date:
        q = q.filter(TimeRecord.date >= start_date)
    if end_date:
        q = q.filter(TimeRecord.date <= end_date)

    records = q.order_by(TimeRecord.date.desc()).limit(200).all()

    result = []
    for r in records:
        out = TimeRecordWithTask.model_validate(r)
        out.task_title = r.task.title if r.task else None
        result.append(out)
    return result


@router.patch("/api/time-records/{record_id}", response_model=TimeRecordOut)
def update_time_record(
    record_id: uuid.UUID,
    payload: TimeRecordUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = db.query(TimeRecord).filter(TimeRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Time record not found")

    if record.user_id != current_user.id and current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Can only edit your own time records")

    if payload.date is not None:
        record.date = payload.date
    if payload.hours is not None:
        if payload.hours <= 0 or payload.hours > 24:
            raise HTTPException(status_code=400, detail="Hours must be between 0 and 24")
        record.hours = payload.hours
    if payload.description is not None:
        record.description = payload.description

    db.commit()
    return (
        db.query(TimeRecord)
        .options(joinedload(TimeRecord.user))
        .filter(TimeRecord.id == record.id)
        .first()
    )


@router.delete("/api/time-records/{record_id}", status_code=204)
def delete_time_record(
    record_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = db.query(TimeRecord).filter(TimeRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Time record not found")

    if record.user_id != current_user.id and current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Can only delete your own time records")

    db.delete(record)
    db.commit()
