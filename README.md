# AI-Assisted Drone Fleet Management Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688.svg?style=flat&logo=FastAPI)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB.svg?style=flat&logo=React)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1.svg?style=flat&logo=PostgreSQL)](https://www.postgresql.org/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-1.5%20Flash-4285F4.svg?style=flat&logo=google)](https://aistudio.google.com/)
[![Docker](https://img.shields.io/badge/Dockerfiles-Included-2496ED.svg?style=flat&logo=docker)](https://www.docker.com/)

An enterprise-grade commercial autonomous drone fleet management SaaS web application built with **React.js**, **FastAPI**, **PostgreSQL**, **Redis**, **Pandas**, and **Google Gemini AI**.

---

## 🌟 Key Features

1. **Futuristic Commercial SaaS Interface**
   - Dark navy and obsidian gradients with cyan, electric blue, and purple neon accents.
   - Glassmorphism translucent surfaces, responsive layouts for desktop, tablet, and mobile.
   - Smooth transitions, animated radar oscilloscope, and status indicators.

2. **Public Landing Page**
   - High-impact hero section with animated radar and autonomous operations showcase.
   - Live metrics summary: 24+ Active Drones, 1.2K+ Flight Hours, 91% Mission Success Rate.
   - Interactive feature catalog, workflow timeline, technology stack, and contact form.

3. **Authentication & Role-Based Access Control (RBAC)**
   - Secure JWT access & refresh token lifecycle.
   - Password hashing via bcrypt with strength validation.
   - Real **Google OAuth 2.0** and **GitHub OAuth** authorization workflows.
   - Four granular operational roles:
     - `admin`: Full platform governance, user management, and decommission privileges.
     - `fleet_manager`: Airframe specs updates, mission authorization, and maintenance approvals.
     - `operator`: Tactical mission execution, status updates, and telemetry monitoring.
     - `viewer`: Read-only telemetry and analytical reporting.

4. **Drone Fleet Management Module**
   - Full CRUD: Add, inspect, modify, and decommission airframes.
   - Search by name, manufacturer, model, or unique serial number.
   - Real-time battery status, payload limit, flight hours, and station hangar location.
   - Dedicated drone profile page with flight histories, specs, and telemetry trends.

5. **Mission Planning & Scheduling**
   - Multi-category sorties: Surveillance, Agriculture, Delivery, Mapping, Search and Rescue, Inspection.
   - Geofence waypoint coordinates, scheduled departure times, and automated drone status synchronization.
   - State machine workflow: `pending` → `scheduled` → `in_progress` → `completed` / `cancelled`.

6. **Real-Time Telemetry & Radar Simulation**
   - High-frequency avionics stream over **WebSockets** (`/ws/telemetry`).
   - Tracks 3D coordinates (latitude, longitude, altitude), airspeed, battery %, temperature, and GPS locks.
   - Interactive tactical airspace radar with real-time oscilloscope graphs.

7. **Predictive Maintenance Module**
   - Scheduled diagnostic inspections, LiPo battery cell swaps, motor bearing overhauls, sensor calibrations.
   - Upcoming servicing notifications within a 14-day lookahead window.

8. **Pandas Analytics & Report Export**
   - Analytical aggregations: Airframe utilization index, mission category breakdown, battery consumption model.
   - One-click export to **CSV** and **PDF** formats.

9. **AI Drone Fleet Assistant (Google Gemini)**
   - Floating interactive chatbot grounded in live database telemetry and platform state.
   - Real-time operational answers (e.g. low battery identification, maintenance alerts, flight hours).

10. **Administrative Governance Console**
    - User account provisioning and role promotion/demotion.
    - Real-time account deactivation toggle.
    - Security audit logs tracking every critical system event.

---

## 🚀 Pre-Configured Demo Accounts

After database seeding, use any of these accounts to log in:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@dronefleet.ai` | `AdminPassword123!` |
| **Fleet Manager** | `manager@dronefleet.ai` | `ManagerPassword123!` |
| **Drone Operator** | `operator@dronefleet.ai` | `OperatorPassword123!` |
| **Viewer** | `viewer@dronefleet.ai` | `ViewerPassword123!` |

---

## 🛠️ Technology Stack

- **Frontend**: React 18, React Router v6, Recharts, Lucide React, Axios.
- **Backend**: Python 3.11, FastAPI, SQLAlchemy 2.0 (Async), Pydantic v2, Uvicorn, WebSockets.
- **Databases**: PostgreSQL 15 (or SQLite with aiosqlite for standalone execution), Redis 7.
- **Data Science & AI**: Pandas, Google Gemini API (`google-generativeai`).
- **Containerization**: Backend and frontend Dockerfiles.

---

## Windows Setup and Run Commands

### Prerequisites
- Python 3.10 or newer
- Node.js 18 or newer (includes npm)
- PowerShell

The local setup below uses SQLite, so PostgreSQL and Redis do not need to be installed or running. Open **two PowerShell terminals** from the project folder. Replace `C:\path\to\drone-fleet-manager` with the actual project path.

### 1. Set up and run the backend

In the first terminal:

```powershell
Set-Location C:\path\to\drone-fleet-manager\backend

# Create the virtual environment and install backend dependencies
python -m venv venv
.\venv\Scripts\python.exe -m pip install --upgrade pip
.\venv\Scripts\python.exe -m pip install -r requirements.txt

# Use the local SQLite database (stored in backend\drone_fleet.db)
$env:DATABASE_URL = "sqlite+aiosqlite:///./drone_fleet.db"

# Create database tables and seed demo accounts/data; safe to run again
.\venv\Scripts\python.exe -m app.database.seed

# Start the API on port 8001
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

Keep this terminal open. The API and database health check are at `http://127.0.0.1:8001/api/health`; interactive API docs are at `http://127.0.0.1:8001/api/docs` and ReDoc is at `http://127.0.0.1:8001/api/redoc`.

### 2. Set up and run the frontend

In the second terminal:

```powershell
Set-Location C:\path\to\drone-fleet-manager\frontend

# Install dependencies (only required the first time or after package changes)
npm install

# Point API and telemetry requests at the backend port above
$env:REACT_APP_API_URL = "http://127.0.0.1:8001"
$env:REACT_APP_WS_URL = "ws://127.0.0.1:8001"

# Start the React development server
npm start
```

Open `http://localhost:3000`. Start the backend before attempting to log in. Both frontend environment variables must use port **8001**; using port 8000 will prevent the frontend from reaching the backend.

### Demo login

Seeded demo credentials:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@dronefleet.ai` | `AdminPassword123!` |
| Fleet Manager | `manager@dronefleet.ai` | `ManagerPassword123!` |
| Drone Operator | `operator@dronefleet.ai` | `OperatorPassword123!` |
| Viewer | `viewer@dronefleet.ai` | `ViewerPassword123!` |

The seeder does not replace existing user accounts or reset their passwords. If the demo admin already exists but its password was changed, the seeder will report that the database is already seeded; it will not restore the demo password.

### Optional project launchers

From the project folder, these Windows batch files provide shortcuts:

```powershell
# Launch backend and frontend in separate windows
.\start.bat

# Or start either server separately
.\run-backend.bat
.\run-frontend.bat
```

The launchers use backend port 8001 and frontend port 3000. Keep the server windows open while using the app.

### Database and API troubleshooting

- Check `http://127.0.0.1:8001/api/health`. A healthy response includes `"database": "healthy"`. A database connection failure returns HTTP 503; startup also stops with an error if the database cannot be initialized.
- If login fails, confirm the backend is listening on port 8001 and that `REACT_APP_API_URL` points to `http://127.0.0.1:8001`. Restart `npm start` after changing frontend environment variables.
- To initialize or seed the SQLite database again, run `.\venv\Scripts\python.exe -m app.database.seed` from the backend folder. This creates missing tables and adds demo data only when the demo admin does not already exist.
- To use PostgreSQL instead, start PostgreSQL, create the `drone_fleet` database, and set `DATABASE_URL` in the backend terminal to a valid `postgresql+asyncpg://...` connection URL before running the seeder and server.

### Production frontend build

```powershell
# Run from the frontend folder
npm run build
```

`npm start` runs the development frontend; `npm run build` only creates production assets and does not start the backend.

---

## 🧪 Automated Testing

Run the backend tests from the `backend` folder:

```powershell
.\venv\Scripts\python.exe -m pytest -v
```

Tests verify:
- User registration and validation
- Duplicate email prevention
- Password hashing & JWT generation
- Drone CRUD & role authorization
- Mission assignment & scheduling
- Live telemetry access control

The frontend currently has no test files. Its `npm test -- --watchAll=false` command will report “No tests found” until frontend tests are added.

### Postman API Testing
Import `postman_collection.json` located at the project root into Postman to test all endpoints.

---

## 📁 Project Architecture

```
drone-fleet-manager/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI Entry & Lifespan
│   │   ├── api/
│   │   │   ├── deps.py              # JWT & RBAC Role Guards
│   │   │   └── endpoints/           # 9 Router Modules
│   │   ├── core/                    # Security, Config & OAuth
│   │   ├── database/                # Async Engine, Session & Seeder
│   │   ├── middleware/              # Rate Limiter
│   │   ├── models/                  # SQLAlchemy 2.0 Entities
│   │   ├── schemas/                 # Pydantic v2 Schemas
│   │   ├── services/                # Business Logic & Telemetry Loop
│   │   └── utils/                   # Helpers
│   ├── tests/                       # Automated Pytest Suite
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/              # Common UI, AI Chatbot, Cards
│   │   ├── context/                 # AuthContext
│   │   ├── hooks/                   # useWebSocket
│   │   ├── layouts/                 # MainLayout & AuthLayout
│   │   ├── pages/                   # 16 Complete Pages
│   │   ├── services/                # 8 Axios API Services
│   │   └── styles/                  # Global Theme Styles
│   ├── Dockerfile
│   └── nginx.conf
├── postman_collection.json
└── README.md
```

---

## 📄 License
MIT License. Developed for University Demonstration & Commercial Research.
"# ai-drone" 
"# ai-drone" 
"# ai-drone" 
"# ai-drone" 
"# ai-drone" 
"# ai-drone" 
