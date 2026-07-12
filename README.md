# TransitOps ERP

A modern ERP platform for fleet and transportation management designed to streamline vehicle operations, driver management, trip scheduling, maintenance tracking, and business reporting.

## Overview

TransitOps ERP is a web-based transportation management system that provides a centralized platform for managing fleet operations. It enables organizations to efficiently monitor vehicles, drivers, trips, maintenance records, fuel logs, and operational analytics through an intuitive dashboard.

## Features

### Dashboard
- Operational overview with real-time statistics
- Fleet utilization metrics
- Active dispatch monitoring
- Workshop and maintenance status
- Compliance alerts
- Activity logs

### Vehicle Management
- Vehicle registration and inventory
- Vehicle status tracking
- Capacity and odometer management
- Vehicle assignment management
- Search and filtering

### Driver Management
- Driver records management
- License tracking
- Safety score monitoring
- Driver availability status
- Contact information management

### Trip Management
- Trip scheduling and dispatch
- Vehicle assignment
- Driver assignment
- Route management
- Cargo tracking
- Trip status monitoring

### Maintenance
- Workshop ticket management
- Vehicle maintenance records
- Service scheduling
- Maintenance history

### Fuel Logs
- Fuel consumption records
- Cost tracking
- Mileage monitoring
- Expense management

### Reports
- Fleet analytics
- Operational reports
- Performance insights
- Business statistics

---

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- React Router
- Axios
- CSS

### Backend
- Python
- Flask
- PyMySQL
- REST API

### Database
- MySQL

---

## Project Structure

```
transitops-platform/
│
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── database.py
│   ├── schema.sql
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── ...
│
└── README.md
```

---

## Installation

### Clone the repository

```bash
git clone https://github.com/your-username/transitops-platform.git
cd transitops-platform
```

### Backend Setup

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

pip install -r requirements.txt

python app.py
```

Backend runs on:

```
http://127.0.0.1:5000
```

---

### Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend runs on:

```
http://localhost:3000
```

---

## Database Setup

1. Install MySQL.
2. Create a new database.
3. Import the provided `schema.sql`.
4. Update database credentials inside:

```
backend/config.py
```

5. Start the backend server.

---

## API

The backend exposes REST APIs for:

- Authentication
- Dashboard
- Vehicles
- Drivers
- Trips
- Maintenance
- Fuel Logs
- Reports

---

## Screens

- Dashboard
- Vehicle Registry
- Driver Management
- Trip Management
- Maintenance
- Fuel Logs
- Reports

---

## Future Enhancements

- JWT Authentication
- Role-Based Access Control
- Live GPS Tracking
- Predictive Maintenance
- Route Optimization
- Fuel Consumption Analytics
- Notification System
- Export Reports
- Mobile Support

---

## Team

Developed as part of a Hackathon project.

---

## License

This project is intended for educational and hackathon purposes.
