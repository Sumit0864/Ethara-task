from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.project import Project, ProjectMember
import uuid


def require_project_member(required_role: str = "member"):
    """
    Dependency factory: checks user is a project member (optionally admin).
    Superadmins bypass all project membership checks.
    Returns the ProjectMember row, or a synthetic sentinel for superadmins.
    """
    def checker(
        project_id: uuid.UUID,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> ProjectMember:
        # Superadmin bypasses everything
        if current_user.role == "superadmin":
            project = db.query(Project).filter(Project.id == project_id).first()
            if not project:
                raise HTTPException(status_code=404, detail="Project not found")
            # Return a synthetic member with admin-level role so callers can rely on it
            synthetic = ProjectMember()
            synthetic.role = "admin"
            synthetic.user_id = current_user.id
            synthetic.project_id = project_id
            return synthetic

        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        member = (
            db.query(ProjectMember)
            .filter(ProjectMember.project_id == project_id, ProjectMember.user_id == current_user.id)
            .first()
        )
        if not member:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a project member")

        if required_role == "admin" and member.role != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Project admin access required")

        return member

    return checker
