"""superadmin role + multi-assignee tasks

Revision ID: 002
Revises: 001
Create Date: 2024-01-02 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        -- 1. Add role column to users (default 'user')
        ALTER TABLE users ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'user';

        -- 2. Drop the old single-assignee column from tasks
        ALTER TABLE tasks DROP COLUMN IF EXISTS assignee_id;

        -- 3. Create the many-to-many assignees table
        CREATE TABLE task_assignees (
            task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            PRIMARY KEY (task_id, user_id)
        );
    """)


def downgrade() -> None:
    op.execute("""
        DROP TABLE IF EXISTS task_assignees;
        ALTER TABLE tasks ADD COLUMN assignee_id UUID REFERENCES users(id) ON DELETE SET NULL;
        ALTER TABLE users DROP COLUMN IF EXISTS role;
    """)
