from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import auth, projects, members, tasks, dashboard, teams, users, time_records

settings = get_settings()

app = FastAPI(title="Team Task Manager API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(members.router)
app.include_router(tasks.router)
app.include_router(dashboard.router)
app.include_router(teams.router)
app.include_router(users.router)
app.include_router(time_records.router)


@app.get("/health")
def health():
    return {"status": "ok"}
