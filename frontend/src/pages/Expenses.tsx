import React, { useState } from 'react';
import { Plus, X, Fuel, Receipt, Download } from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  getFuelLogs, 
  setFuelLogs as saveFuelLogs, 
  getExpenses, 
  setExpenses as saveExpenses, 
  getVehicles,
  getDrivers,
  getTrips,
  FuelLog, 
  Expense, 
  Vehicle,
  Driver,
  Trip,
  formatDateDMY
} from '../utils/storage';
import { 
  PageHeader, 
  SearchBar, 
  Toast, 
  ToastMessage,
  StatusBadge
} from '../components/ERPComponents';

export default function Expenses() {
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(() => getFuelLogs());
  const [expenses, setExpenses] = useState<Expense[]>(() => getExpenses());
  const [vehicles] = useState<Vehicle[]>(() => getVehicles());
  const [drivers] = useState<Driver[]>(() => getDrivers());
  const [trips] = useState<Trip[]>(() => getTrips());
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Toast
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [modalType, setModalType] = useState<'fuel' | 'expense'>('fuel');
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Form Fields - Fuel Log
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [fuelDate, setFuelDate] = useState(new Date().toISOString().split('T')[0]);
  const [odometer, setOdometer] = useState('');
  const [liters, setLiters] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState('');
  const [station, setStation] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'UPI' | 'Fastag' | 'Net Banking'>('UPI');
  const [notes, setNotes] = useState('');

  // Form Fields - Expense
  const [expenseVehicleId, setExpenseVehicleId] = useState('');
  const [expenseType, setExpenseType] = useState<'Toll' | 'Maintenance' | 'Other' | 'Parking' | 'Insurance' | 'Permit' | 'Cleaning'>('Toll');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [billFileName, setBillFileName] = useState('');
  const [expenseStatus, setExpenseStatus] = useState<'Pending' | 'Approved' | 'Rejected'>('Approved');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 1. Analytics Calculations
  const totalFuelCost = fuelLogs.reduce((sum, log) => sum + log.cost, 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalOperationalCost = totalFuelCost + totalExpenses;

  // Efficiency & Cost per KM (trips based)
  const completedTrips = trips.filter(t => t.status === 'Completed');
  const totalDistance = completedTrips.reduce((sum, t) => sum + t.plannedDistance, 0) || 450;
  const totalLiters = fuelLogs.reduce((sum, log) => sum + log.liters, 0) || 1;
  const fleetFuelEfficiency = totalDistance / totalLiters;
  const costPerKm = totalOperationalCost / totalDistance;

  // Vehicle Stats Aggregations
  const vehicleCosts = vehicles.map(v => {
    const fuelCost = fuelLogs.filter(f => f.vehicleId === v.id).reduce((s, f) => s + f.cost, 0);
    const expCost = expenses.filter(e => e.vehicleId === v.id).reduce((s, e) => s + e.amount, 0);
    const total = fuelCost + expCost;
    const l = fuelLogs.filter(f => f.vehicleId === v.id).reduce((s, f) => s + f.liters, 0);
    const maintenanceCost = expenses.filter(e => e.vehicleId === v.id && e.type === 'Maintenance').reduce((s, e) => s + e.amount, 0);
    return {
      id: v.id,
      reg: v.registrationNumber,
      fuelCost,
      expCost,
      total,
      liters: l,
      maintenanceCost
    };
  });

  const activeVehicles = vehicleCosts.filter(vc => vc.total > 0);
  let mostExpensiveVehicle = 'N/A';
  let cheapestVehicle = 'N/A';
  if (activeVehicles.length > 0) {
    const sortedByCost = [...activeVehicles].sort((a, b) => b.total - a.total);
    mostExpensiveVehicle = sortedByCost[0].reg;
    cheapestVehicle = sortedByCost[sortedByCost.length - 1].reg;
  }

  const top5Fuel = [...vehicleCosts]
    .filter(vc => vc.liters > 0)
    .sort((a, b) => b.liters - a.liters)
    .slice(0, 5);

  const top5Maintenance = [...vehicleCosts]
    .filter(vc => vc.maintenanceCost > 0)
    .sort((a, b) => b.maintenanceCost - a.maintenanceCost)
    .slice(0, 5);

  // Time groupings for Recharts
  const getMonthYearStr = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('default', { month: 'short', year: '2-digit' });
  };

  const monthlyDataMap: Record<string, { month: string; fuelCost: number; fuelLiters: number; expenses: number }> = {};
  
  fuelLogs.forEach(log => {
    const m = getMonthYearStr(log.date);
    if (!monthlyDataMap[m]) {
      monthlyDataMap[m] = { month: m, fuelCost: 0, fuelLiters: 0, expenses: 0 };
    }
    monthlyDataMap[m].fuelCost += log.cost;
    monthlyDataMap[m].fuelLiters += log.liters;
  });

  expenses.forEach(exp => {
    const m = getMonthYearStr(exp.date);
    if (!monthlyDataMap[m]) {
      monthlyDataMap[m] = { month: m, fuelCost: 0, fuelLiters: 0, expenses: 0 };
    }
    monthlyDataMap[m].expenses += exp.amount;
  });

  const chartMonthlyData = Object.values(monthlyDataMap).sort((a, b) => {
    const parseDate = (mStr: string) => {
      const parts = mStr.split(' ');
      const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(parts[0]);
      return new Date(2000 + Number(parts[1]), m);
    };
    return parseDate(a.month).getTime() - parseDate(b.month).getTime();
  });

  const categoryMap: Record<string, number> = {};
  expenses.forEach(exp => {
    categoryMap[exp.type] = (categoryMap[exp.type] || 0) + exp.amount;
  });
  const chartCategoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  const COLORS = ['#7c3aed', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#6b7280'];

  // Search Ledger Logic
  const filteredFuelLogs = fuelLogs.filter(log => {
    const vehicle = vehicles.find(v => v.id === log.vehicleId);
    return (vehicle?.registrationNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           (log.station || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredExpenses = expenses.filter(exp => {
    const vehicle = vehicles.find(v => v.id === exp.vehicleId);
    return (vehicle?.registrationNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           (exp.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           exp.type.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const newToast = { id: Date.now().toString(), text, type };
    setToast(newToast);
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenFuel = () => {
    setSelectedVehicleId('');
    setFuelDate(new Date().toISOString().split('T')[0]);
    setOdometer('');
    setLiters('');
    setPricePerLiter('');
    setStation('');
    setSelectedDriverId('');
    setPaymentMethod('UPI');
    setNotes('');
    setFormErrors({});
    setModalType('fuel');
    setIsFormOpen(true);
  };

  const handleOpenExpense = () => {
    setExpenseVehicleId('');
    setExpenseType('Toll');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setAmount('');
    setDescription('');
    setBillFileName('');
    setExpenseStatus('Approved');
    setFormErrors({});
    setModalType('expense');
    setIsFormOpen(true);
  };

  const handleSaveFuel = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!selectedVehicleId) errors.vehicle = 'Please select a vehicle';
    if (!odometer || Number(odometer) <= 0) errors.odometer = 'Odometer is required';
    if (!liters || Number(liters) <= 0) errors.liters = 'Liters must be positive';
    if (!pricePerLiter || Number(pricePerLiter) <= 0) errors.price = 'Price is required';
    if (!station.trim()) errors.station = 'Station name is required';
    if (!selectedDriverId) errors.driver = 'Select operator';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const calculatedCost = Number(liters) * Number(pricePerLiter);

    const newFuelLog: FuelLog = {
      id: `FUEL-${1000 + fuelLogs.length + 1}`,
      vehicleId: selectedVehicleId,
      liters: Number(liters),
      cost: calculatedCost,
      date: fuelDate,
      odometer: Number(odometer),
      pricePerLiter: Number(pricePerLiter),
      station,
      driverId: selectedDriverId,
      paymentMethod,
      notes
    };

    const updated = [...fuelLogs, newFuelLog];
    setFuelLogs(updated);
    saveFuelLogs(updated);
    showToast(`Logged fuel check of ₹${calculatedCost.toLocaleString('en-IN')}`);
    setIsFormOpen(false);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!expenseVehicleId) errors.vehicle = 'Please select a vehicle';
    if (!amount || Number(amount) <= 0) errors.amount = 'Amount is required';
    if (!description.trim()) errors.description = 'Description is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const newExpense: Expense = {
      id: `EXP-${1000 + expenses.length + 1}`,
      vehicleId: expenseVehicleId,
      type: expenseType,
      amount: Number(amount),
      date: expenseDate,
      description,
      status: expenseStatus,
      billAttached: !!billFileName,
      billFileName: billFileName || undefined
    };

    const updated = [...expenses, newExpense];
    setExpenses(updated);
    saveExpenses(updated);
    showToast(`Logged ₹${Number(amount).toLocaleString('en-IN')} expense successfully`);
    setIsFormOpen(false);
  };

  const handleExportCSV = () => {
    const headers = [
      'Record ID',
      'Registration Number',
      'Record Type',
      'Category/Station',
      'Volume (Liters)',
      'Odometer (km)',
      'Price per Liter (₹)',
      'Total Cost (₹)',
      'Logged Date',
      'Notes/Description',
      'Status'
    ];

    const rows: any[] = [];
    
    fuelLogs.forEach(f => {
      const veh = vehicles.find(v => v.id === f.vehicleId);
      rows.push([
        f.id,
        veh ? veh.registrationNumber : f.vehicleId,
        'Fuel Log',
        f.station,
        f.liters,
        f.odometer,
        f.pricePerLiter,
        f.cost,
        formatDateDMY(f.date),
        f.notes || '',
        'Completed'
      ]);
    });

    expenses.forEach(e => {
      const veh = vehicles.find(v => v.id === e.vehicleId);
      rows.push([
        e.id,
        veh ? veh.registrationNumber : e.vehicleId,
        'Operational Expense',
        e.type,
        'N/A',
        'N/A',
        'N/A',
        e.amount,
        formatDateDMY(e.date),
        e.description || '',
        e.status
      ]);
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map((val: any) => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `TransitOps_Fuel_Expenses_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={styles.container}>
      <PageHeader 
        title="Fleet Fuel & Expense Hub"
        description="Comprehensive analytics dashboard for fuel logs, operating expenses, and category cost distributions."
        breadcrumbs={[{ label: 'TransitOps ERP', link: '/' }, { label: 'Expenses', active: true }]}
        actions={
          <div style={styles.btnGroup}>
            <button className="btn btn-secondary" onClick={handleExportCSV}>
              <Download size={14} />
              <span>Export CSV</span>
            </button>
            <button className="btn btn-secondary" onClick={handleOpenFuel}>
              <Plus size={14} />
              <span>Log Fuel</span>
            </button>
            <button className="btn btn-primary" onClick={handleOpenExpense}>
              <Plus size={14} />
              <span>Log Expense</span>
            </button>
          </div>
        }
      />

      {/* Analytics KPIs Section */}
      <div style={styles.analyticsSection}>
        <div style={styles.kpiRow}>
          <div className="card" style={styles.kpiCard}>
            <span style={styles.kpiLabel}>Total Fuel Cost</span>
            <span style={styles.kpiValue}>₹{totalFuelCost.toLocaleString('en-IN')}</span>
          </div>
          <div className="card" style={styles.kpiCard}>
            <span style={styles.kpiLabel}>Total Expenses</span>
            <span style={styles.kpiValue}>₹{totalExpenses.toLocaleString('en-IN')}</span>
          </div>
          <div className="card" style={styles.kpiCard}>
            <span style={styles.kpiLabel}>Operational Cost</span>
            <span style={styles.kpiValue}>₹{totalOperationalCost.toLocaleString('en-IN')}</span>
          </div>
          <div className="card" style={styles.kpiCard}>
            <span style={styles.kpiLabel}>Fuel Efficiency</span>
            <span style={styles.kpiValue}>{fleetFuelEfficiency.toFixed(1)} km/L</span>
          </div>
          <div className="card" style={styles.kpiCard}>
            <span style={styles.kpiLabel}>Cost Per KM</span>
            <span style={styles.kpiValue}>₹{costPerKm.toFixed(2)}</span>
          </div>
        </div>

        {/* Charts Deck */}
        <div style={styles.chartsGrid}>
          {/* Monthly Fuel Consumption */}
          <div className="card" style={styles.chartCard}>
            <h4 style={styles.chartTitle}>Monthly Fuel Analytics</h4>
            <div style={{ height: '180px', marginTop: '0.5rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartMonthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={9} axisLine={false} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={9} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0b0b0b', borderColor: '#262626', fontSize: '10px' }} />
                  <Legend wrapperStyle={{ fontSize: '9px', marginTop: '5px' }} />
                  <Line type="monotone" dataKey="fuelLiters" name="Liters" stroke="#7c3aed" strokeWidth={2} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="fuelCost" name="Cost (₹)" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Expenses */}
          <div className="card" style={styles.chartCard}>
            <h4 style={styles.chartTitle}>Monthly Expenses (₹)</h4>
            <div style={{ height: '180px', marginTop: '0.5rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartMonthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={9} axisLine={false} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={9} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0b0b0b', borderColor: '#262626', fontSize: '10px' }} />
                  <Bar dataKey="expenses" name="Expenses" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expense Categories Distribution */}
          <div className="card" style={styles.chartCard}>
            <h4 style={styles.chartTitle}>Expense Category Distribution</h4>
            <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartCategoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0b0b0b', borderColor: '#262626', fontSize: '10px' }} />
                  <Legend wrapperStyle={{ fontSize: '8px' }} layout="vertical" align="right" verticalAlign="middle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Operating Highlights */}
        <div style={styles.leadersGrid}>
          <div className="card" style={styles.leaderCardBlock}>
            <h4 style={styles.chartTitle}>Highlights</h4>
            <div style={styles.highlightRow}>
              <div>
                <span style={styles.highlightLabel}>Highest Operating Cost</span>
                <span style={styles.highlightVal}>{mostExpensiveVehicle}</span>
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <span style={styles.highlightLabel}>Lowest Operating Cost</span>
                <span style={styles.highlightVal}>{cheapestVehicle}</span>
              </div>
            </div>
          </div>

          <div className="card" style={styles.leaderCardBlock}>
            <h4 style={styles.chartTitle}>Top Fuel Consuming Vehicles</h4>
            <div style={styles.leaderMiniTable}>
              {top5Fuel.map(v => (
                <div key={v.id} style={styles.leaderMiniRow}>
                  <span>{v.reg}</span>
                  <span style={styles.leaderMiniVal}>{v.liters.toLocaleString('en-IN')} L</span>
                </div>
              ))}
              {top5Fuel.length === 0 && <span style={styles.faintText}>No logs found</span>}
            </div>
          </div>

          <div className="card" style={styles.leaderCardBlock}>
            <h4 style={styles.chartTitle}>Top Maintenance Expenses</h4>
            <div style={styles.leaderMiniTable}>
              {top5Maintenance.map(v => (
                <div key={v.id} style={styles.leaderMiniRow}>
                  <span>{v.reg}</span>
                  <span style={styles.leaderMiniVal}>₹{v.maintenanceCost.toLocaleString('en-IN')}</span>
                </div>
              ))}
              {top5Maintenance.length === 0 && <span style={styles.faintText}>No logs found</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="card" style={styles.searchBarCard}>
        <SearchBar 
          placeholder="Filter records below by vehicle registration, description, category, or petrol pump..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
      </div>

      {/* Dual Ledger Tables */}
      <div style={styles.twoColumnGrid}>
        
        {/* Fuel Logs Ledger */}
        <div className="card" style={styles.ledgerCard}>
          <div style={styles.ledgerHeader}>
            <Fuel size={16} style={{ color: '#7c3aed' }} />
            <h3 style={styles.ledgerTitle}>Recent Fuel Refills</h3>
          </div>
          
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Vehicle</th>
                  <th style={styles.th}>Details</th>
                  <th style={styles.th}>Refill station</th>
                  <th style={styles.th}>Total Cost</th>
                  <th style={styles.th}>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredFuelLogs.length > 0 ? (
                  filteredFuelLogs.map((log) => {
                    const vehicleObj = vehicles.find(v => v.id === log.vehicleId);
                    return (
                      <tr key={log.id} style={styles.tr}>
                        <td style={styles.regTd}>
                          {vehicleObj ? vehicleObj.registrationNumber : log.vehicleId}
                        </td>
                        <td style={styles.td}>
                          <div style={styles.detailText}>Qty: {log.liters.toLocaleString()} L</div>
                          <div style={styles.faintDetail}>Odo: {log.odometer.toLocaleString()} km</div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.detailText}>{log.station}</div>
                          <div style={styles.faintDetail}>{log.paymentMethod}</div>
                        </td>
                        <td style={{ ...styles.td, fontWeight: 700, color: '#10b981' }}>
                          ₹{log.cost.toLocaleString('en-IN')}
                        </td>
                        <td style={styles.td}>{formatDateDMY(log.date)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} style={styles.emptyCell}>No fuel records logged.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Operational Expenses Ledger */}
        <div className="card" style={styles.ledgerCard}>
          <div style={styles.ledgerHeader}>
            <Receipt size={16} style={{ color: '#10b981' }} />
            <h3 style={styles.ledgerTitle}>Operational Expenses Ledger</h3>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Vehicle</th>
                  <th style={styles.th}>Category & Details</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map((exp) => {
                    const vehicleObj = vehicles.find(v => v.id === exp.vehicleId);
                    return (
                      <tr key={exp.id} style={styles.tr}>
                        <td style={styles.regTd}>
                          {vehicleObj ? vehicleObj.registrationNumber : exp.vehicleId}
                        </td>
                        <td style={styles.td}>
                          <span style={{ 
                            ...styles.categoryBadge,
                            backgroundColor: exp.type === 'Maintenance' ? 'rgba(245,158,11,0.08)' : 'rgba(59,130,246,0.08)',
                            color: exp.type === 'Maintenance' ? '#f59e0b' : '#3b82f6',
                            border: exp.type === 'Maintenance' ? '1px solid rgba(245,158,11,0.15)' : '1px solid rgba(59,130,246,0.15)'
                          }}>
                            {exp.type}
                          </span>
                          <div style={{ ...styles.faintDetail, marginTop: '2px' }}>{exp.description}</div>
                        </td>
                        <td style={styles.td}>
                          <StatusBadge status={exp.status} />
                        </td>
                        <td style={{ ...styles.td, fontWeight: 700, color: '#ef4444' }}>
                          ₹{exp.amount.toLocaleString('en-IN')}
                        </td>
                        <td style={styles.td}>{formatDateDMY(exp.date)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} style={styles.emptyCell}>No expenses logged.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Toast notifications */}
      <Toast message={toast} onClose={() => setToast(null)} />

      {/* Logging Dialog Drawer */}
      {isFormOpen && (
        <div style={styles.modalOverlay}>
          <div className="card" style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {modalType === 'fuel' ? 'Log Refill Entry' : 'Record Operating Expense'}
              </h3>
              <button style={styles.closeBtn} onClick={() => setIsFormOpen(false)}>
                <X size={16} />
              </button>
            </div>

            {modalType === 'fuel' ? (
              <form onSubmit={handleSaveFuel}>
                <div className="form-group">
                  <label className="form-label">Vehicle Registration</label>
                  <select 
                    className="form-input"
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                  >
                    <option value="">-- Select Vehicle --</option>
                    {vehicles.filter(v => v.status !== 'Retired').map(v => (
                      <option key={v.id} value={v.id}>{v.registrationNumber} ({v.type})</option>
                    ))}
                  </select>
                  {formErrors.vehicle && <span style={styles.errorText}>{formErrors.vehicle}</span>}
                </div>

                <div style={styles.formRow}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Fuel Date</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={fuelDate}
                      onChange={(e) => setFuelDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Odometer Reading (km)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="e.g. 46200"
                      value={odometer}
                      onChange={(e) => setOdometer(e.target.value)}
                    />
                    {formErrors.odometer && <span style={styles.errorText}>{formErrors.odometer}</span>}
                  </div>
                </div>

                <div style={styles.formRow}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Quantity (Liters)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="e.g. 50"
                      value={liters}
                      onChange={(e) => setLiters(e.target.value)}
                    />
                    {formErrors.liters && <span style={styles.errorText}>{formErrors.liters}</span>}
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Price per Liter (₹)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="e.g. 95"
                      value={pricePerLiter}
                      onChange={(e) => setPricePerLiter(e.target.value)}
                    />
                    {formErrors.price && <span style={styles.errorText}>{formErrors.price}</span>}
                  </div>
                </div>

                {/* Auto Calculated Cost Preview */}
                {Number(liters) > 0 && Number(pricePerLiter) > 0 && (
                  <div style={styles.costCalculationPreview}>
                    Total Cost: <span style={{ color: '#10b981', fontWeight: 700 }}>₹{(Number(liters) * Number(pricePerLiter)).toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div style={styles.formRow}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Fuel Station</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. HP Fuel Pump, Delhi"
                      value={station}
                      onChange={(e) => setStation(e.target.value)}
                    />
                    {formErrors.station && <span style={styles.errorText}>{formErrors.station}</span>}
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Payment Method</label>
                    <select 
                      className="form-input"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                    >
                      <option value="UPI">UPI Payment</option>
                      <option value="Fastag">Fastag</option>
                      <option value="Card">Credit/Debit Card</option>
                      <option value="Cash">Cash</option>
                      <option value="Net Banking">Net Banking</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Driver Assigned</label>
                  <select 
                    className="form-input"
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                  >
                    <option value="">-- Choose Operator --</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.id})</option>
                    ))}
                  </select>
                  {formErrors.driver && <span style={styles.errorText}>{formErrors.driver}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea 
                    className="form-input" 
                    placeholder="Enter additional trip log remarks..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{ minHeight: '50px', resize: 'vertical' }}
                  />
                </div>

                <div style={styles.modalFooter}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Record Refill
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSaveExpense}>
                <div className="form-group">
                  <label className="form-label">Vehicle Registration</label>
                  <select 
                    className="form-input"
                    value={expenseVehicleId}
                    onChange={(e) => setExpenseVehicleId(e.target.value)}
                  >
                    <option value="">-- Select Vehicle --</option>
                    {vehicles.filter(v => v.status !== 'Retired').map(v => (
                      <option key={v.id} value={v.id}>{v.registrationNumber} ({v.type})</option>
                    ))}
                  </select>
                  {formErrors.vehicle && <span style={styles.errorText}>{formErrors.vehicle}</span>}
                </div>

                <div style={styles.formRow}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Expense Category</label>
                    <select 
                      className="form-input"
                      value={expenseType}
                      onChange={(e) => setExpenseType(e.target.value as any)}
                    >
                      <option value="Toll">Road Toll Fee</option>
                      <option value="Parking">Parking Charges</option>
                      <option value="Maintenance">Maintenance Shop</option>
                      <option value="Insurance">Insurance Policy</option>
                      <option value="Permit">National Permit Fee</option>
                      <option value="Cleaning">Cleaning & Wash</option>
                      <option value="Other">Other Expenses</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Total Cost (₹)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="e.g. 350"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    {formErrors.amount && <span style={styles.errorText}>{formErrors.amount}</span>}
                  </div>
                </div>

                <div style={styles.formRow}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Logged Date</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Approval Status</label>
                    <select 
                      className="form-input"
                      value={expenseStatus}
                      onChange={(e) => setExpenseStatus(e.target.value as any)}
                    >
                      <option value="Approved">Approved</option>
                      <option value="Pending">Pending</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description / Remarks</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Sanjay Gandhi Nagar RTO entry fee"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  {formErrors.description && <span style={styles.errorText}>{formErrors.description}</span>}
                </div>

                {/* Attach Bill (UI Only) */}
                <div className="form-group">
                  <label className="form-label">Attach Bill Receipt</label>
                  <input 
                    type="file" 
                    className="form-input" 
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        setBillFileName(files[0].name);
                      }
                    }}
                    style={{ padding: '0.375rem 0.5rem' }}
                  />
                  {billFileName && (
                    <span style={{ fontSize: '11px', color: '#10b981', marginTop: '4px', display: 'block' }}>
                      📎 File attached: {billFileName}
                    </span>
                  )}
                </div>

                <div style={styles.modalFooter}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Record Expense
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '0.25rem',
  },
  btnGroup: {
    display: 'flex',
    gap: '0.5rem',
  },
  analyticsSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.25rem',
    marginBottom: '1.5rem',
  },
  kpiRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '0.75rem',
    '@media (max-width: 1024px)': {
      gridTemplateColumns: 'repeat(3, 1fr)',
    },
    '@media (max-width: 640px)': {
      gridTemplateColumns: '1fr 1fr',
    },
  } as React.CSSProperties,
  kpiCard: {
    padding: '0.75rem 1rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
  },
  kpiLabel: {
    fontSize: '0.6875rem',
    color: '#9ca3af',
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  kpiValue: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#ffffff',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '1.25rem',
    '@media (max-width: 1024px)': {
      gridTemplateColumns: '1fr',
    },
  } as React.CSSProperties,
  chartCard: {
    padding: '1rem',
  },
  chartTitle: {
    fontSize: '0.8125rem',
    fontWeight: 700,
    color: '#ffffff',
  },
  leadersGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr 1fr',
    gap: '1.25rem',
    '@media (max-width: 1024px)': {
      gridTemplateColumns: '1fr',
    },
  } as React.CSSProperties,
  leaderCardBlock: {
    padding: '1rem',
  },
  highlightRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  highlightLabel: {
    fontSize: '0.6875rem',
    color: '#9ca3af',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    display: 'block',
  },
  highlightVal: {
    fontSize: '0.875rem',
    fontWeight: 700,
    color: '#7c3aed',
    display: 'block',
    marginTop: '2px',
  },
  leaderMiniTable: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.375rem',
    marginTop: '0.5rem',
  },
  leaderMiniRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: '#ffffff',
    borderBottom: '1px solid #111111',
    paddingBottom: '2px',
  },
  leaderMiniVal: {
    fontWeight: 700,
    color: '#9ca3af',
  },
  searchBarCard: {
    padding: '0.75rem 1rem',
    marginBottom: '1.25rem',
  },
  twoColumnGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.25rem',
    alignItems: 'start',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  } as React.CSSProperties,
  ledgerCard: {
    padding: '1.25rem 0 0 0',
    overflow: 'hidden',
  },
  ledgerHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0 1.25rem 0.5rem 1.25rem',
    borderBottom: '1px solid #262626',
  },
  ledgerTitle: {
    fontSize: '0.8125rem',
    fontWeight: 700,
    color: '#9ca3af',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  tableWrapper: {
    overflowX: 'auto' as const,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '0.8125rem',
    textAlign: 'left' as const,
  },
  thRow: {
    borderBottom: '1px solid #262626',
    backgroundColor: '#111111',
  },
  th: {
    padding: '0.625rem 1.25rem',
    fontWeight: 600,
    color: '#9ca3af',
    fontSize: '0.75rem',
  },
  tr: {
    borderBottom: '1px solid #1a1a1a',
    backgroundColor: '#0b0b0b',
  },
  regTd: {
    padding: '0.625rem 1.25rem',
    fontWeight: 700,
    color: '#ffffff',
  },
  td: {
    padding: '0.625rem 1.25rem',
    color: '#ffffff',
  },
  detailText: {
    fontWeight: 650,
  },
  faintDetail: {
    color: '#9ca3af',
    fontSize: '11px',
    marginTop: '1px',
  },
  categoryBadge: {
    padding: '0.125rem 0.5rem',
    borderRadius: '100px',
    fontSize: '0.6875rem',
    fontWeight: 600,
    display: 'inline-block',
  },
  costCalculationPreview: {
    padding: '0.5rem 0.75rem',
    backgroundColor: '#000000',
    border: '1px solid #262626',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#9ca3af',
    marginBottom: '1rem',
  },
  emptyCell: {
    padding: '3rem',
    textAlign: 'center' as const,
    color: '#9ca3af',
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  modalCard: {
    width: '100%',
    maxWidth: '480px',
    backgroundColor: '#0b0b0b',
    border: '1px solid #262626',
    borderRadius: '4px',
    padding: '1.25rem',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #262626',
    paddingBottom: '0.5rem',
    marginBottom: '1rem',
  },
  modalTitle: {
    fontSize: '0.9375rem',
    fontWeight: 700,
    color: '#ffffff',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
  },
  formRow: {
    display: 'flex',
    gap: '0.75rem',
  },
  errorText: {
    fontSize: '0.75rem',
    color: '#ef4444',
    marginTop: '0.25rem',
    display: 'block',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.5rem',
    borderTop: '1px solid #262626',
    paddingTop: '0.75rem',
    marginTop: '1rem',
  },
  faintText: {
    fontSize: '11px',
    color: '#9ca3af',
  },
};
