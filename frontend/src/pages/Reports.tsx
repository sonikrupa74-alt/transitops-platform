import React, { useState } from 'react';
import { 
  Download, 
  BarChart3, 
  Sparkles,
  Printer
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Cell, 
  LineChart, 
  Line, 
  PieChart, 
  Pie 
} from 'recharts';
import { 
  getVehicles, 
  getTrips, 
  getFuelLogs, 
  getExpenses,
  getDrivers
} from '../utils/storage';
import { PageHeader } from '../components/ERPComponents';

export default function Reports() {
  // Load data dynamically
  const vehicles = getVehicles();
  const trips = getTrips();
  const fuelLogs = getFuelLogs();
  const expenses = getExpenses();
  const drivers = getDrivers();

  // Filters State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [selectedDriver, setSelectedDriver] = useState('all');
  const [selectedVehicleType, setSelectedVehicleType] = useState('all');
  const [selectedTripStatus, setSelectedTripStatus] = useState('all');

  // Chart Deck active tab
  const [activeTab, setActiveTab] = useState<'overview' | 'vehicles' | 'maintenance' | 'drivers'>('overview');

  // Filter application helper
  const filterTrips = (t: any) => {
    const tripDate = new Date(t.createdAt);
    if (startDate && tripDate < new Date(startDate)) return false;
    if (endDate && tripDate > new Date(endDate)) return false;
    if (selectedVehicle !== 'all' && t.vehicleId !== selectedVehicle) return false;
    if (selectedDriver !== 'all' && t.driverId !== selectedDriver) return false;
    if (selectedTripStatus !== 'all' && t.status !== selectedTripStatus) return false;
    
    const v = vehicles.find(veh => veh.id === t.vehicleId);
    if (selectedVehicleType !== 'all' && v?.type.toLowerCase() !== selectedVehicleType.toLowerCase()) return false;
    
    return true;
  };

  const filteredTrips = trips.filter(filterTrips);

  const filterFuel = (f: any) => {
    const logDate = new Date(f.date);
    if (startDate && logDate < new Date(startDate)) return false;
    if (endDate && logDate > new Date(endDate)) return false;
    if (selectedVehicle !== 'all' && f.vehicleId !== selectedVehicle) return false;
    if (selectedDriver !== 'all' && f.driverId !== selectedDriver) return false;
    
    const v = vehicles.find(veh => veh.id === f.vehicleId);
    if (selectedVehicleType !== 'all' && v?.type.toLowerCase() !== selectedVehicleType.toLowerCase()) return false;
    
    return true;
  };

  const filteredFuelLogs = fuelLogs.filter(filterFuel);

  const filterExpenses = (e: any) => {
    const expDate = new Date(e.date);
    if (startDate && expDate < new Date(startDate)) return false;
    if (endDate && expDate > new Date(endDate)) return false;
    if (selectedVehicle !== 'all' && e.vehicleId !== selectedVehicle) return false;
    
    const v = vehicles.find(veh => veh.id === e.vehicleId);
    if (selectedVehicleType !== 'all' && v?.type.toLowerCase() !== selectedVehicleType.toLowerCase()) return false;
    
    return true;
  };

  const filteredExpenses = expenses.filter(filterExpenses);

  // 1. KPI Calculations
  const totalVehiclesCount = vehicles.length;
  const activeVehiclesCount = vehicles.filter(v => v.status === 'Available' || v.status === 'On Trip').length;
  const vehiclesOnTripCount = vehicles.filter(v => v.status === 'On Trip').length;
  const vehiclesInShopCount = vehicles.filter(v => v.status === 'In Shop').length;
  const fleetUtilizationPercent = totalVehiclesCount > 0 
    ? parseFloat(((vehiclesOnTripCount / totalVehiclesCount) * 100).toFixed(1)) 
    : 0;

  const totalTripsCount = filteredTrips.length;
  const completedTripsCount = filteredTrips.filter(t => t.status === 'Completed').length;
  const cancelledTripsCount = filteredTrips.filter(t => t.status === 'Cancelled').length;
  
  const completedTrips = filteredTrips.filter(t => t.status === 'Completed');
  const avgTripDistance = completedTrips.length > 0 
    ? parseFloat((completedTrips.reduce((sum, t) => sum + t.plannedDistance, 0) / completedTrips.length).toFixed(1)) 
    : 0;

  const totalRevenue = completedTrips.reduce((sum, t) => sum + t.revenue, 0);
  const totalFuelCost = filteredFuelLogs.reduce((sum, f) => sum + f.cost, 0);
  const totalOtherExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalOperationalCost = totalFuelCost + totalOtherExpenses;
  const netProfit = totalRevenue - totalOperationalCost;

  const avgCostPerTrip = totalTripsCount > 0 ? parseFloat((totalOperationalCost / totalTripsCount).toFixed(0)) : 0;
  const avgRevenuePerTrip = totalTripsCount > 0 ? parseFloat((totalRevenue / totalTripsCount).toFixed(0)) : 0;

  const activeDriversCount = drivers.filter(d => d.status !== 'Suspended').length;
  const driversOnTripCount = drivers.filter(d => d.status === 'On Trip').length;
  const driverUtilizationPercent = activeDriversCount > 0 
    ? parseFloat(((driversOnTripCount / activeDriversCount) * 100).toFixed(1)) 
    : 0;

  // 2. BI Insights Engine
  const vehicleEarnings = vehicles.map(v => {
    const rev = trips.filter(t => t.vehicleId === v.id && t.status === 'Completed').reduce((s, t) => s + t.revenue, 0);
    const fuel = fuelLogs.filter(f => f.vehicleId === v.id).reduce((s, f) => s + f.cost, 0);
    const exp = expenses.filter(e => e.vehicleId === v.id).reduce((s, e) => s + e.amount, 0);
    const l = fuelLogs.filter(f => f.vehicleId === v.id).reduce((s, f) => s + f.liters, 0);
    return { id: v.id, reg: v.registrationNumber, net: rev - (fuel + exp), liters: l, revenue: rev, cost: fuel + exp };
  });

  const sortedVehicles = [...vehicleEarnings].sort((a, b) => b.net - a.net);
  const bestVehicle = sortedVehicles.length > 0 ? sortedVehicles[0].reg : 'N/A';
  const worstVehicle = sortedVehicles.length > 0 ? sortedVehicles[sortedVehicles.length - 1].reg : 'N/A';

  const highestFuelVehicle = [...vehicleEarnings].sort((a, b) => b.liters - a.liters)[0]?.reg || 'N/A';

  // Route Analysis
  const routeMap: Record<string, { route: string; tripsCount: number; revenue: number; cost: number }> = {};
  trips.forEach(t => {
    const routeKey = `${t.source} ➔ ${t.destination}`;
    if (!routeMap[routeKey]) {
      routeMap[routeKey] = { route: routeKey, tripsCount: 0, revenue: 0, cost: 0 };
    }
    routeMap[routeKey].tripsCount++;
    if (t.status === 'Completed') {
      routeMap[routeKey].revenue += t.revenue;
      const fuelCost = fuelLogs.filter(f => f.vehicleId === t.vehicleId && f.date.split('T')[0] === t.createdAt.split('T')[0]).reduce((s, f) => s + f.cost, 0);
      routeMap[routeKey].cost += fuelCost;
    }
  });

  const routes = Object.values(routeMap);
  const mostFrequentRoute = routes.sort((a, b) => b.tripsCount - a.tripsCount)[0]?.route || 'N/A';
  const mostProfitableRoute = routes.sort((a, b) => (b.revenue - b.cost) - (a.revenue - a.cost))[0]?.route || 'N/A';

  // Driver of the Month
  const driverPerformance = drivers.map(d => {
    const completedCount = trips.filter(t => t.driverId === d.id && t.status === 'Completed').length;
    return { name: d.name, score: d.safetyScore, trips: completedCount };
  });
  const driverOfTheMonth = driverPerformance.filter(dp => dp.score >= 4.5).sort((a, b) => b.trips - a.trips)[0]?.name || 'Rahul Sharma';

  // Maintenance Warning
  const maintenanceSoonVehicles = vehicles.filter(v => v.odometer > 100000 && v.status !== 'In Shop').map(v => v.registrationNumber);

  // 3. Time Series Data for Charts
  const getMonthStr = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('default', { month: 'short', year: '2-digit' });
  };

  const monthlyGroup: Record<string, { month: string; trips: number; revenue: number; expenses: number; fuel: number; maintenance: number }> = {};
  
  filteredTrips.forEach(t => {
    const m = getMonthStr(t.createdAt);
    if (!monthlyGroup[m]) monthlyGroup[m] = { month: m, trips: 0, revenue: 0, expenses: 0, fuel: 0, maintenance: 0 };
    monthlyGroup[m].trips++;
    if (t.status === 'Completed') monthlyGroup[m].revenue += t.revenue;
  });

  filteredFuelLogs.forEach(f => {
    const m = getMonthStr(f.date);
    if (!monthlyGroup[m]) monthlyGroup[m] = { month: m, trips: 0, revenue: 0, expenses: 0, fuel: 0, maintenance: 0 };
    monthlyGroup[m].expenses += f.cost;
    monthlyGroup[m].fuel += f.liters;
  });

  filteredExpenses.forEach(e => {
    const m = getMonthStr(e.date);
    if (!monthlyGroup[m]) monthlyGroup[m] = { month: m, trips: 0, revenue: 0, expenses: 0, fuel: 0, maintenance: 0 };
    monthlyGroup[m].expenses += e.amount;
    if (e.type === 'Maintenance') monthlyGroup[m].maintenance += e.amount;
  });

  const chartTimeData = Object.values(monthlyGroup).sort((a, b) => {
    const parse = (str: string) => {
      const parts = str.split(' ');
      return new Date(2000 + Number(parts[1]), ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(parts[0]));
    };
    return parse(a.month).getTime() - parse(b.month).getTime();
  });

  // Operational Cost breakdown
  const costBreakdownData = [
    { name: 'Fuel Refills', value: totalFuelCost },
    { name: 'Tolls', value: filteredExpenses.filter(e => e.type === 'Toll').reduce((s, e) => s + e.amount, 0) },
    { name: 'Maintenance Services', value: filteredExpenses.filter(e => e.type === 'Maintenance').reduce((s, e) => s + e.amount, 0) },
    { name: 'Permits & Permits', value: filteredExpenses.filter(e => e.type === 'Permit').reduce((s, e) => s + e.amount, 0) },
    { name: 'Insurance & Taxes', value: filteredExpenses.filter(e => e.type === 'Insurance').reduce((s, e) => s + e.amount, 0) },
    { name: 'Other Costs', value: filteredExpenses.filter(e => e.type === 'Other' || e.type === 'Parking' || e.type === 'Cleaning').reduce((s, e) => s + e.amount, 0) },
  ].filter(item => item.value > 0);

  // Vehicle Profit and Revenue Top list
  const chartVehicleRevenueData = vehicleEarnings.map(ve => ({
    name: ve.reg,
    Revenue: ve.revenue,
    Profit: ve.net
  })).sort((a, b) => b.Revenue - a.Revenue);

  // Status distributions
  const vehicleStatusData = [
    { name: 'Available', value: vehicles.filter(v => v.status === 'Available').length },
    { name: 'On Trip', value: vehicles.filter(v => v.status === 'On Trip').length },
    { name: 'In Shop', value: vehicles.filter(v => v.status === 'In Shop').length },
  ].filter(v => v.value > 0);

  const tripStatusData = [
    { name: 'Completed', value: filteredTrips.filter(t => t.status === 'Completed').length },
    { name: 'Dispatched', value: filteredTrips.filter(t => t.status === 'Dispatched').length },
    { name: 'Cancelled', value: filteredTrips.filter(t => t.status === 'Cancelled').length },
    { name: 'Draft', value: filteredTrips.filter(t => t.status === 'Draft').length },
  ].filter(v => v.value > 0);

  // Driver Safety Metrics
  const chartDriverData = drivers.map(d => {
    const completed = trips.filter(t => t.driverId === d.id && t.status === 'Completed').length;
    return {
      name: d.name.split(' ')[0], // short name
      Safety: d.safetyScore,
      Trips: completed
    };
  });

  // Top used vehicles (completed trips count)
  const topUsedVehicles = vehicles.map(v => {
    const count = trips.filter(t => t.vehicleId === v.id).length;
    return { name: v.registrationNumber, Trips: count };
  }).sort((a, b) => b.Trips - a.Trips).slice(0, 10);

  // Maintenance frequency
  const maintenanceFreq = vehicles.map(v => {
    const count = expenses.filter(e => e.vehicleId === v.id && e.type === 'Maintenance').length;
    return { name: v.registrationNumber, Services: count };
  }).sort((a, b) => b.Services - a.Services);

  const COLORS = ['#7c3aed', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#ef4444'];

  const handleExportCSV = () => {
    const headers = [
      'Report Item',
      'Value'
    ];
    const rows = [
      ['Total Fleet Vehicles', totalVehiclesCount],
      ['Active Vehicles', activeVehiclesCount],
      ['Vehicles On Trip', vehiclesOnTripCount],
      ['Vehicles In Workshop', vehiclesInShopCount],
      ['Fleet Utilization (%)', `${fleetUtilizationPercent}%`],
      ['Total Booked Trips', totalTripsCount],
      ['Completed Dispatches', completedTripsCount],
      ['Cancelled Journeys', cancelledTripsCount],
      ['Average Route Distance (km)', `${avgTripDistance} km`],
      ['Fleet Total Cost (₹)', totalOperationalCost],
      ['Fleet Gross Revenue (₹)', totalRevenue],
      ['Net Margin Profit (₹)', netProfit],
      ['Average Cost Per Dispatch (₹)', avgCostPerTrip],
      ['Average Revenue Per Dispatch (₹)', avgRevenuePerTrip],
      ['Active Driver Operators', activeDriversCount],
      ['Driver Utilization (%)', `${driverUtilizationPercent}%`],
      ['Best Performing Vehicle', bestVehicle],
      ['Highest Fuel Consuming Vehicle', highestFuelVehicle],
      ['Most Profitable Route', mostProfitableRoute]
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `TransitOps_BI_Analytics_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div style={styles.container} className="print-area">
      <PageHeader 
        title="Fleet Analytics & Business Intelligence"
        description="Executive BI Control Desk providing real-time fleet utilization tracking, revenue analytics, and route performance audits."
        breadcrumbs={[{ label: 'TransitOps ERP', link: '/' }, { label: 'BI Analytics', active: true }]}
        actions={
          <div style={styles.btnGroup} className="no-print">
            <button className="btn btn-secondary" onClick={handlePrintPDF}>
              <Printer size={14} />
              <span>Print / Export PDF</span>
            </button>
            <button className="btn btn-primary" onClick={handleExportCSV}>
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        }
      />

      {/* BI Filters Section */}
      <div className="card no-print" style={styles.filterCard}>
        <div style={styles.filterGroup}>
          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>Start Date</label>
            <input 
              type="date" 
              className="form-input" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              style={styles.filterInput}
            />
          </div>
          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>End Date</label>
            <input 
              type="date" 
              className="form-input" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              style={styles.filterInput}
            />
          </div>
          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>Vehicle Type</label>
            <select 
              className="form-input" 
              value={selectedVehicleType}
              onChange={(e) => setSelectedVehicleType(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="all">All Types</option>
              <option value="van">Van</option>
              <option value="box truck">Box Truck</option>
              <option value="semi-truck">Semi-Truck</option>
              <option value="flatbed">Flatbed</option>
            </select>
          </div>
          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>Vehicle ID</label>
            <select 
              className="form-input" 
              value={selectedVehicle} 
              onChange={(e) => setSelectedVehicle(e.target.value)} 
              style={styles.filterSelect}
            >
              <option value="all">All Vehicles</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.registrationNumber}</option>
              ))}
            </select>
          </div>
          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>Driver Operator</label>
            <select 
              className="form-input" 
              value={selectedDriver} 
              onChange={(e) => setSelectedDriver(e.target.value)} 
              style={styles.filterSelect}
            >
              <option value="all">All Drivers</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>Trip Status</label>
            <select 
              className="form-input" 
              value={selectedTripStatus} 
              onChange={(e) => setSelectedTripStatus(e.target.value)} 
              style={styles.filterSelect}
            >
              <option value="all">All States</option>
              <option value="Draft">Draft</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Metrics Dashboard Grid */}
      <div style={styles.kpiDashboardGrid}>
        {/* Row 1: Fleet Inventory & Status */}
        <div className="card" style={styles.kpiCard}>
          <span style={styles.kpiTitle}>Total Fleet Vehicles</span>
          <span style={styles.kpiValue}>{totalVehiclesCount}</span>
          <span style={styles.kpiMeta}>Active: {activeVehiclesCount} | In Shop: {vehiclesInShopCount}</span>
        </div>
        <div className="card" style={styles.kpiCard}>
          <span style={styles.kpiTitle}>Fleet Utilization</span>
          <span style={{ ...styles.kpiValue, color: '#7c3aed' }}>{fleetUtilizationPercent}%</span>
          <span style={styles.kpiMeta}>Vehicles currently on route</span>
        </div>
        <div className="card" style={styles.kpiCard}>
          <span style={styles.kpiTitle}>Total Booked Trips</span>
          <span style={styles.kpiValue}>{totalTripsCount}</span>
          <span style={styles.kpiMeta}>Completed: {completedTripsCount} | Cancel: {cancelledTripsCount}</span>
        </div>
        <div className="card" style={styles.kpiCard}>
          <span style={styles.kpiTitle}>Average Route Distance</span>
          <span style={styles.kpiValue}>{avgTripDistance} km</span>
          <span style={styles.kpiMeta}>Per completed dispatch</span>
        </div>

        {/* Row 2: Financial Stats */}
        <div className="card" style={styles.kpiCard}>
          <span style={styles.kpiTitle}>Fleet Gross Revenue</span>
          <span style={{ ...styles.kpiValue, color: '#10b981' }}>₹{totalRevenue.toLocaleString('en-IN')}</span>
          <span style={styles.kpiMeta}>Avg/Trip: ₹{avgRevenuePerTrip.toLocaleString('en-IN')}</span>
        </div>
        <div className="card" style={styles.kpiCard}>
          <span style={styles.kpiTitle}>Total Operational Cost</span>
          <span style={{ ...styles.kpiValue, color: '#ef4444' }}>₹{totalOperationalCost.toLocaleString('en-IN')}</span>
          <span style={styles.kpiMeta}>Avg/Trip: ₹{avgCostPerTrip.toLocaleString('en-IN')}</span>
        </div>
        <div className="card" style={styles.kpiCard}>
          <span style={styles.kpiTitle}>Net Profit Margins</span>
          <span style={{ ...styles.kpiValue, color: netProfit >= 0 ? '#10b981' : '#ef4444' }}>
            {netProfit < 0 ? '-' : ''}₹{Math.abs(netProfit).toLocaleString('en-IN')}
          </span>
          <span style={styles.kpiMeta}>Revenue minus operational costs</span>
        </div>
        <div className="card" style={styles.kpiCard}>
          <span style={styles.kpiTitle}>Active Driver Pool</span>
          <span style={styles.kpiValue}>{activeDriversCount} Drivers</span>
          <span style={styles.kpiMeta}>Utilization: {driverUtilizationPercent}%</span>
        </div>
      </div>

      {/* Automated BI Insights Section */}
      <div className="card" style={styles.insightsCard}>
        <div style={styles.insightsHeader}>
          <Sparkles size={16} style={{ color: '#a78bfa' }} />
          <h3 style={styles.insightsTitle}>Automated Fleet Business Intelligence Insights</h3>
        </div>
        <div style={styles.insightsGrid}>
          <div style={styles.insightBlock}>
            <span style={styles.insightLabel}>Best Performing Vehicle</span>
            <span style={styles.insightValue}>{bestVehicle}</span>
            <span style={styles.insightSub}>Highest net margin return</span>
          </div>
          <div style={styles.insightBlock}>
            <span style={styles.insightLabel}>Worst Performing Vehicle</span>
            <span style={styles.insightValue}>{worstVehicle}</span>
            <span style={styles.insightSub}>Lowest cumulative operational profit</span>
          </div>
          <div style={styles.insightBlock}>
            <span style={styles.insightLabel}>Highest Fuel Consumer</span>
            <span style={styles.insightValue}>{highestFuelVehicle}</span>
            <span style={styles.insightSub}>Highest volume of liters consumed</span>
          </div>
          <div style={styles.insightBlock}>
            <span style={styles.insightLabel}>Most Profitable Route</span>
            <span style={{ ...styles.insightValue, fontSize: '0.75rem', fontWeight: 700, color: '#ffffff' }}>
              {mostProfitableRoute}
            </span>
            <span style={styles.insightSub}>Highest net trip revenue</span>
          </div>
          <div style={styles.insightBlock}>
            <span style={styles.insightLabel}>Most Frequent Dispatch Route</span>
            <span style={{ ...styles.insightValue, fontSize: '0.75rem', fontWeight: 700, color: '#ffffff' }}>
              {mostFrequentRoute}
            </span>
            <span style={styles.insightSub}>Highest route trip count</span>
          </div>
          <div style={styles.insightBlock}>
            <span style={styles.insightLabel}>Driver of the Month</span>
            <span style={styles.insightValue}>{driverOfTheMonth}</span>
            <span style={styles.insightSub}>Top safety score and dispatch count</span>
          </div>
        </div>
        
        <div style={styles.insightRecommendations}>
          <h4 style={styles.recommendationTitle}>BI Actions & Recommendations</h4>
          <ul style={styles.recommendationsList}>
            <li>
              🚨 <strong>Maintenance Alerts:</strong> {maintenanceSoonVehicles.length > 0 
                ? `Vehicles ${maintenanceSoonVehicles.join(', ')} have high mileage and are recommended for maintenance soon.` 
                : 'All fleet vehicle odometers are currently within safe operating limits.'}
            </li>
            <li>
              📈 <strong>Fleet Optimization:</strong> {fleetUtilizationPercent < 40 
                ? 'Current fleet utilization is low. Recommended to consolidate schedules or acquire additional GIDC logistics cargo contracts.' 
                : 'Fleet utilization is highly optimal. Maintain asset turnarounds.'}
            </li>
            <li>
              💰 <strong>Cost Saving Opportunity:</strong> Fuel fills comprise {(totalFuelCost / (totalOperationalCost || 1) * 100).toFixed(0)}% of operational expenses. Recommended to enforce route planning for {highestFuelVehicle} to cut down fuel costs.
            </li>
          </ul>
        </div>
      </div>

      {/* Interactive Charts Browsing Desk */}
      <div className="card no-print" style={styles.chartDeckCard}>
        <div style={styles.deckHeader}>
          <BarChart3 size={16} style={{ color: '#7c3aed' }} />
          <span style={styles.deckTitle}>Interactive Analytics Desk</span>
          
          <div style={styles.tabList}>
            <button 
              style={{ ...styles.tabBtn, ...(activeTab === 'overview' ? styles.tabBtnActive : {}) }}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              style={{ ...styles.tabBtn, ...(activeTab === 'vehicles' ? styles.tabBtnActive : {}) }}
              onClick={() => setActiveTab('vehicles')}
            >
              Vehicle Analytics
            </button>
            <button 
              style={{ ...styles.tabBtn, ...(activeTab === 'maintenance' ? styles.tabBtnActive : {}) }}
              onClick={() => setActiveTab('maintenance')}
            >
              Maintenance & Fuel
            </button>
            <button 
              style={{ ...styles.tabBtn, ...(activeTab === 'drivers' ? styles.tabBtnActive : {}) }}
              onClick={() => setActiveTab('drivers')}
            >
              Driver Performance
            </button>
          </div>
        </div>

        {/* Dynamic Chart Display depending on Tab */}
        {activeTab === 'overview' && (
          <div style={styles.deckGrid}>
            <div style={styles.chartBlock}>
              <h4 style={styles.chartHeader}>Monthly Trips Trend</h4>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartTimeData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                    <XAxis dataKey="month" stroke="#9ca3af" fontSize={9} />
                    <YAxis stroke="#9ca3af" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: '#0b0b0b', borderColor: '#262626', fontSize: '10px' }} />
                    <Bar dataKey="trips" name="Trips count" fill="#7c3aed" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={styles.chartBlock}>
              <h4 style={styles.chartHeader}>Revenue vs Operating Cost (₹)</h4>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartTimeData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                    <XAxis dataKey="month" stroke="#9ca3af" fontSize={9} />
                    <YAxis stroke="#9ca3af" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: '#0b0b0b', borderColor: '#262626', fontSize: '10px' }} />
                    <Legend wrapperStyle={{ fontSize: '9px' }} />
                    <Bar dataKey="revenue" name="Revenue (₹)" fill="#10b981" />
                    <Bar dataKey="expenses" name="Operational Cost (₹)" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={styles.chartBlock}>
              <h4 style={styles.chartHeader}>Operational Cost Breakdown</h4>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={costBreakdownData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {costBreakdownData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0b0b0b', borderColor: '#262626', fontSize: '10px' }} />
                    <Legend wrapperStyle={{ fontSize: '7.5px' }} layout="vertical" align="right" verticalAlign="middle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={styles.chartBlock}>
              <h4 style={styles.chartHeader}>Fleet Asset Utilization History</h4>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartTimeData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                    <XAxis dataKey="month" stroke="#9ca3af" fontSize={9} />
                    <YAxis stroke="#9ca3af" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: '#0b0b0b', borderColor: '#262626', fontSize: '10px' }} />
                    <Line type="monotone" dataKey="trips" name="Activity factor" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vehicles' && (
          <div style={styles.deckGrid}>
            <div style={styles.chartBlock}>
              <h4 style={styles.chartHeader}>Vehicle-wise Revenue Performance</h4>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartVehicleRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={9} />
                    <YAxis stroke="#9ca3af" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: '#0b0b0b', borderColor: '#262626', fontSize: '10px' }} />
                    <Bar dataKey="Revenue" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={styles.chartBlock}>
              <h4 style={styles.chartHeader}>Vehicle-wise Net Profit margins (₹)</h4>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartVehicleRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={9} />
                    <YAxis stroke="#9ca3af" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: '#0b0b0b', borderColor: '#262626', fontSize: '10px' }} />
                    <Bar dataKey="Profit" fill="#7c3aed">
                      {chartVehicleRevenueData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.Profit >= 0 ? '#10b981' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={styles.chartBlock}>
              <h4 style={styles.chartHeader}>Top 10 Most Active Vehicles (Trip Count)</h4>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topUsedVehicles}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={9} />
                    <YAxis stroke="#9ca3af" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: '#0b0b0b', borderColor: '#262626', fontSize: '10px' }} />
                    <Bar dataKey="Trips" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={styles.chartBlock}>
              <h4 style={styles.chartHeader}>Vehicle Status Distribution</h4>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={vehicleStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      dataKey="value"
                    >
                      {vehicleStatusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0b0b0b', borderColor: '#262626', fontSize: '10px' }} />
                    <Legend wrapperStyle={{ fontSize: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div style={styles.deckGrid}>
            <div style={styles.chartBlock}>
              <h4 style={styles.chartHeader}>Monthly Maintenance Cost (₹)</h4>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartTimeData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                    <XAxis dataKey="month" stroke="#9ca3af" fontSize={9} />
                    <YAxis stroke="#9ca3af" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: '#0b0b0b', borderColor: '#262626', fontSize: '10px' }} />
                    <Bar dataKey="maintenance" name="Maintenance Invoice" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={styles.chartBlock}>
              <h4 style={styles.chartHeader}>Fuel Consumption Trend (Liters)</h4>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartTimeData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                    <XAxis dataKey="month" stroke="#9ca3af" fontSize={9} />
                    <YAxis stroke="#9ca3af" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: '#0b0b0b', borderColor: '#262626', fontSize: '10px' }} />
                    <Line type="monotone" dataKey="fuel" name="Liters filled" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={styles.chartBlock}>
              <h4 style={styles.chartHeader}>Maintenance Frequency per Vehicle</h4>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={maintenanceFreq}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={9} />
                    <YAxis stroke="#9ca3af" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: '#0b0b0b', borderColor: '#262626', fontSize: '10px' }} />
                    <Bar dataKey="Services" name="Repair checkups" fill="#ec4899" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'drivers' && (
          <div style={styles.deckGrid}>
            <div style={styles.chartBlock}>
              <h4 style={styles.chartHeader}>Driver Performance Dashboard</h4>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDriverData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={9} />
                    <YAxis stroke="#9ca3af" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: '#0b0b0b', borderColor: '#262626', fontSize: '10px' }} />
                    <Legend wrapperStyle={{ fontSize: '9px' }} />
                    <Bar dataKey="Safety" name="Safety rating (out of 5)" fill="#10b981" />
                    <Bar dataKey="Trips" name="Completed Journeys" fill="#7c3aed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={styles.chartBlock}>
              <h4 style={styles.chartHeader}>Trip Status Distribution</h4>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tripStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      dataKey="value"
                    >
                      {tripStatusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0b0b0b', borderColor: '#262626', fontSize: '10px' }} />
                    <Legend wrapperStyle={{ fontSize: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

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
  filterCard: {
    padding: '0.75rem 1rem',
    marginBottom: '1.25rem',
  },
  filterGroup: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.75rem',
    alignItems: 'center',
  },
  filterItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
  },
  filterLabel: {
    fontSize: '0.625rem',
    fontWeight: 700,
    color: '#9ca3af',
    textTransform: 'uppercase' as const,
  },
  filterInput: {
    width: '130px',
    padding: '0.25rem 0.5rem',
    fontSize: '0.75rem',
  },
  filterSelect: {
    width: '140px',
    padding: '0.25rem 0.5rem',
    fontSize: '0.75rem',
  },
  kpiDashboardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '0.75rem',
    marginBottom: '1.25rem',
    '@media (max-width: 1024px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    '@media (max-width: 640px)': {
      gridTemplateColumns: '1fr',
    },
  } as React.CSSProperties,
  kpiCard: {
    padding: '0.875rem 1.125rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.125rem',
  },
  kpiTitle: {
    fontSize: '0.6875rem',
    color: '#9ca3af',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  kpiValue: {
    fontSize: '1.25rem',
    fontWeight: 750,
    color: '#ffffff',
  },
  kpiMeta: {
    fontSize: '11px',
    color: '#9ca3af',
    marginTop: '2px',
  },
  insightsCard: {
    padding: '1.25rem',
    marginBottom: '1.25rem',
  },
  insightsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    borderBottom: '1px solid #262626',
    paddingBottom: '0.5rem',
    marginBottom: '1rem',
  },
  insightsTitle: {
    fontSize: '0.8125rem',
    fontWeight: 700,
    color: '#9ca3af',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  insightsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '0.75rem',
    '@media (max-width: 1200px)': {
      gridTemplateColumns: 'repeat(3, 1fr)',
    },
    '@media (max-width: 768px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
  } as React.CSSProperties,
  insightBlock: {
    backgroundColor: '#111111',
    border: '1px solid #262626',
    padding: '0.625rem 0.875rem',
    borderRadius: '2px',
  },
  insightLabel: {
    fontSize: '10px',
    color: '#9ca3af',
    display: 'block',
    textTransform: 'uppercase' as const,
    fontWeight: 600,
  },
  insightValue: {
    fontSize: '0.875rem',
    fontWeight: 750,
    color: '#10b981',
    display: 'block',
    marginTop: '2px',
  },
  insightSub: {
    fontSize: '10px',
    color: '#9ca3af',
    display: 'block',
    marginTop: '2px',
  },
  insightRecommendations: {
    marginTop: '1.25rem',
    borderTop: '1px solid #262626',
    paddingTop: '0.75rem',
  },
  recommendationTitle: {
    fontSize: '0.8125rem',
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: '0.375rem',
  },
  recommendationsList: {
    listStyleType: 'none',
    padding: 0,
    margin: 0,
    fontSize: '0.75rem',
    color: '#9ca3af',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.375rem',
  },
  chartDeckCard: {
    padding: '1.25rem',
  },
  deckHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '1rem',
    borderBottom: '1px solid #262626',
    paddingBottom: '0.75rem',
    marginBottom: '1rem',
  },
  deckTitle: {
    fontSize: '0.8125rem',
    fontWeight: 750,
    color: '#ffffff',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  tabList: {
    display: 'flex',
    gap: '0.25rem',
    backgroundColor: '#111111',
    padding: '0.125rem',
    borderRadius: '2px',
    border: '1px solid #262626',
  },
  tabBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#9ca3af',
    padding: '0.25rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
    borderRadius: '2px',
  },
  tabBtnActive: {
    backgroundColor: '#7c3aed',
    color: '#ffffff',
  },
  deckGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.25rem',
    '@media (max-width: 1024px)': {
      gridTemplateColumns: '1fr',
    },
  } as React.CSSProperties,
  chartBlock: {
    backgroundColor: '#0b0b0b',
    border: '1px solid #262626',
    borderRadius: '2px',
    padding: '1rem',
  },
  chartHeader: {
    fontSize: '0.8125rem',
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: '0.5rem',
  },
  chartContainer: {
    height: '200px',
    width: '100%',
  },
};
