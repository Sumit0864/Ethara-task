# Team Task Manager — Complete Build Plan

**Stack:** Python (FastAPI) + React + PostgreSQL + Railway
**Goal:** Ship a live, fully functional full-stack app for the Ethara AI assignment in 2–3 days.

---

## 1. Assignment Recap & Success Criteria

| Requirement | Deliverable |
|---|---|
| Authentication (Signup/Login) | JWT-based auth |
| Project & team management | Create projects, invite members |
| Task creation, assignment, status tracking | Full CRUD on tasks |
| Dashboard (tasks, status, overdue) | Stats + filtered views |
| REST APIs + Database | FastAPI + PostgreSQL |
| Validations & relationships | Pydantic + SQLAlchemy FKs |
| Role-Based Access Control (Admin/Member) | Middleware-enforced permissions |
| Deployment on Railway (mandatory) | Live URL |
| GitHub repo + README + 2–5 min demo video | Final submission |

---

## 2. Tech Stack (chosen for speed)

**Backend**
- FastAPI (auto Swagger docs — saves time on documentation)
- SQLAlchemy 2.0 + Alembic (migrations)
- PostgreSQL (Railway provides managed Postgres in 1 click)
- `python-jose` for JWT, `passlib[bcrypt]` for password hashing
- Pydantic v2 for validation

**Frontend**
- React (Vite — faster than CRA)
- React Router v6
- Axios for API calls
- TailwindCSS (fastest styling)
- Zustand (lighter than Redux for auth state)
- Recharts for dashboard charts

**Deployment**
- Railway: 1 service for backend, 1 for frontend, 1 Postgres add-on
- GitHub for source control + Railway auto-deploy on push

---

## 3. Data Model

```
User
  id, email (unique), password_hash, full_name, created_at

Project
  id, name, description, owner_id (FK User), created_at

ProjectMember
  id, project_id (FK), user_id (FK), role (ENUM: 'admin' | 'member'), joined_at
  UNIQUE(project_id, user_id)

Task
  id, project_id (FK), title, description,
  assignee_id (FK User, nullable), created_by (FK User),
  status (ENUM: 'todo' | 'in_progress' | 'done'),
  priority (ENUM: 'low' | 'medium' | 'high'),
  due_date (nullable), created_at, updated_at
```

**Relationship rules**
- Project owner is automatically an Admin in `ProjectMember`.
- Only Admins can: invite/remove members, delete project, change member roles, delete any task.
- Members can: create tasks, update tasks they created or are assigned to, view all project data.

---

## 4. REST API Endpoints

### Auth
| Method | Path | Body | Auth |
|---|---|---|---|
| POST | `/api/auth/signup` | email, password, full_name | No |
| POST | `/api/auth/login` | email, password | No |
| GET | `/api/auth/me` | — | Yes |

### Projects
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/api/projects` | Member+ | List user's projects |
| POST | `/api/projects` | Any logged-in | Creator becomes Admin |
| GET | `/api/projects/:id` | Member+ | Project detail |
| PATCH | `/api/projects/:id` | Admin | Update name/desc |
| DELETE | `/api/projects/:id` | Admin (owner) | |

### Members
| Method | Path | Role |
|---|---|---|
| GET | `/api/projects/:id/members` | Member+ |
| POST | `/api/projects/:id/members` | Admin |
| PATCH | `/api/projects/:id/members/:uid` | Admin |
| DELETE | `/api/projects/:id/members/:uid` | Admin |

### Tasks
| Method | Path | Role |
|---|---|---|
| GET | `/api/projects/:id/tasks` | Member+ (supports `?status=`, `?assignee=`) |
| POST | `/api/projects/:id/tasks` | Member+ |
| PATCH | `/api/tasks/:id` | Assignee / Creator / Admin |
| DELETE | `/api/tasks/:id` | Creator / Admin |

### Dashboard
| Method | Path |
|---|---|
| GET | `/api/dashboard/stats` — counts by status, overdue count, my tasks |

---

## 5. Project Structure

```
team-task-manager/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── routers/        # auth, projects, members, tasks, dashboard
│   │   ├── core/           # security, deps, rbac
│   │   └── utils/
│   ├── alembic/
│   ├── requirements.txt
│   ├── Procfile            # for Railway
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/            # axios client + endpoint funcs
│   │   ├── components/     # reusable UI
│   │   ├── pages/          # Login, Signup, Dashboard, ProjectList, ProjectDetail
│   │   ├── store/          # zustand auth store
│   │   ├── hooks/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
├── README.md
└── .gitignore
```

---

## 6. Day-by-Day Execution Plan (≈ 20 hours total)

### Day 1 — Backend Foundation (~7 hrs)

**Hour 1: Setup**
- Create GitHub repo, push initial scaffold
- `pip install fastapi uvicorn sqlalchemy psycopg2-binary alembic pydantic[email] python-jose[cryptography] passlib[bcrypt] python-multipart`
- Setup `database.py`, `config.py` reading from `.env`

**Hours 2–3: Models + Migrations**
- Write all SQLAlchemy models
- `alembic init alembic`, generate first migration, apply
- Seed script for testing

**Hours 4–5: Auth**
- Signup, login, JWT generation/validation
- `get_current_user` dependency
- Test in `/docs` (Swagger)

**Hours 6–7: RBAC + Project routes**
- `require_role(project_id, role)` dependency
- Project CRUD + member management
- Test all endpoints in Swagger

### Day 2 — Tasks, Dashboard, Frontend (~8 hrs)

**Hours 1–2: Task routes + Dashboard endpoint**
- Filtering by status/assignee/overdue
- Stats aggregation

**Hour 3: Frontend scaffold**
- `npm create vite@latest frontend -- --template react`
- Install deps: `axios react-router-dom zustand recharts tailwindcss`
- Setup Tailwind, axios interceptor (attach JWT, handle 401)

**Hours 4–5: Auth pages**
- Login + Signup forms with validation
- Zustand store persists token to localStorage
- Protected route wrapper

**Hours 6–8: Project list + detail pages**
- Project list with "Create Project" modal
- Project detail: tabs for Tasks / Members
- Task board (3 columns: Todo / In Progress / Done) — keep simple, no drag-drop initially
- Add/edit task modals

### Day 3 — Dashboard, Polish, Deploy (~5 hrs)

**Hour 1: Dashboard page**
- Stat cards: total tasks, by status, overdue
- Recharts pie/bar for status breakdown
- "My tasks" list

**Hour 2: Validation + Error handling**
- Form-level validation messages
- Toast notifications for API errors (`react-hot-toast`)
- Loading states

**Hours 3–4: Railway deployment**
- Push code to GitHub
- Railway: New Project → Deploy from GitHub
- Add Postgres plugin → copy `DATABASE_URL` to backend env
- Backend: set `Procfile` → `web: alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Frontend: Railway static site, build command `npm run build`, set `VITE_API_URL` env var
- Configure CORS in backend to allow frontend domain
- Test live URL end-to-end

