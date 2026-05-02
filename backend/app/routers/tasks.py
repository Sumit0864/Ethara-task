from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.core.deps import get_current_user
from app.core.rbac import require_project_member
from app.models.user import User
from app.models.project import ProjectMember, MemberRole
from app.models.task import Task, TaskStatus, TaskPriority
from app.schemas.task import TaskCreate, TaskUpdate, TaskOut
import uuid

router = APIRouter(tags=["tasks"])


def _load_task(db: Session, task_id: uuid.UUID) -> Task:
    task = (
        db.query(Task)
        .options(joinedload(Task.assignees), joinedload(Task.creator))
        .filter(Task.id == task_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.get("/api/projects/{project_id}/tasks", response_model=List[TaskOut])
def list_tasks(
    project_id: uuid.UUID,
    status: Optional[str] = Query(None),
    assignee_id: Optional[uuid.UUID] = Query(None),
    _member=Depends(require_project_member("member")),
    db: Session = Depends(get_db),
):
    q = (
        db.query(Task)
        .options(joinedload(Task.assignees), joinedload(Task.creator))
        .filter(Task.project_id == project_id)
    )
    if status:
        q = q.filter(Task.status == TaskStatus(status))
    if assignee_id:
        # Filter tasks that have this user in their assignees list
        q = q.filter(Task.assignees.any(User.id == assignee_id))
    return q.order_by(Task.created_at.desc()).all()


@router.post("/api/projects/{project_id}/tasks", response_model=TaskOut, status_code=201)
def create_task(
    project_id: uuid.UUID,
    payload: TaskCreate,
    current_user: User = Depends(get_current_user),
    _member=Depends(require_project_member("member")),
    db: Session = Depends(get_db),
):
    if payload.status not in [s.value for s in TaskStatus]:
        raise HTTPException(status_code=400, detail="Invalid status")
    if payload.priority not in [p.value for p in TaskPriority]:
        raise HTTPException(status_code=400, detail="Invalid priority")

    task = Task(
        project_id=project_id,
        title=payload.title,
        description=payload.description,
        status=TaskStatus(payload.status),
        priority=TaskPriority(payload.priority),
        due_date=payload.due_date,
        created_by=current_user.id,
    )
    db.add(task)
    db.flush()

    if payload.assignee_ids:
        assignees = db.query(User).filter(User.id.in_(payload.assignee_ids)).all()
        task.assignees = assignees

    db.commit()
    return _load_task(db, task.id)


@router.patch("/api/tasks/{task_id}", response_model=TaskOut)
def update_task(
    task_id: uuid.UUID,
    payload: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = _load_task(db, task_id)

    # Superadmin can always edit
    if current_user.role != "superadmin":
        member = db.query(ProjectMember).filter(
            ProjectMember.project_id == task.project_id,
            ProjectMember.user_id == current_user.id,
        ).first()
        if not member:
            raise HTTPException(status_code=403, detail="Not a project member")

        is_assignee = any(a.id == current_user.id for a in task.assignees)
        can_edit = (
            member.role == MemberRole.admin
            or task.created_by == current_user.id
            or is_assignee
        )
        if not can_edit:
            raise HTTPException(status_code=403, detail="Not authorized to edit this task")

    if payload.title is not None:
        task.title = payload.title
    if payload.description is not None:
        task.description = payload.description
    if payload.status is not None:
        task.status = TaskStatus(payload.status)
    if payload.priority is not None:
        task.priority = TaskPriority(payload.priority)
    if payload.due_date is not None:
        task.due_date = payload.due_date
    if payload.assignee_ids is not None:
        task.assignees = db.query(User).filter(User.id.in_(payload.assignee_ids)).all()

    db.commit()
    return _load_task(db, task.id)


@router.delete("/api/tasks/{task_id}", status_code=204)
def delete_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if current_user.role != "superadmin":
        member = db.query(ProjectMember).filter(
            ProjectMember.project_id == task.project_id,
            ProjectMember.user_id == current_user.id,
        ).first()
        if not member:
            raise HTTPException(status_code=403, detail="Not a project member")
        can_delete = member.role == MemberRole.admin or task.created_by == current_user.id
        if not can_delete:
            raise HTTPException(status_code=403, detail="Not authorized to delete this task")

    db.delete(task)
    db.commit()
