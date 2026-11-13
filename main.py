"""Root application entrypoint for cloud platforms (Render, Railway, Heroku, etc.)."""
import os
import sys

# Ensure backend directory is in Python path
BACKEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Load environment variables from backend/.env if present
env_path = os.path.join(BACKEND_DIR, ".env")
if os.path.exists(env_path):
    try:
        from dotenv import load_dotenv
        load_dotenv(env_path)
    except Exception:
        pass

from app.main import app  # noqa: E402, F401
