"""add teams, time_records, update user roles

Revision ID: 003_teams_roles_timerecords
Revises: 002_superadmin_multi_assignee
Create Date: 2026-05-03
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Create teams table
    op.create_table(
        "teams",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("lead_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # 2. Add team_id and created_by to users
    op.add_column("users", sa.Column("team_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("teams.id", ondelete="SET NULL"), nullable=True))
    op.add_column("users", sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True))

    # 3. Migrate role values: 'user' -> 'tasker'
    op.execute("UPDATE users SET role = 'tasker' WHERE role = 'user'")

    # 4. Create time_records table
    op.create_table(
        "time_records",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("task_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("date", sa.Date, nullable=False),
        sa.Column("hours", sa.Float, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_time_records_task_id", "time_records", ["task_id"])
    op.create_index("ix_time_records_user_id", "time_records", ["user_id"])
    op.create_index("ix_time_records_date", "time_records", ["date"])


def downgrade() -> None:
    op.drop_table("time_records")
    op.execute("UPDATE users SET role = 'user' WHERE role = 'tasker'")
    op.drop_column("users", "created_by")
    op.drop_column("users", "team_id")
    op.drop_table("teams")
