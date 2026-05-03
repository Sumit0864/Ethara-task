from __future__ import annotations
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.core.deps import get_current_user, require_superadmin
from app.models.user import User
from app.models.team import Team
from app.schemas.team import TeamCreate, TeamUpdate, TeamOut, TeamDetailOut
from app.schemas.auth import UserOut
import uuid

router = APIRouter(prefix="/api/teams", tags=["teams"])


@router.get("", response_model=List[TeamDetailOut])
def list_teams(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "superadmin":
        teams = db.query(Team).options(joinedload(Team.lead), joinedload(Team.members)).all()
    elif current_user.role == "team_lead":
        teams = (
            db.query(Team)
            .options(joinedload(Team.lead), joinedload(Team.members))
            .filter(Team.lead_id == current_user.id)
            .all()
        )
    else:
        # Taskers see their own team
        if current_user.team_id:
            teams = (
                db.query(Team)
                .options(joinedload(Team.lead), joinedload(Team.members))
                .filter(Team.id == current_user.team_id)
                .all()
            )
        else:
            teams = []
    return teams


@router.post("", response_model=TeamDetailOut, status_code=201)
def create_team(
    payload: TeamCreate,
    _sa: User = Depends(require_superadmin),
    db: Session = Depends(get_db),
):
    if payload.lead_id:
        lead = db.query(User).filter(User.id == payload.lead_id).first()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead user not found")
        if lead.role not in ("team_lead", "superadmin"):
            # Promote to team_lead if they are a tasker
            lead.role = "team_lead"

    team = Team(name=payload.name, description=payload.description, lead_id=payload.lead_id)
    db.add(team)
    db.flush()

    # If lead exists, assign them to this team
    if payload.lead_id:
        lead = db.query(User).filter(User.id == payload.lead_id).first()
        if lead:
            lead.team_id = team.id

    db.commit()
    return (
        db.query(Team)
        .options(joinedload(Team.lead), joinedload(Team.members))
        .filter(Team.id == team.id)
        .first()
    )


@router.get("/{team_id}", response_model=TeamDetailOut)
def get_team(
    team_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    team = (
        db.query(Team)
        .options(joinedload(Team.lead), joinedload(Team.members))
        .filter(Team.id == team_id)
        .first()
    )
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Access control
    if current_user.role == "superadmin":
        pass
    elif current_user.role == "team_lead" and team.lead_id == current_user.id:
        pass
    elif current_user.team_id == team_id:
        pass
    else:
        raise HTTPException(status_code=403, detail="Not authorized to view this team")

    return team


@router.patch("/{team_id}", response_model=TeamDetailOut)
def update_team(
    team_id: uuid.UUID,
    payload: TeamUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if current_user.role != "superadmin" and team.lead_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this team")

    if payload.name is not None:
        team.name = payload.name
    if payload.description is not None:
        team.description = payload.description
    if payload.lead_id is not None:
        team.lead_id = payload.lead_id

    db.commit()
    return (
        db.query(Team)
        .options(joinedload(Team.lead), joinedload(Team.members))
        .filter(Team.id == team_id)
        .first()
    )


@router.delete("/{team_id}", status_code=204)
def delete_team(
    team_id: uuid.UUID,
    _sa: User = Depends(require_superadmin),
    db: Session = Depends(get_db),
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Unassign members from team before deletion
    db.query(User).filter(User.team_id == team_id).update({"team_id": None})
    db.delete(team)
    db.commit()
