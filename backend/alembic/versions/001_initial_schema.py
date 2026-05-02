"""initial schema

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE EXTENSION IF NOT EXISTS pgcrypto;

        CREATE TYPE member_role AS ENUM ('admin', 'member');
        CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done');
        CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');

        CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX ix_users_email ON users(email);

        CREATE TABLE projects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE project_members (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role member_role NOT NULL DEFAULT 'member',
            joined_at TIMESTAMPTZ DEFAULT NOW(),
            CONSTRAINT uq_project_user UNIQUE (project_id, user_id)
        );

        CREATE TABLE tasks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            status task_status NOT NULL DEFAULT 'todo',
            priority task_priority NOT NULL DEFAULT 'medium',
            assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
            created_by UUID NOT NULL REFERENCES users(id),
            due_date DATE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)


def downgrade() -> None:
    op.execute("""
        DROP TABLE IF EXISTS tasks;
        DROP TABLE IF EXISTS project_members;
        DROP TABLE IF EXISTS projects;
        DROP TABLE IF EXISTS users;
        DROP TYPE IF EXISTS task_priority;
        DROP TYPE IF EXISTS task_status;
        DROP TYPE IF EXISTS member_role;
    """)
