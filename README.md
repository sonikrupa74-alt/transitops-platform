# 🚚 TransitOps ERP

<p align="center">
  <h3 align="center">Smart Fleet & Transportation Management System</h3>

  <p align="center">
    A modern ERP platform built to simplify fleet operations, vehicle dispatching,
    driver management, maintenance tracking, fuel monitoring, and operational analytics.
  </p>
</p>

---

## 📖 Overview

**TransitOps ERP** is a modern transportation management platform developed for organizations that need a centralized solution to manage fleet operations efficiently.

The platform provides an intuitive dashboard for monitoring vehicles, drivers, trips, maintenance records, fuel logs, and business insights while ensuring smooth operational workflows through a clean ERP interface.

Built with **React**, **Flask**, and **MySQL**, TransitOps ERP demonstrates a scalable architecture suitable for logistics and transportation businesses.

---

# ✨ Features

### 📊 Dashboard
- Fleet operational overview
- Active dispatch monitoring
- Fleet utilization statistics
- Compliance alerts
- Workshop status
- Activity timeline

### 🚛 Vehicle Management
- Vehicle registration
- Odometer tracking
- Capacity management
- Vehicle availability
- Assignment tracking
- Search & filtering

### 👨‍✈️ Driver Management
- Driver profiles
- License management
- Safety score tracking
- Contact information
- Availability monitoring

### 🛣️ Trip Management
- Trip scheduling
- Route management
- Vehicle assignment
- Driver assignment
- Cargo tracking
- Dispatch status

### 🔧 Maintenance
- Workshop tickets
- Service history
- Vehicle inspections
- Maintenance scheduling

### ⛽ Fuel Logs
- Fuel consumption
- Mileage records
- Cost tracking

### 📈 Reports
- Fleet analytics
- Operational reports
- Business insights

---

# 🏗️ System Architecture

```text
                 React + TypeScript
                         │
                     Axios API
                         │
                  Flask REST Backend
                         │
                      PyMySQL
                         │
                    MySQL Database
```

---

# 💻 Tech Stack

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

# 📂 Project Structure

```text
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

# 🚀 Getting Started

## 1️⃣ Clone Repository

```bash
git clone https://github.com/sonikrupa74-alt/transitops-platform.git
cd transitops-platform
```

---

## 2️⃣ Backend Setup

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

## 3️⃣ Frontend Setup

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

# 🗄️ Database Setup

1. Install MySQL.
2. Create a new database.
3. Import **schema.sql**.
4. Configure your database credentials inside:

```
backend/config.py
```

5. Start the backend server.

---

# 📌 Modules

| Module | Description |
|---------|-------------|
| 📊 Dashboard | Operational overview & analytics |
| 🚛 Vehicles | Vehicle registration & management |
| 👨‍✈️ Drivers | Driver information & license tracking |
| 🛣️ Trips | Dispatch & transportation management |
| 🔧 Maintenance | Workshop & service management |
| ⛽ Fuel Logs | Fuel monitoring & expense tracking |
| 📈 Reports | Business analytics & reports |

---

# 🔗 REST API

The backend exposes RESTful APIs for:

- Authentication
- Dashboard
- Vehicles
- Drivers
- Trips
- Maintenance
- Fuel Logs
- Reports

---

# 🌟 Highlights

- Modern ERP Interface
- Dark Professional UI
- RESTful Backend
- MySQL Integration
- Modular Architecture
- CRUD Operations
- Search & Filtering
- Responsive Design
- Fleet Analytics Dashboard
- Scalable Code Structure

---

# 📸 Application Preview

> Add screenshots of:
>
> - Dashboard
> - Vehicles
> - Drivers
> - Trips

Example:

```
assets/
├── dashboard.png
├── vehicles.png
├── drivers.png
└── trips.png
```

Then include:

```md
## Dashboard

![Dashboard](assets/dashboard.png)

## Vehicles

![Vehicles](assets/vehicles.png)

## Drivers

![Drivers](assets/drivers.png)

## Trips

![Trips](assets/trips.png)
```

---

# 🚀 Future Enhancements

- JWT Authentication
- Role-Based Access Control (RBAC)
- Live GPS Tracking
- Route Optimization
- Predictive Maintenance
- Fuel Consumption Analytics
- Email Notifications
- Export Reports (PDF & Excel)
- Mobile Application
- Cloud Deployment

---

# 👥 Team

Developed as part of a Hackathon project to showcase a scalable Fleet & Transportation ERP solution built using modern web technologies.

---

# 📄 License

This project is intended for educational and hackathon purposes.
