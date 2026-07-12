import React, { useState } from 'react';
import { Download, Calendar, DollarSign, TrendingUp, BarChart3, Fuel } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { 
  getVehicles, 
  getTrips, 
  getFuelLogs, 
  getExpenses 
} from '../utils/storage';
import { PageHeader, DataTable } from '../components/ERPComponents';

interface VehicleReport {
  id: string;
  registrationNumber: string;
  type: string;
  totalDistance: number;
  totalFuel: number;
  fuelEfficiency: number; // km/L
  fuelCost: number;
  maintenanceCost: number;
  otherCost: number;
  totalCost: number;
  totalRevenue: number;
  roi: number; // percentage
  acquisitionCost: number;
}

export default function Reports() {
  const [selectedVehicleType, setSelectedVehicleType] = useState('all');

  // Load data dynamically
  const vehicles = getVehicles();
  const trips = getTrips();
  const fuelLogs = getFuelLogs();
  const expenses = getExpenses();

  // Aggregate metrics
  const reportsData: VehicleReport[] = vehicles.map(vehicle => {
    // 1. Total Distance from Completed Trips
    const vehicleTrips = trips.filter(t => t.vehicleId === vehicle.id && t.status === 'Completed');
    const totalDistance = vehicleTrips.reduce((acc, curr) => acc + curr.plannedDistance, 0);
    const totalRevenue = vehicleTrips.reduce((acc, curr) => acc + curr.revenue, 0);

    // 2. Total Fuel Consumed and Cost
    const vehicleFuelLogs = fuelLogs.filter(f => f.vehicleId === vehicle.id);
    const totalFuel = vehicleFuelLogs.reduce((acc, curr) => acc + curr.liters, 0);
    const fuelCost = vehicleFuelLogs.reduce((acc, curr) => acc + curr.cost, 0);

    // 3. Fuel Efficiency (km/L)
    const fuelEfficiency = totalFuel > 0 ? parseFloat((totalDistance / totalFuel).toFixed(2)) : 0;

    // 4. Maintenance and Other Expenses
    const vehicleExpenses = expenses.filter(e => e.vehicleId === vehicle.id);
    const maintenanceCost = vehicleExpenses.filter(e => e.type === 'Maintenance').reduce((acc, curr) => acc + curr.amount, 0);
    const otherCost = vehicleExpenses.filter(e => e.type !== 'Maintenance').reduce((acc, curr) => acc + curr.amount, 0);

    // 5. Total Operational Cost = Fuel + Maintenance + Other
    const totalCost = fuelCost + maintenanceCost + otherCost;

    // 6. Vehicle ROI = (Revenue - Operational Cost) / Acquisition Cost
    const netEarnings = totalRevenue - totalCost;
    const roi = vehicle.acquisitionCost > 0 
      ? parseFloat(((netEarnings / vehicle.acquisitionCost) * 100).toFixed(1)) 
      : 0;

    return {
      id: vehicle.id,
      registrationNumber: vehicle.registrationNumber,
      type: vehicle.type,
      totalDistance,
      totalFuel,
      fuelEfficiency,
      fuelCost,
      maintenanceCost,
      otherCost,
      totalCost,
      totalRevenue,
      roi,
      acquisitionCost: vehicle.acquisitionCost,
    };
  });

  // Filter
  const filteredReports = reportsData.filter(r => 
    selectedVehicleType === 'all' || r.type.toLowerCase() === selectedVehicleType.toLowerCase()
  );

  // Summary Card calculations
  const fleetTotalRevenue = filteredReports.reduce((acc, curr) => acc + curr.totalRevenue, 0);
  const fleetTotalCost = filteredReports.reduce((acc, curr) => acc + curr.totalCost, 0);
  const fleetNetIncome = fleetTotalRevenue - fleetTotalCost;
  const averageFuelEfficiency = filteredReports.filter(r => r.fuelEfficiency > 0).length > 0
    ? (filteredReports.reduce((acc, curr) => acc + curr.fuelEfficiency, 0) / filteredReports.filter(r => r.fuelEfficiency > 0).length).toFixed(1)
    : '0.0';

  // Chart data
  const chartCostData = filteredReports.map(r => ({
    name: r.registrationNumber,
    Fuel: r.fuelCost,
    Maintenance: r.maintenanceCost,
    Other: r.otherCost,
    Total: r.totalCost,
  }));

  const chartRoiData = filteredReports.map(r => ({
    name: r.registrationNumber,
    ROI: r.roi,
  }));

  // CSV Export Trigger
  const handleExportCSV = () => {
    const headers = [
      'Vehicle ID',
      'Registration Number',
      'Vehicle Type',
      'Acquisition Cost ($)',
      'Total Distance Run (km)',
      'Total Fuel Vol (L)',
      'Fuel Efficiency (km/L)',
      'Fuel Cost ($)',
      'Maintenance Cost ($)',
      'Other Expenses ($)',
      'Total Operational Cost ($)',
      'Completed Trips Revenue ($)',
      'ROI (%)'
    ];

    const rows = filteredReports.map(r => [
      r.id,
      r.registrationNumber,
      r.type,
      r.acquisitionCost,
      r.totalDistance,
      r.totalFuel,
      r.fuelEfficiency,
      r.fuelCost,
      r.maintenanceCost,
      r.otherCost,
      r.totalCost,
      r.totalRevenue,
      r.roi
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `TransitOps_ERP_Fleet_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tableHeaders = [
    { key: 'id', label: 'Vehicle ID', sortable: false },
    { key: 'reg', label: 'Reg Number', sortable: false },
    { key: 'acq', label: 'Acq Cost', sortable: false },
    { key: 'dist', label: 'Distance Run', sortable: false },
    { key: 'fuel', label: 'Fuel Vol', sortable: false },
    { key: 'eff', label: 'Fuel Efficiency', sortable: false },
    { key: 'cost', label: 'Operating Cost', sortable: false },
    { key: 'revenue', label: 'Trip Revenue', sortable: false },
    { key: 'roi', label: 'ROI (%)', sortable: false }
  ];

  return (
    <div style={styles.container}>
      <PageHeader 
        title="Fleet Reports & ROI Analytics"
        description="Audit cumulative operational cost matrices, journey fuel ratios, and asset ROI yields."
        breadcrumbs={[{ label: 'TransitOps ERP', link: '/' }, { label: 'Reports', active: true }]}
        actions={
          <button className="btn btn-primary" onClick={handleExportCSV}>
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        }
      />

      {/* Select Filter and Date range info */}
      <div className="card" style={styles.filterCard}>
        <div style={styles.dateSelector}>
          <Calendar size={14} style={{ color: '#9ca3af' }} />
          <span style={styles.dateText}>Reporting Period: July 2026</span>
        </div>
        <select 
          className="form-input" 
          value={selectedVehicleType}
          onChange={(e) => setSelectedVehicleType(e.target.value)}
          style={styles.select}
        >
          <option value="all">All Vehicle Types</option>
          <option value="van">Vans</option>
          <option value="box truck">Box Trucks</option>
          <option value="semi-truck">Semi-Trucks</option>
          <option value="flatbed">Flatbeds</option>
        </select>
      </div>

      {/* Summary Metrics */}
      <div style={styles.metricsGrid}>
        {/* Total Cost */}
        <div className="card" style={styles.metricCard}>
          <div style={styles.metricRow}>
            <div>
              <span style={styles.metricLabel}>Fleet Total Cost</span>
              <span style={{ ...styles.metricValue, color: '#ef4444' }}>${fleetTotalCost.toLocaleString()}</span>
            </div>
            <div style={styles.iconBox}>
              <DollarSign size={16} style={{ color: '#ef4444' }} />
            </div>
          </div>
          <span style={styles.metricFooter}>Total Fuel + Maintenance logs</span>
        </div>

        {/* Total Revenue */}
        <div className="card" style={styles.metricCard}>
          <div style={styles.metricRow}>
            <div>
              <span style={styles.metricLabel}>Fleet Gross Revenue</span>
              <span style={{ ...styles.metricValue, color: '#10b981' }}>${fleetTotalRevenue.toLocaleString()}</span>
            </div>
            <div style={styles.iconBox}>
              <TrendingUp size={16} style={{ color: '#10b981' }} />
            </div>
          </div>
          <span style={styles.metricFooter}>Total Completed trip revenues</span>
        </div>

        {/* Net Income */}
        <div className="card" style={styles.metricCard}>
          <div style={styles.metricRow}>
            <div>
              <span style={styles.metricLabel}>Net Fleet Income</span>
              <span style={{ ...styles.metricValue, color: fleetNetIncome >= 0 ? '#7c3aed' : '#ef4444' }}>
                {fleetNetIncome < 0 ? '-' : ''}${Math.abs(fleetNetIncome).toLocaleString()}
              </span>
            </div>
            <div style={styles.iconBox}>
              <BarChart3 size={16} style={{ color: '#7c3aed' }} />
            </div>
          </div>
          <span style={styles.metricFooter}>Net operating margins</span>
        </div>

        {/* Average Fuel Efficiency */}
        <div className="card" style={styles.metricCard}>
          <div style={styles.metricRow}>
            <div>
              <span style={styles.metricLabel}>Avg Fuel Efficiency</span>
              <span style={{ ...styles.metricValue, color: '#f59e0b' }}>{averageFuelEfficiency} km/L</span>
            </div>
            <div style={styles.iconBox}>
              <Fuel size={16} style={{ color: '#f59e0b' }} />
            </div>
          </div>
          <span style={styles.metricFooter}>Odometer / Liters ratio</span>
        </div>
      </div>

      {/* Visual Analytics Comparison Charts */}
      <div style={styles.chartsGrid}>
        {/* Cost comparison chart */}
        <div className="card" style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Operational Costs Per Vehicle ($)</h3>
          <div style={{ height: '220px', marginTop: '0.5rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartCostData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={9} axisLine={false} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={9} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0b0b0b', 
                    border: '1px solid #262626',
                    borderRadius: '4px',
                    fontSize: '10px',
                    color: '#ffffff',
                    fontFamily: 'var(--font-body)'
                  }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
                />
                <Legend wrapperStyle={{ fontSize: '9px', fontFamily: 'var(--font-body)', marginTop: '6px' }} />
                <Bar dataKey="Fuel" stackId="a" fill="#3b82f6" />
                <Bar dataKey="Maintenance" stackId="a" fill="#f59e0b" />
                <Bar dataKey="Other" stackId="a" fill="#7c3aed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ROI comparison chart */}
        <div className="card" style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Vehicle ROI Analytics (%)</h3>
          <div style={{ height: '220px', marginTop: '0.5rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartRoiData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={9} axisLine={false} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={9} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0b0b0b', 
                    border: '1px solid #262626',
                    borderRadius: '4px',
                    fontSize: '10px',
                    color: '#ffffff',
                    fontFamily: 'var(--font-body)'
                  }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
                />
                <Bar dataKey="ROI" fill="#7c3aed">
                  {chartRoiData.map((entry, index) => {
                    const color = entry.ROI >= 0 ? '#7c3aed' : '#ef4444';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed ROI table */}
      <DataTable 
        headers={tableHeaders}
        data={filteredReports}
        renderRow={(rep) => (
          <>
            <td style={styles.idTd}>{rep.id}</td>
            <td style={styles.regTd}>{rep.registrationNumber}</td>
            <td style={styles.td}>${rep.acquisitionCost.toLocaleString()}</td>
            <td style={styles.td}>{rep.totalDistance.toLocaleString()} km</td>
            <td style={styles.td}>{rep.totalFuel.toLocaleString()} L</td>
            <td style={styles.td}>{rep.fuelEfficiency > 0 ? `${rep.fuelEfficiency} km/L` : '-'}</td>
            <td style={{ ...styles.td, fontWeight: 700, color: '#ef4444' }}>
              ${rep.totalCost.toLocaleString()}
            </td>
            <td style={{ ...styles.td, fontWeight: 700, color: '#10b981' }}>
              ${rep.totalRevenue.toLocaleString()}
            </td>
            <td style={{ 
              ...styles.td, 
              fontWeight: 700, 
              color: rep.roi >= 0 ? '#10b981' : '#ef4444' 
            }}>
              {rep.roi >= 0 ? '+' : ''}{rep.roi}%
            </td>
          </>
        )}
      />
    </div>
  );
}

const styles = {
  container: {
    padding: '0.25rem',
  },
  filterCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    marginBottom: '1rem',
    flexWrap: 'wrap' as const,
    gap: '0.75rem',
  },
  dateSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  },
  dateText: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    fontWeight: 600,
  },
  select: {
    width: '180px',
    padding: '0.375rem 0.5rem',
    fontSize: '0.75rem',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '0.75rem',
    marginBottom: '1.25rem',
  },
  metricCard: {
    padding: '1rem 1.125rem',
  },
  metricRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: '#9ca3af',
    display: 'block',
    marginBottom: '2px',
  },
  metricValue: {
    fontSize: '1.5rem',
    fontWeight: 750,
    letterSpacing: '-0.02em',
  },
  iconBox: {
    width: '32px',
    height: '32px',
    borderRadius: '2px',
    backgroundColor: '#111111',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #262626',
  },
  metricFooter: {
    fontSize: '0.6875rem',
    color: '#9ca3af',
    marginTop: '0.5rem',
    display: 'block',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: '1.1fr 1fr',
    gap: '1.25rem',
    marginBottom: '1.25rem',
    alignItems: 'start',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  } as React.CSSProperties,
  chartCard: {
    padding: '1.125rem',
  },
  chartTitle: {
    fontSize: '0.8125rem',
    fontWeight: 700,
    color: '#9ca3af',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  idTd: {
    padding: '0.6875rem 1rem',
    color: '#7c3aed',
    fontWeight: 700,
  },
  regTd: {
    padding: '0.6875rem 1rem',
    fontWeight: 700,
    color: '#ffffff',
  },
  td: {
    padding: '0.6875rem 1rem',
    color: '#ffffff',
  },
};
