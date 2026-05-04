# 🗂️ Team Task Manager

A full-stack web application for managing team projects and tasks with **role-based access control (RBAC)**. Built with FastAPI + React and deployed on Railway.

---

## 🔗 Links

| Resource | URL |
|---|---|
| 🌐 Live App | https://ethara-task-production-f269.up.railway.app/dashboard |
| 📦 GitHub Repo | _https://github.com/Sumit0864/ethara-task_ |

---

## ✨ Features

- 🔐 **JWT Authentication** — Secure signup & login
- 🏗️ **Projects** — Create projects, each with its own team & tasks
- 👥 **Team Management** — Invite members, assign roles (Admin / Member)
- ✅ **Tasks** — Create, assign (to multiple people), track status & priority
- 📊 **Dashboard** — Personal stats: total tasks, overdue, by-status breakdown
- 🛡️ **Role-Based Access Control** — Three-tier system: Superadmin › Admin › Member

---

## 🧱 Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | REST API framework (auto Swagger docs at `/docs`) |
| **SQLAlchemy 2.0** | ORM (Object Relational Mapper) |
| **Alembic** | Database migrations |
| **PostgreSQL** | Relational database |
| **python-jose** | JWT token generation & validation |
| **passlib[bcrypt]** | Password hashing |
| **Pydantic v2** | Request/response validation |

### Frontend
| Technology | Purpose |
|---|---|
| **React (Vite)** | UI framework |
| **React Router v6** | Client-side routing |
| **Axios** | HTTP client |
| **TailwindCSS** | Styling |
| **Zustand** | Auth state management |
| **Recharts** | Dashboard charts |

### Deployment
| Service | Role |
|---|---|
| **Railway** | Hosts backend, frontend, and PostgreSQL |
| **GitHub** | Source control + Railway auto-deploy on push |

---

## 👤 Role System — Who Can Do What

This app has **three roles**. Two are project-level (Admin, Member) and one is system-level (Superadmin).

---

### 🔴 Superadmin
> A platform-wide administrator. Not tied to any specific project.

**How to create one:**
```bash
# Default credentials
make superadmin

# Or with custom credentials
make superadmin EMAIL=me@example.com PASS=Secret123 NAME="My Admin"
```

**What they can do:**
- ✅ Log in and view **all projects** across the entire platform
- ✅ Read, update, and delete **any task** in any project
- ✅ Access any project's detail and member list
- ✅ View dashboard stats for the whole system
- ✅ Bypass all project membership checks automatically
- ✅ List all registered users via `/api/auth/users`
- ❌ Cannot be created through the signup form (script only)

> **Implementation:** In `rbac.py`, every protected route checks `if current_user.role == "superadmin"` first and grants full access if true, before any other membership or role checks.

---

### 🟠 Admin (Project-level)
> An admin of a **specific project**. The user who creates a project automatically becomes its admin.

**How to become one:**
- Create a new project → you are automatically the admin
- Another admin can promote a Member to Admin via the Members tab

**What they can do:**
- ✅ Everything a Member can do, plus:
- ✅ **Update project** name/description
- ✅ **Delete the project** (owner only)
- ✅ **Invite users** to the project by email
- ✅ **Change a member's role** (promote/demote)
- ✅ **Remove any member** from the project
- ✅ **Delete any task** in the project (not just their own)
- ❌ Cannot manage other projects they don't own/admin

> **Implementation:** Routes with `Depends(require_project_member("admin"))` check that the calling user's `ProjectMember.role == "admin"` for that specific project.

---

### 🟢 Member (Project-level)
> A regular participant in a project. Invited by an Admin.

**How to become one:**
- Sign up at `/signup`
- Get invited by a project Admin

**What they can do:**
- ✅ **View** all project details, tasks, and members
- ✅ **Create tasks** in projects they belong to
- ✅ **Update tasks** they created or are assigned to
- ✅ **Delete tasks** they created
- ✅ See the **dashboard** (shows their own assigned tasks / stats)
- ❌ Cannot invite or remove other members
- ❌ Cannot change member roles
- ❌ Cannot update or delete the project
- ❌ Cannot delete tasks created by others

> **Implementation:** Routes with `Depends(require_project_member("member"))` only verify the user exists in `ProjectMember` for that project.

---

### Role Comparison Table

