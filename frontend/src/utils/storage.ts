// Data Models
export interface Vehicle {
  id: string;
  registrationNumber: string;
  type: string;
  capacity: number; // in kg
  status: 'Available' | 'On Trip' | 'In Shop' | 'Retired';
  driver: string; // Driver ID or 'None'
  odometer: number; // in km
  region: string;
  acquisitionCost: number;
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string; // YYYY-MM-DD
  contactNumber: string;
  status: 'Available' | 'On Trip' | 'Off Duty' | 'Suspended';
  assignedVehicle: string; // Vehicle ID or 'None'
  safetyScore: number;
}

export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number; // in kg
  plannedDistance: number; // in km
  status: 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled';
  finalOdometer?: number;
  fuelConsumed?: number; // in liters
  revenue: number;
  createdAt: string;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  description: string;
  cost: number;
  startDate: string;
  endDate?: string;
  status: 'Scheduled' | 'In Progress' | 'Completed';
  type: 'Oil Change' | 'Brake Service' | 'Engine Repair' | 'Tire Replacement' | 'General Service';
  garage: string;
  priority: 'Low' | 'Medium' | 'High';
  notes?: string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  liters: number;
  cost: number;
  date: string;
}

export interface Expense {
  id: string;
  vehicleId: string;
  type: 'Toll' | 'Maintenance' | 'Other';
  amount: number;
  date: string;
}

// Initial Seed Data (Indian Context)
const initialVehicles: Vehicle[] = [
  { id: 'VEH-101', registrationNumber: 'DL-01-CA-2015', type: 'Van', capacity: 500, status: 'Available', driver: 'DRV-101', odometer: 45210, region: 'North', acquisitionCost: 450000 },
  { id: 'VEH-102', registrationNumber: 'MH-12-PQ-5678', type: 'Semi-Truck', capacity: 12000, status: 'On Trip', driver: 'DRV-102', odometer: 189450, region: 'West', acquisitionCost: 4500000 },
  { id: 'VEH-103', registrationNumber: 'KA-03-MM-9012', type: 'Flatbed', capacity: 4500, status: 'In Shop', driver: 'None', odometer: 92100, region: 'South', acquisitionCost: 2200000 },
  { id: 'VEH-104', registrationNumber: 'HR-26-BC-4412', type: 'Box Truck', capacity: 3500, status: 'Available', driver: 'DRV-104', odometer: 64300, region: 'North', acquisitionCost: 1800000 },
  { id: 'VEH-105', registrationNumber: 'TN-07-JK-3321', type: 'Van', capacity: 600, status: 'On Trip', driver: 'None', odometer: 38900, region: 'South', acquisitionCost: 550000 },
];

const initialDrivers: Driver[] = [
  { id: 'DRV-101', name: 'Rajesh Kumar', licenseNumber: 'DL-99281', licenseCategory: 'Class A', licenseExpiryDate: '2026-10-15', contactNumber: '+91-98765-43210', status: 'Available', assignedVehicle: 'VEH-101', safetyScore: 4.8 },
  { id: 'DRV-102', name: 'Marcus Patel', licenseNumber: 'DL-82910', licenseCategory: 'Class A', licenseExpiryDate: '2027-02-20', contactNumber: '+91-98765-43211', status: 'On Trip', assignedVehicle: 'VEH-102', safetyScore: 4.9 },
  { id: 'DRV-103', name: 'Priya Sharma', licenseNumber: 'DL-33219', licenseCategory: 'Class B', licenseExpiryDate: '2026-05-10', contactNumber: '+91-98765-43212', status: 'Off Duty', assignedVehicle: 'None', safetyScore: 4.2 },
  { id: 'DRV-104', name: 'Sunil Singh', licenseNumber: 'DL-44122', licenseCategory: 'Class C', licenseExpiryDate: '2026-12-05', contactNumber: '+91-98765-43213', status: 'Available', assignedVehicle: 'VEH-104', safetyScore: 4.5 },
  { id: 'DRV-105', name: 'Rohan Deshmukh', licenseNumber: 'DL-55829', licenseCategory: 'Class A', licenseExpiryDate: '2025-11-01', contactNumber: '+91-98765-43214', status: 'Suspended', assignedVehicle: 'None', safetyScore: 3.8 },
];

