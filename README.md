# 🚚 TransitOps ERP

<p align="center">
  <h3 align="center">Smart Fleet & Transportation Management System</h3>
  <p align="center">
    A modern ERP platform for managing fleet operations, vehicle dispatching, drivers, maintenance, fuel records, and operational analytics.
  </p>
</p>

---

## Overview

TransitOps ERP is a comprehensive fleet and transportation management system designed to simplify daily logistics operations. It provides a centralized platform for managing vehicles, drivers, trips, maintenance schedules, fuel records, and operational reports through an intuitive ERP interface.

Built with **React**, **TypeScript**, **Flask**, and **MySQL**, the platform demonstrates a scalable architecture suitable for transportation and logistics organizations.

---

## ✨ Features

- Modern ERP Dashboard with operational insights
- Vehicle registration and fleet management
- Driver management with license and safety tracking
- Trip scheduling and dispatch management
- Maintenance and workshop records
- Fuel log and expense tracking
- Reports and analytics
- Responsive and professional user interface
- RESTful backend powered by Flask
- MySQL database integration

---

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- React Router
- Axios

### Backend
- Python
- Flask
- REST API
- PyMySQL

### Database
- MySQL

---

## Project Structure

```text
TransitOps-ERP/
│
├── backend/
├── frontend/
└── README.md
```

---

## 🚀 Getting Started

### Clone Repository

```bash
git clone https://github.com/your-username/transitops-erp.git
cd transitops-erp
```

### Backend

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

pip install -r requirements.txt

python app.py
```

### Frontend

```bash
cd frontend

npm install

npm run dev
```

### Database

1. Install MySQL.
2. Import `schema.sql`.
3. Update database credentials in `backend/config.py`.
4. Start the backend server.

---

## Modules

- Dashboard
- Vehicle Management
- Driver Management
- Trip Management
- Maintenance
- Fuel Logs
- Reports

---

## Future Enhancements

- Role-Based Access Control (RBAC)
- JWT Authentication
- Live GPS Tracking
- Route Optimization
- Predictive Maintenance
- Cloud Deployment

---

## 📄 License

Developed as a hackathon project for educational purposes.
