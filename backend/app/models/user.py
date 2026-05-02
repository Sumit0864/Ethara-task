from __future__ import annotations
import uuid
from datetime import datetime
from typing import List
from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    # 'superadmin' can see everything; 'user' is everyone else
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="user")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owned_projects: Mapped[List[Project]] = relationship("Project", back_populates="owner", foreign_keys="Project.owner_id")
    project_memberships: Mapped[List[ProjectMember]] = relationship("ProjectMember", back_populates="user")
    assigned_tasks: Mapped[List[Task]] = relationship("Task", secondary="task_assignees", back_populates="assignees")
    created_tasks: Mapped[List[Task]] = relationship("Task", back_populates="creator", foreign_keys="Task.created_by")
