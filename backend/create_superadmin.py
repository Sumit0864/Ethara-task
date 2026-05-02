"""
Create or promote a user to superadmin.

Usage:
    python create_superadmin.py                                    # uses defaults
    python create_superadmin.py email password "Full Name"
    python create_superadmin.py admin@example.com MyPass123 "Admin"

Defaults:
    email    : superadmin@taskmanager.com
    password : SuperAdmin@123
    full_name: Super Admin
"""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models.user import User
from app.core.security import hash_password


def create_or_promote(email: str, password: str, full_name: str) -> None:
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            if existing.role == "superadmin":
                print(f"[ok] {email} is already a superadmin.")
            else:
                existing.role = "superadmin"
                db.commit()
                print(f"[promoted] {email} ({existing.full_name}) is now a superadmin.")
            return

        user = User(
            email=email,
            password_hash=hash_password(password),
            full_name=full_name,
            role="superadmin",
        )
        db.add(user)
        db.commit()
        print(f"[created] Superadmin account created.")
        print(f"          Email   : {email}")
        print(f"          Password: {password}")
        print(f"          Name    : {full_name}")
    finally:
        db.close()


if __name__ == "__main__":
    _email = sys.argv[1] if len(sys.argv) > 1 else "superadmin@taskmanager.com"
    _password = sys.argv[2] if len(sys.argv) > 2 else "SuperAdmin@123"
    _name = sys.argv[3] if len(sys.argv) > 3 else "Super Admin"
    create_or_promote(_email, _password, _name)