const initialTrips: Trip[] = [
  { id: 'TRIP-1001', source: 'Delhi', destination: 'Jaipur', vehicleId: 'VEH-101', driverId: 'DRV-101', cargoWeight: 450, plannedDistance: 270, status: 'Completed', finalOdometer: 45480, fuelConsumed: 25, revenue: 15000, createdAt: '2026-07-10T14:30:00.000Z' },
  { id: 'TRIP-1002', source: 'Mumbai', destination: 'Pune', vehicleId: 'VEH-102', driverId: 'DRV-102', cargoWeight: 10000, plannedDistance: 150, status: 'Dispatched', revenue: 32000, createdAt: '2026-07-12T08:15:00.000Z' },
];

const initialMaintenance: MaintenanceLog[] = [
  { id: 'MTN-1001', vehicleId: 'VEH-103', description: 'Hydraulic leak checkup', cost: 12000, startDate: '2026-07-11', status: 'In Progress', type: 'General Service', garage: 'Mumbai Workshop', priority: 'High', notes: 'Oil seals replaced.' },
  { id: 'MTN-1002', vehicleId: 'VEH-101', description: 'Routine lube oil replacement', cost: 3500, startDate: '2026-07-05', endDate: '2026-07-05', status: 'Completed', type: 'Oil Change', garage: 'Delhi Auto Care', priority: 'Low', notes: 'Filters standard change.' },
];

const initialFuelLogs: FuelLog[] = [
  { id: 'FUEL-1001', vehicleId: 'VEH-101', liters: 25, cost: 2300, date: '2026-07-10' },
  { id: 'FUEL-1002', vehicleId: 'VEH-102', liters: 75, cost: 6900, date: '2026-07-11' },
];

const initialExpenses: Expense[] = [
  { id: 'EXP-1001', vehicleId: 'VEH-101', type: 'Toll', amount: 350, date: '2026-07-10' },
  { id: 'EXP-1002', vehicleId: 'VEH-102', type: 'Other', amount: 800, date: '2026-07-11' },
];

// LocalStorage Keys
const KEYS = {
  VEHICLES: 'transitops_vehicles',
  DRIVERS: 'transitops_drivers',
  TRIPS: 'transitops_trips',
  MAINTENANCE: 'transitops_maintenance',
  FUEL_LOGS: 'transitops_fuel_logs',
  EXPENSES: 'transitops_expenses',
};

// Storage Helpers
export const getStorageData = <T>(key: string, initialData: T): T => {
  if (typeof window === 'undefined') return initialData;
  const item = localStorage.getItem(key);
  if (!item) {
    localStorage.setItem(key, JSON.stringify(initialData));
    return initialData;
  }
  try {
    return JSON.parse(item);
  } catch {
    return initialData;
  }
};

export const setStorageData = <T>(key: string, data: T): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

// Main Export Getters
export const getVehicles = (): Vehicle[] => getStorageData(KEYS.VEHICLES, initialVehicles);
export const getDrivers = (): Driver[] => getStorageData(KEYS.DRIVERS, initialDrivers);
export const getTrips = (): Trip[] => getStorageData(KEYS.TRIPS, initialTrips);
export const getMaintenance = (): MaintenanceLog[] => getStorageData(KEYS.MAINTENANCE, initialMaintenance);
export const getFuelLogs = (): FuelLog[] => getStorageData(KEYS.FUEL_LOGS, initialFuelLogs);
export const getExpenses = (): Expense[] => getStorageData(KEYS.EXPENSES, initialExpenses);

// Main Export Setters
export const setVehicles = (data: Vehicle[]) => setStorageData(KEYS.VEHICLES, data);
export const setDrivers = (data: Driver[]) => setStorageData(KEYS.DRIVERS, data);
export const setTrips = (data: Trip[]) => setStorageData(KEYS.TRIPS, data);
export const setMaintenance = (data: MaintenanceLog[]) => setStorageData(KEYS.MAINTENANCE, data);
export const setFuelLogs = (data: FuelLog[]) => setStorageData(KEYS.FUEL_LOGS, data);
export const setExpenses = (data: Expense[]) => setStorageData(KEYS.EXPENSES, data);

// Check if a license is expired relative to current context time (2026-07-12)
export const isLicenseExpired = (expiryDateStr: string) => {
  if (!expiryDateStr) return false;
  const expiry = new Date(expiryDateStr);
  const currentDate = new Date('2026-07-12');
  return expiry < currentDate;
};
