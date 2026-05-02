BACKEND_DIR=backend
FRONTEND_DIR=frontend

.PHONY: backend frontend migrate install superadmin

backend:
	cd $(BACKEND_DIR) && source venv/bin/activate && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

frontend:
	cd $(FRONTEND_DIR) && npm run dev

migrate:
	cd $(BACKEND_DIR) && source venv/bin/activate && alembic upgrade head

install:
	cd $(BACKEND_DIR) && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
	cd $(FRONTEND_DIR) && npm install

# make superadmin
# make superadmin EMAIL=me@example.com PASS=Secret123 NAME="My Admin"
EMAIL ?= superadmin@taskmanager.com
PASS  ?= SuperAdmin@123
NAME  ?= Super Admin
superadmin:
	cd $(BACKEND_DIR) && source venv/bin/activate && python create_superadmin.py "$(EMAIL)" "$(PASS)" "$(NAME)"
