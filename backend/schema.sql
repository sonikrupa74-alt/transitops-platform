CREATE DATABASE IF NOT EXISTS transitops_db;
USE transitops_db;

CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Manager', 'Dispatcher') DEFAULT 'Manager',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drivers (
    driver_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    license_number VARCHAR(50) NOT NULL UNIQUE,
    license_category VARCHAR(20) NOT NULL,
    license_expiry DATE NOT NULL,
    contact_number VARCHAR(15) NOT NULL,
    safety_score DECIMAL(5,2) DEFAULT 100.00,
    status ENUM('Available', 'On Trip', 'Off Duty', 'Suspended', 'Leave', 'Assigned') DEFAULT 'Available',
    assigned_vehicle_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_name VARCHAR(100) NOT NULL,
    registration_no VARCHAR(50) NOT NULL UNIQUE,
    vehicle_type VARCHAR(50) NOT NULL,
    max_capacity DECIMAL(10,2) NOT NULL,
    odometer DECIMAL(10,2) DEFAULT 0.00,
    acquisition_cost DECIMAL(12,2) DEFAULT 0.00,
    status ENUM('Available', 'On Trip', 'In Shop', 'Retired') DEFAULT 'Available',
    driver_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trips (
    trip_id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    driver_id INT NOT NULL,
    source VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    cargo_weight DECIMAL(10,2),
    planned_distance DECIMAL(10,2),
    revenue DECIMAL(12,2) DEFAULT 0.00,
    final_odometer DECIMAL(12,2) NULL,
    fuel_consumed DECIMAL(12,2) NULL,
    trip_status ENUM('Draft', 'Scheduled', 'Dispatched', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id),
    FOREIGN KEY (driver_id) REFERENCES drivers(driver_id)
);

CREATE TABLE IF NOT EXISTS maintenance (
    maintenance_id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    issue_description TEXT NOT NULL,
    maintenance_date DATE NOT NULL,
    maintenance_status ENUM('Pending', 'In Progress', 'Completed') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id)
);

CREATE TABLE IF NOT EXISTS fuel_logs (
    fuel_id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    liters DECIMAL(10,2) NOT NULL,
    fuel_cost DECIMAL(10,2) NOT NULL,
    fuel_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id)
);