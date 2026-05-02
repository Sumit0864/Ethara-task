from __future__ import annotations
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.core.deps import get_current_user
from app.core.rbac import require_project_member
from app.models.user import User
from app.models.project import Project, ProjectMember, MemberRole
from app.schemas.project import MemberOut, MemberAdd, MemberRoleUpdate
import uuid

router = APIRouter(prefix="/api/projects/{project_id}/members", tags=["members"])


@router.get("", response_model=List[MemberOut])
def list_members(
    project_id: uuid.UUID,
    _member=Depends(require_project_member("member")),
    db: Session = Depends(get_db),
):
    return (
        db.query(ProjectMember)
        .options(joinedload(ProjectMember.user))
        .filter(ProjectMember.project_id == project_id)
        .all()
    )


@router.post("", response_model=MemberOut, status_code=201)
def add_member(
    project_id: uuid.UUID,
    payload: MemberAdd,
    _member=Depends(require_project_member("admin")),
    db: Session = Depends(get_db),
):
    if payload.role not in ("admin", "member"):
        raise HTTPException(status_code=400, detail="Role must be 'admin' or 'member'")

    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User with that email not found")

    existing = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member")

    new_member = ProjectMember(
        project_id=project_id,
        user_id=user.id,
        role=MemberRole(payload.role),
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)

    return db.query(ProjectMember).options(joinedload(ProjectMember.user)).filter(ProjectMember.id == new_member.id).first()


@router.patch("/{user_id}", response_model=MemberOut)
def update_member_role(
    project_id: uuid.UUID,
    user_id: uuid.UUID,
    payload: MemberRoleUpdate,
    current_user: User = Depends(get_current_user),
    _member=Depends(require_project_member("admin")),
    db: Session = Depends(get_db),
):
    if payload.role not in ("admin", "member"):
        raise HTTPException(status_code=400, detail="Role must be 'admin' or 'member'")

    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id,
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    if user_id == current_user.id and payload.role != "admin":
        admin_count = db.query(ProjectMember).filter(
            ProjectMember.project_id == project_id,
            ProjectMember.role == MemberRole.admin,
        ).count()
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot demote the only admin")

    member.role = MemberRole(payload.role)
    db.commit()
    db.refresh(member)
    return db.query(ProjectMember).options(joinedload(ProjectMember.user)).filter(ProjectMember.id == member.id).first()


@router.delete("/{user_id}", status_code=204)
def remove_member(
    project_id: uuid.UUID,
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    _member=Depends(require_project_member("admin")),
    db: Session = Depends(get_db),
):
    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id,
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    project = db.query(Project).filter(Project.id == project_id).first()
    if project and project.owner_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot remove the project owner")

    db.delete(member)
    db.commit()
