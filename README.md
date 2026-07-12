# TransitOps ERP

<p align="center">
  <h3 align="center">Smart Fleet & Transportation Management System</h3>
  <p align="center">
    A modern ERP platform for managing fleet operations, vehicle dispatching, drivers, maintenance, fuel records, and operational analytics.
  </p>
</p>

---

## Overview

TransitOps ERP is a centralized fleet management solution developed to simplify transportation operations. The platform provides an intuitive interface for managing vehicles, drivers, trips, maintenance schedules, fuel logs, and operational reports while maintaining real-time visibility across the organization.

Designed with a modern ERP interface and backed by a Flask + MySQL REST API, the application demonstrates how transportation companies can efficiently manage daily logistics from a single dashboard.

---

## Key Features

### Dashboard
- Operational overview with live statistics
- Fleet utilization metrics
- Active dispatch monitoring
- Compliance notifications
- Workshop status
- Activity timeline

### Vehicle Management
- Vehicle registration
- Capacity and odometer tracking
- Vehicle availability monitoring
- Assignment management
- Search and filtering

### Driver Management
- Driver profiles
- License management
- Contact information
- Safety score tracking
- Availability status

### Trip Management
- Trip scheduling
- Vehicle allocation
- Driver assignment
- Cargo information
- Route planning
- Dispatch status tracking

### Maintenance
- Workshop ticket management
- Maintenance history
- Service scheduling
- Vehicle repair tracking

### Fuel Logs
- Fuel usage records
- Cost tracking
- Mileage management

### Reports
- Fleet analytics
- Operational reports
- Business insights

---

# System Architecture

```
                React + TypeScript
                        │
                    Axios API
                        │
                Flask REST Backend
                        │
                    PyMySQL Driver
                        │
                  MySQL Database
```

---

# Tech Stack

## Frontend

- React
- TypeScript
- Vite
- React Router
- Axios
- CSS

## Backend

- Python
- Flask
- REST API
- PyMySQL

## Database

- MySQL

---

# Folder Structure

```
transitops-platform
│
├── backend
│   ├── app.py
│   ├── config.py
│   ├── database.py
│   ├── schema.sql
│   └── ...
│
├── frontend
│   ├── public
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   ├── services
│   │   ├── utils
│   │   └── ...
│   └── package.json
│
└── README.md
```

---

# Installation

## Clone Repository

```bash
git clone https://github.com/sonikrupa74-alt/transitops-platform.git
cd transitops-platform
```

---

## Backend Setup

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

pip install -r requirements.txt

python app.py
```

Backend Server

```
http://127.0.0.1:5000
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend Server

```
http://localhost:3000
```

---

# Database Configuration

1. Install MySQL Server.
2. Create a new database.
3. Import the provided `schema.sql`.
4. Update your credentials inside:

```
backend/config.py
```

5. Start the backend server.

---

# Application Modules

| Module | Description |
|---------|-------------|
| Dashboard | Fleet overview and operational insights |
| Vehicles | Vehicle registration and tracking |
| Drivers | Driver profile management |
| Trips | Dispatch and trip management |
| Maintenance | Vehicle servicing and workshop logs |
| Fuel Logs | Fuel usage monitoring |
| Reports | Operational analytics |

---

# REST API

The backend provides RESTful endpoints for:

- Authentication
- Dashboard
- Vehicles
- Drivers
- Trips
- Maintenance
- Fuel Logs
- Reports

---

# Highlights

- Modern ERP Dashboard
- Responsive User Interface
- RESTful Backend
- MySQL Integration
- Modular Architecture
- CRUD Operations
- Fleet Analytics
- Secure Login System
- Search & Filtering
- Scalable Codebase

---

# Future Scope

- Role-Based Access Control (RBAC)
- JWT Authentication
- GPS Vehicle Tracking
- Route Optimization
- Predictive Maintenance
- Fuel Consumption Analytics
- Email & SMS Notifications
- Report Export (PDF/Excel)
- Mobile Application
- Cloud Deployment

---

# Team

Developed as a Hackathon project to demonstrate a scalable Fleet & Transportation ERP platform using modern web technologies.

---

# License

This project is developed for educational and hackathon purposes.
