from __future__ import annotations
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.core.deps import get_current_user
from app.core.rbac import require_project_member
from app.models.user import User
from app.models.project import Project, ProjectMember, MemberRole
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectOut, ProjectDetailOut
import uuid

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("", response_model=List[ProjectOut])
def list_projects(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Superadmin sees every project
    if current_user.role == "superadmin":
        return (
            db.query(Project)
            .options(joinedload(Project.owner))
            .order_by(Project.created_at.desc())
            .all()
        )

    memberships = db.query(ProjectMember).filter(ProjectMember.user_id == current_user.id).all()
    project_ids = [m.project_id for m in memberships]
    if not project_ids:
        return []
    return (
        db.query(Project)
        .options(joinedload(Project.owner))
        .filter(Project.id.in_(project_ids))
        .order_by(Project.created_at.desc())
        .all()
    )


@router.post("", response_model=ProjectDetailOut, status_code=201)
def create_project(
    payload: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = Project(name=payload.name, description=payload.description, owner_id=current_user.id)
    db.add(project)
    db.flush()

    member = ProjectMember(project_id=project.id, user_id=current_user.id, role=MemberRole.admin)
    db.add(member)
    db.commit()
    db.refresh(project)

    return (
        db.query(Project)
        .options(joinedload(Project.owner), joinedload(Project.members).joinedload(ProjectMember.user))
        .filter(Project.id == project.id)
        .first()
    )


@router.get("/{project_id}", response_model=ProjectDetailOut)
def get_project(
    project_id: uuid.UUID,
    _member=Depends(require_project_member("member")),
    db: Session = Depends(get_db),
):
    project = (
        db.query(Project)
        .options(joinedload(Project.owner), joinedload(Project.members).joinedload(ProjectMember.user))
        .filter(Project.id == project_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.patch("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: uuid.UUID,
    payload: ProjectUpdate,
    _member=Depends(require_project_member("admin")),
    db: Session = Depends(get_db),
):
    project = db.query(Project).options(joinedload(Project.owner)).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if payload.name is not None:
        project.name = payload.name
    if payload.description is not None:
        project.description = payload.description
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: uuid.UUID,
    _member=Depends(require_project_member("admin")),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
