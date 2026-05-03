from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import get_current_user
from app.core.security import hash_password
from app.models.user import User
from app.models.team import Team
from app.schemas.auth import UserCreateByAdmin, UserOut
import uuid

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=List[UserOut])
def list_users(
    role: Optional[str] = Query(None),
    team_id: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(User)

    if current_user.role == "superadmin":
        pass  # see all
    elif current_user.role == "team_lead":
        # Team lead sees their own team members + themselves
        lead_team = db.query(Team).filter(Team.lead_id == current_user.id).first()
        if lead_team:
            q = q.filter((User.team_id == lead_team.id) | (User.id == current_user.id))
        else:
            q = q.filter(User.id == current_user.id)
    else:
        # Taskers see only themselves
        q = q.filter(User.id == current_user.id)

    if role:
        q = q.filter(User.role == role)
    if team_id:
        q = q.filter(User.team_id == team_id)

    return q.order_by(User.full_name).all()


@router.post("", response_model=UserOut, status_code=201)
def create_user(
    payload: UserCreateByAdmin,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Only superadmin and team_lead can create users
    if current_user.role not in ("superadmin", "team_lead"):
        raise HTTPException(status_code=403, detail="Not authorized to create users")

    # Team leads can only create taskers
    if current_user.role == "team_lead" and payload.role != "tasker":
        raise HTTPException(status_code=403, detail="Team leads can only create tasker accounts")

    # Check email uniqueness
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Determine team_id
    team_id = payload.team_id
    if current_user.role == "team_lead":
        lead_team = db.query(Team).filter(Team.lead_id == current_user.id).first()
        if not lead_team:
            raise HTTPException(status_code=400, detail="You don't lead any team")
        team_id = lead_team.id

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
        team_id=team_id,
        created_by=current_user.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: uuid.UUID,
    full_name: Optional[str] = None,
    role: Optional[str] = None,
    team_id: Optional[uuid.UUID] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    # Access control
    if current_user.role == "superadmin":
        pass
    elif current_user.role == "team_lead":
        lead_team = db.query(Team).filter(Team.lead_id == current_user.id).first()
        if not lead_team or target.team_id != lead_team.id:
            raise HTTPException(status_code=403, detail="Can only edit your team members")
        if role and role != "tasker":
            raise HTTPException(status_code=403, detail="Team leads can only assign tasker role")
    else:
        raise HTTPException(status_code=403, detail="Not authorized")

    if full_name is not None:
        target.full_name = full_name
    if role is not None and current_user.role == "superadmin":
        target.role = role
    if team_id is not None and current_user.role == "superadmin":
        target.team_id = team_id

    db.commit()
    db.refresh(target)
    return target


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    if target.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    if current_user.role == "superadmin":
        pass
    elif current_user.role == "team_lead":
        lead_team = db.query(Team).filter(Team.lead_id == current_user.id).first()
        if not lead_team or target.team_id != lead_team.id:
            raise HTTPException(status_code=403, detail="Can only delete your team members")
        if target.role != "tasker":
            raise HTTPException(status_code=403, detail="Can only delete tasker accounts")
    else:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(target)
    db.commit()
