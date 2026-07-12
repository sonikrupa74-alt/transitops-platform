# 🚚 TransitOps ERP

### Smart Fleet & Transportation Management System

*A modern enterprise ERP platform for managing transportation operations, fleet, drivers, trips, maintenance, and business insights.*

---

## 📖 Overview

TransitOps ERP is a modern transportation management system designed to simplify daily fleet operations. It connects a React + Vite (TypeScript) frontend dashboard to a Flask (Python) backend and a MySQL database, providing an end-to-end operational control center for real-time dispatch, driver performance tracking, and vehicle status management.

---

## 🛠️ System Architecture

- **Frontend**: React 18, Vite 5, Tailwind CSS, TypeScript, Axios, Lucide Icons, Recharts.
- **Backend**: Python 3.13, Flask, PyMySQL (highly stable native connection driver).
- **Database**: MySQL 8.x+ (relational schema tracking vehicles, drivers, trips, and fuel logs).

---

## 📂 Project Structure

```text
Odoo-hackathon/
│
├── backend/                  # Python Flask API & Configuration
│   ├── app.py                # Main backend REST routes
│   ├── database.py           # PyMySQL wrapper and connection manager
│   ├── config.py             # App parameters & environment variables loader
│   ├── schema.sql            # Core database table DDLs
│   └── update_db_schema.py   # Database auto-migration script
│
└── frontend/                 # React UI Dashboard Application
    ├── src/
    │   ├── components/       # Custom ERP widgets (Metrics, Tables, Toast)
    │   ├── pages/            # Core views (Dashboard, Vehicles, Drivers, Trips)
    │   └── utils/            # Client date & storage utility functions
    ├── api/
    │   └── api.ts            # Central Axios HTTP client targeting the backend
    └── package.json          # Dependency deck
```

---

## ⚙️ Getting Started & Installation

Follow these steps to set up and run the TransitOps ERP system locally.

### 1. Database Configuration
Ensure you have a MySQL server running locally on port `3306`. By default, the application connects to database `transitops_db` using user `root` and an empty password. 

To configure custom credentials, set these environment variables before running:
- `DB_HOST` (defaults to `localhost`)
- `DB_USER` (defaults to `root`)
- `DB_PASSWORD` (defaults to `""`)
- `DB_NAME` (defaults to `"transitops_db"`)

### 2. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install Python requirements (ensure you have `pymysql` and `flask` installed):
   ```bash
   pip install pymysql flask
   ```
3. Run the database migration script. This will automatically create the `transitops_db` database, vehicles, drivers, trips, and fuel logs tables, and apply all necessary structural alignments:
   ```bash
   python update_db_schema.py
   ```
4. Start the Flask API server:
   ```bash
   python app.py
   ```
   *The backend will boot on http://127.0.0.1:5000.*

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install client dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *The user interface will be available at http://localhost:3000.*

---

## 👥 Default Login Credentials

Use the following profiles to log in and access the control deck:
- **Fleet Manager / Admin**:
  - Email: `manager@transitops.com`
  - Password: `manager123`
- **Dispatcher / Operator**:
  - Email: `driver@transitops.com`
  - Password: `driver123`