| Action | Member | Admin | Superadmin |
|---|:---:|:---:|:---:|
| Sign up / Log in | ✅ | ✅ | ✅ |
| View joined projects | ✅ | ✅ | ✅ (all) |
| Create a project | ✅ | ✅ | ✅ |
| Update project name/desc | ❌ | ✅ | ✅ |
| Delete project | ❌ | ✅ (owner) | ✅ |
| View project tasks | ✅ | ✅ | ✅ |
| Create tasks | ✅ | ✅ | ✅ |
| Update own / assigned tasks | ✅ | ✅ | ✅ |
| Delete any task | ❌ | ✅ | ✅ |
| Invite members | ❌ | ✅ | ✅ |
| Change member roles | ❌ | ✅ | ✅ |
| Remove members | ❌ | ✅ | ✅ |
| List all users | ✅ | ✅ | ✅ |
| Access all projects | ❌ | ❌ | ✅ |

---

## 🗄️ Data Model

```
User
  id (UUID)  email (unique)  password_hash  full_name
  role: "user" | "superadmin"   created_at  updated_at

Project
  id (UUID)  name  description
  owner_id → User   created_at  updated_at

ProjectMember               ← links User ↔ Project
  project_id → Project
  user_id    → User
  role: "admin" | "member"  joined_at
  UNIQUE(project_id, user_id)

Task
  id (UUID)  project_id → Project  title  description
  status: "todo" | "in_progress" | "done"
  priority: "low" | "medium" | "high"
  created_by → User   due_date   created_at  updated_at

task_assignees              ← many-to-many Task ↔ User
  task_id → Task
  user_id → User
```

**Rules:**
- A user who creates a project is automatically added to `ProjectMember` with role `admin`.
- A task can be assigned to **multiple users** (via `task_assignees` join table).
- Deleting a project cascades to all its members and tasks.

---

## 🌐 API Endpoints

All endpoints are prefixed with `/api`. Full interactive docs at `/docs`.

### 🔐 Auth
| Method | Path | Auth Required | Description |
|---|---|:---:|---|
| `POST` | `/api/auth/signup` | ❌ | Register a new user |
| `POST` | `/api/auth/login` | ❌ | Login, receive JWT |
| `GET` | `/api/auth/me` | ✅ | Get current user info |
| `GET` | `/api/auth/users` | ✅ | List all users (for invite search) |

### 📁 Projects
| Method | Path | Required Role | Description |
|---|---|---|---|
| `GET` | `/api/projects` | Any logged-in | List user's projects |
| `POST` | `/api/projects` | Any logged-in | Create project (becomes Admin) |
| `GET` | `/api/projects/:id` | Member+ | Get project details |
| `PATCH` | `/api/projects/:id` | Admin | Update project name/desc |
| `DELETE` | `/api/projects/:id` | Admin (owner) | Delete project |

### 👥 Members
| Method | Path | Required Role | Description |
|---|---|---|---|
| `GET` | `/api/projects/:id/members` | Member+ | List project members |
| `POST` | `/api/projects/:id/members` | Admin | Invite a user by ID |
| `PATCH` | `/api/projects/:id/members/:uid` | Admin | Change a member's role |
| `DELETE` | `/api/projects/:id/members/:uid` | Admin | Remove a member |

### ✅ Tasks
| Method | Path | Required Role | Description |
|---|---|---|---|
| `GET` | `/api/projects/:id/tasks` | Member+ | List tasks (filter: `?status=`, `?assignee=`) |
| `POST` | `/api/projects/:id/tasks` | Member+ | Create a task |
| `PATCH` | `/api/tasks/:id` | Assignee/Creator/Admin | Update task |
| `DELETE` | `/api/tasks/:id` | Creator/Admin | Delete task |

### 📊 Dashboard
| Method | Path | Auth Required | Description |
|---|---|:---:|---|
| `GET` | `/api/dashboard/stats` | ✅ | My stats: total tasks, by status, overdue |

---

## 🚀 Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (local or cloud)

### 1. Clone the repo
```bash
git clone https://github.com/your-username/ethara-task.git
cd ethara-task
```

### 2. Set up environment variables

**Backend** — copy and edit:
```bash
cp backend/.env.example backend/.env
```

```env
DATABASE_URL=postgresql://user:password@localhost:5432/taskmanager
JWT_SECRET=your-super-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
CORS_ORIGINS=http://localhost:5173
```

**Frontend** — copy and edit:
```bash
cp frontend/.env.example frontend/.env
```

```env
VITE_API_URL=http://localhost:8000
```

### 3. Install dependencies
```bash
make install
```
This creates a Python venv, installs pip packages, and runs `npm install`.