**Hour 5: README + Demo Video**
- Write README (see section 9)
- Record 2–5 min demo using Loom/OBS

---

## 7. Deployment Checklist (Railway)

1. **Create Railway project** → connect GitHub repo
2. **Add PostgreSQL** plugin → auto-injects `DATABASE_URL`
3. **Backend service**
   - Root directory: `/backend`
   - Build: `pip install -r requirements.txt`
   - Start: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Env vars: `DATABASE_URL`, `JWT_SECRET`, `JWT_ALGORITHM=HS256`, `ACCESS_TOKEN_EXPIRE_MINUTES=10080`, `CORS_ORIGINS=https://<frontend>.up.railway.app`
4. **Frontend service**
   - Root directory: `/frontend`
   - Build: `npm install && npm run build`
   - Start: `npx serve -s dist -l $PORT`
   - Env var: `VITE_API_URL=https://<backend>.up.railway.app`
5. **Verify:** signup → create project → add task → check dashboard. All working = ready to submit.

---

## 8. RBAC Implementation Snippet (reference)

```python
# core/rbac.py
from fastapi import Depends, HTTPException, status

def require_project_role(required: str):
    def checker(project_id: int, user=Depends(get_current_user), db=Depends(get_db)):
        member = db.query(ProjectMember).filter_by(
            project_id=project_id, user_id=user.id
        ).first()
        if not member:
            raise HTTPException(403, "Not a project member")
        if required == "admin" and member.role != "admin":
            raise HTTPException(403, "Admin access required")
        return member
    return checker
```

Use as: `Depends(require_project_role("admin"))` on protected routes.

---

## 9. README Outline

```
# Team Task Manager

Live: https://<frontend>.up.railway.app
API:  https://<backend>.up.railway.app/docs

## Features
- JWT auth (signup/login)
- Projects with Admin/Member roles
- Task creation, assignment, status tracking
- Dashboard with stats and overdue tracking

## Tech Stack
Backend: FastAPI, SQLAlchemy, PostgreSQL
Frontend: React (Vite), TailwindCSS, Zustand
Deployment: Railway

## Local Setup
[backend + frontend setup commands]

## Environment Variables
[list with examples]

## API Documentation
Auto-generated at /docs (Swagger UI)

## Demo
[Loom video link]

## Architecture
[short paragraph + simple diagram]
```

---

## 10. Demo Video Script (3 minutes)

1. **(0:00–0:20)** Intro: "Team Task Manager built with FastAPI + React, deployed on Railway."
2. **(0:20–0:50)** Signup new user → login → land on dashboard.
3. **(0:50–1:30)** Create project → invite second user as Member → show role badge.
4. **(1:30–2:15)** Create tasks, assign to member, change status, set overdue date.
5. **(2:15–2:45)** Dashboard: show stats, overdue, status breakdown chart.
6. **(2:45–3:00)** Show RBAC: log in as Member, try to delete project → 403 error.

---

## 11. Speed Hacks (do these to save time)

- Use FastAPI's `/docs` instead of building API tests
- Skip drag-and-drop for tasks — use a status dropdown (cuts hours)
- Use Tailwind's default colors, no custom theme
- Use Recharts default styling, no customization
- For invites: just look up users by email (no email-sending flow)
- Hard-code 2 default seed users in production for the demo

---

## 12. Common Pitfalls to Avoid

- **CORS errors on Railway**: configure `CORS_ORIGINS` correctly, include the exact frontend URL with `https://`
- **Postgres URL format**: Railway gives `postgres://`, SQLAlchemy needs `postgresql://` — replace it in code
- **Alembic on Railway**: run migrations on startup via Procfile, not manually
- **JWT secret**: never commit; set in Railway env vars
- **Frontend env vars**: Vite requires `VITE_` prefix; rebuild after changing
- **Password validation**: enforce minimum 8 chars, return clear errors

---

## 13. Final Submission Checklist

- [ ] Live URL works (signup, login, full flow)
- [ ] GitHub repo is public and clean (no `.env`, no `node_modules`)
- [ ] README has live URL, setup instructions, screenshots
- [ ] Demo video recorded (2–5 min) and linked in README
- [ ] All 4 deliverables sent: Live URL, GitHub repo, README, video