### 4. Run database migrations
```bash
make migrate
```

### 5. (Optional) Create a Superadmin
```bash
# Default: superadmin@taskmanager.com / SuperAdmin@123
make superadmin

# Custom credentials:
make superadmin EMAIL=you@example.com PASS=YourPass123 NAME="Your Name"
```

### 6. Start the servers

In two separate terminals:
```bash
make backend    # FastAPI on http://localhost:8000
make frontend   # React/Vite on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## 🧪 Testing the App Manually

### Scenario 1 — Normal signup flow
1. Go to `/signup`, create an account → you are a **Member** by default
2. Create a new project → you instantly become the **Admin** of that project
3. Go to Members tab → invite another user to the project
4. Create tasks, assign them, change status

### Scenario 2 — Role enforcement
1. Log in as a Member of a project
2. Try to edit the project name → button is hidden (Admin only)
3. Try to delete another user's task → blocked with 403

### Scenario 3 — Superadmin
1. Create a superadmin with `make superadmin`
2. Log in with those credentials
3. You can see **all projects** in the system, not just yours
4. You can update/delete any task without being a member

---

## ☁️ Deployment (Railway)

### Steps
1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add a **PostgreSQL** plugin → Railway auto-injects `DATABASE_URL`

**Backend service settings:**
| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

**Backend environment variables:**
```env
DATABASE_URL=<auto-injected by Railway>
JWT_SECRET=<generate a strong secret>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
CORS_ORIGINS=https://your-frontend.up.railway.app
```

**Frontend service settings:**
| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Start Command | `npx serve -s dist -l $PORT` |

**Frontend environment variables:**
```env
VITE_API_URL=https://your-backend.up.railway.app
```

> ⚠️ After deploying, create the superadmin by running the script once inside Railway's shell:
> ```bash
> python create_superadmin.py admin@example.com SecurePass123 "Admin"
> ```

---

## 📁 Project Structure

```
ethara-task/
├── Makefile                        ← dev shortcuts (backend/frontend/migrate/superadmin)
├── docker-compose.yml              ← optional local Docker setup
│
├── backend/
│   ├── app/
│   │   ├── main.py                 ← FastAPI app entry point
│   │   ├── config.py               ← reads .env variables
│   │   ├── database.py             ← SQLAlchemy engine + session
│   │   ├── models/
│   │   │   ├── user.py             ← User model (role field: user/superadmin)
│   │   │   ├── project.py          ← Project + ProjectMember models
│   │   │   └── task.py             ← Task + task_assignees join table
│   │   ├── schemas/                ← Pydantic request/response schemas
│   │   ├── routers/
│   │   │   ├── auth.py             ← signup, login, /me, list users
│   │   │   ├── projects.py         ← project CRUD
│   │   │   ├── members.py          ← invite, change role, remove
│   │   │   ├── tasks.py            ← task CRUD + filters
│   │   │   └── dashboard.py        ← stats aggregation
│   │   └── core/
│   │       ├── security.py         ← JWT creation, bcrypt hashing
│   │       ├── deps.py             ← get_current_user dependency
│   │       └── rbac.py             ← require_project_member() factory
│   ├── alembic/                    ← migration scripts
│   ├── create_superadmin.py        ← CLI script to seed superadmin
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    └── src/
        ├── api/                    ← axios client + typed endpoint functions
        ├── components/             ← reusable UI components
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Dashboard.jsx       ← stat cards + chart
        │   ├── Projects.jsx        ← project list + create modal
        │   └── ProjectDetail.jsx   ← tasks board + members tab
        ├── store/                  ← Zustand auth store (persists JWT)
        ├── App.jsx                 ← routes + protected route wrapper
        └── main.jsx
```

---

## 🔒 Security Notes

- Passwords are hashed with **bcrypt** (never stored as plain text)
- JWT tokens expire after **7 days** (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`)
- Never commit `.env` files — they are in `.gitignore`
- CORS is restricted to the configured frontend origin only

---

## 📝 Environment Variables Reference

| Variable | Required | Description |
|---|:---:|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret key for signing JWTs (keep private) |
| `JWT_ALGORITHM` | ✅ | Always `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | ✅ | Token lifetime (default: `10080` = 7 days) |
| `CORS_ORIGINS` | ✅ | Comma-separated allowed frontend URLs |
| `VITE_API_URL` | ✅ | Backend base URL for frontend API calls |

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push and open a PR

---

*Built for the Ethara AI Full-Stack Assignment.*
