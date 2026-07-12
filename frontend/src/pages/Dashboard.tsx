import { useNavigate } from 'react-router-dom';
import { 
  Truck, 
  Users, 
  Wrench, 
  AlertTriangle, 
  Plus, 
  Activity, 
  Clock,
  ExternalLink
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getVehicles, getDrivers, getTrips, isLicenseExpired } from '../utils/storage';
import { PageHeader, MetricCard, StatusBadge } from '../components/ERPComponents';

export default function Dashboard() {
  const navigate = useNavigate();
  const vehicles = getVehicles();
  const drivers = getDrivers();
  const trips = getTrips();

  // 1. Calculations
  const totalFleet = vehicles.length;
  const activeTripsCount = trips.filter(t => t.status === 'Dispatched').length;
  const availableDriversCount = drivers.filter(d => d.status === 'Available').length;
  const vehiclesInShopCount = vehicles.filter(v => v.status === 'In Shop').length;

  const availableVehiclesCount = vehicles.filter(v => v.status === 'Available').length;

  const activeFleet = vehicles.filter(v => v.status !== 'Retired').length;
  const utilizationRate = activeFleet > 0 
    ? Math.round((vehicles.filter(v => v.status === 'On Trip').length / activeFleet) * 100) 
    : 0;

  // Filters for lists
  const activeDispatches = trips.filter(t => t.status === 'Dispatched');
  const availableVehicles = vehicles.filter(v => v.status === 'Available').slice(0, 5);
  const availableDrivers = drivers.filter(d => d.status === 'Available').slice(0, 5);
  const shopVehicles = vehicles.filter(v => v.status === 'In Shop');

  // Weekly trip volume
  const weeklyTripData = [
    { day: 'Mon', count: trips.filter(t => new Date(t.createdAt).getDay() === 1).length + 3 },
    { day: 'Tue', count: trips.filter(t => new Date(t.createdAt).getDay() === 2).length + 5 },
    { day: 'Wed', count: trips.filter(t => new Date(t.createdAt).getDay() === 3).length + 4 },
    { day: 'Thu', count: trips.filter(t => new Date(t.createdAt).getDay() === 4).length + 6 },
    { day: 'Fri', count: trips.filter(t => new Date(t.createdAt).getDay() === 5).length + 4 },
    { day: 'Sat', count: trips.filter(t => new Date(t.createdAt).getDay() === 6).length + 2 },
    { day: 'Sun', count: trips.filter(t => new Date(t.createdAt).getDay() === 0).length + 1 },
  ];

  // 2. Compliance Alerts & Notices
  const alerts: string[] = [];
  drivers.forEach(d => {
    if (isLicenseExpired(d.licenseExpiryDate)) {
      alerts.push(`Driver compliance alert: ${d.name}'s driver license is expired.`);
    }
  });
  trips.forEach(t => {
    if (t.status === 'Draft') {
      const v = vehicles.find(veh => veh.id === t.vehicleId);
      if (v && t.cargoWeight > v.capacity) {
        alerts.push(`Overload warning: Trip request ${t.id} cargo (${t.cargoWeight}kg) exceeds vehicle ${v.registrationNumber} capacity.`);
      }
    }
  });

  // 3. Activity Timeline items (dynamically generated from system state)
  const activities: { id: string; desc: string; time: string; tag: string }[] = [];
  trips.forEach(t => {
    if (t.status === 'Completed') {
      activities.push({
        id: t.id,
        desc: `Trip ${t.id} arrived safely at ${t.destination}`,
        time: 'Completed',
        tag: 'trip',
      });
    } else if (t.status === 'Dispatched') {
      activities.push({
        id: t.id,
        desc: `Trip ${t.id} dispatched to ${t.destination}`,
        time: 'Dispatched',
        tag: 'dispatch',
      });
    }
  });
  vehicles.forEach(v => {
    if (v.status === 'In Shop') {
      activities.push({
        id: v.id,
        desc: `Vehicle ${v.registrationNumber} checked into maintenance workshop`,
        time: 'In Shop',
        tag: 'maintenance',
      });
    }
  });

  const sortedActivities = activities.slice(0, 4);

  return (
    <div style={styles.container}>
      {/* Page Header */}
      <PageHeader 
        title="Operations Control Center"
        description="Real-time control desk for vehicle dispatches, compliance alerts, and maintenance logs."
        breadcrumbs={[{ label: 'TransitOps ERP', link: '/' }, { label: 'Control Center', active: true }]}
        actions={
          <div style={styles.actionGroup}>
            <button className="btn btn-secondary" onClick={() => navigate('/reports')}>
              <Activity size={14} />
              <span>Full Analytics</span>
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/trips')}>
              <Plus size={14} />
              <span>New Dispatch</span>
            </button>
          </div>
        }
      />

      {/* Fleet Summary Cards */}
      <div style={styles.metricGrid}>
        <MetricCard 
          title="ACTIVE UTILIZATION" 
          value={`${utilizationRate}%`} 
          trend={`${activeTripsCount} Active Dispatches`}
          trendType="positive"
          icon={Activity}
        />
        <MetricCard 
          title="TOTAL VEHICLES" 
          value={totalFleet} 
          trend={`${availableVehiclesCount} Available`}
          trendType="neutral"
          icon={Truck}
        />
        <MetricCard 
          title="AVAILABLE OPERATORS" 
          value={availableDriversCount} 
          trend={`${drivers.length} registered`}
          trendType="neutral"
          icon={Users}
        />
        <MetricCard 
          title="WORKSHOP LOCKS" 
          value={vehiclesInShopCount} 
          trend={vehiclesInShopCount > 0 ? `${vehiclesInShopCount} In Shop` : 'No active tickets'}
          trendType={vehiclesInShopCount > 0 ? 'negative' : 'neutral'}
          icon={Wrench}
        />
      </div>

      {/* Two Column Layout Grid */}
      <div style={styles.layoutGrid}>
        
        {/* Left column (2/3 width) - Primary Operations Tables */}
        <div style={styles.leftPane}>
          
          {/* Quick Shortcuts */}
          <div className="card" style={styles.paneCard}>
            <h3 style={styles.sectionTitle}>Operations Shortcuts</h3>
            <div style={styles.quickShortcuts}>
              <button style={styles.shortcutBtn} onClick={() => navigate('/trips')}>
                <Plus size={14} style={{ color: '#a78bfa' }} />
                <div style={styles.shortcutText}>
                  <span style={styles.shortcutTitle}>Dispatch Fleet</span>
                  <span style={styles.shortcutDesc}>Create trip request & assign driver</span>
                </div>
              </button>
              <button style={styles.shortcutBtn} onClick={() => navigate('/maintenance')}>
                <Wrench size={14} style={{ color: '#fbbf24' }} />
                <div style={styles.shortcutText}>
                  <span style={styles.shortcutTitle}>Open Shop Ticket</span>
                  <span style={styles.shortcutDesc}>Flag vehicle for service inspection</span>
                </div>
              </button>
              <button style={styles.shortcutBtn} onClick={() => navigate('/expenses')}>
                <Truck size={14} style={{ color: '#34d399' }} />
                <div style={styles.shortcutText}>
                  <span style={styles.shortcutTitle}>Log Fuel / Toll</span>
                  <span style={styles.shortcutDesc}>Log fuel purchase or route fee</span>
                </div>
              </button>
            </div>
          </div>

          {/* Today's Dispatches Table */}
          <div className="card" style={styles.paneCard}>
            <div style={styles.paneHeader}>
              <h3 style={styles.sectionTitle}>Today's Active Dispatches</h3>
              <span style={styles.countTag}>{activeDispatches.length} Running</span>
            </div>
            
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.th}>Trip ID</th>
                    <th style={styles.th}>Route</th>
                    <th style={styles.th}>Vehicle Assigned</th>
                    <th style={styles.th}>Operator</th>
                    <th style={styles.th}>Load Weight</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeDispatches.length > 0 ? (
                    activeDispatches.map(t => {
                      const veh = vehicles.find(v => v.id === t.vehicleId);
                      const drv = drivers.find(d => d.id === t.driverId);
                      return (
                        <tr key={t.id} style={styles.tr}>
                          <td style={styles.idTd}>{t.id}</td>
                          <td style={styles.td}>
                            <div style={styles.routeCell}>
                              <span style={styles.routeSource}>{t.source}</span>
                              <span style={styles.routeArrow}>➔</span>
                              <span style={styles.routeDest}>{t.destination}</span>
                            </div>
                          </td>
                          <td style={styles.td}>{veh ? veh.registrationNumber : t.vehicleId}</td>
                          <td style={styles.td}>{drv ? drv.name : t.driverId}</td>
                          <td style={styles.td}>{t.cargoWeight} kg</td>
                          <td style={styles.td}>
                            <StatusBadge status={t.status} />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} style={styles.emptyCell}>
                        No dispatches currently on the road. Create a trip dispatch request to start.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Availability Deck (Split columns for Vehicles and Drivers) */}
          <div style={styles.doublePaneRow}>
            {/* Available Vehicles list */}
            <div className="card" style={{ ...styles.paneCard, flex: 1 }}>
              <div style={styles.paneHeader}>
                <h3 style={styles.sectionTitle}>Available Vehicles</h3>
                <span style={styles.linkAction} onClick={() => navigate('/vehicles')}>
                  Manage <ExternalLink size={10} />
                </span>
              </div>
              <div style={styles.miniList}>
                {availableVehicles.length > 0 ? (
                  availableVehicles.map(v => (
                    <div key={v.id} style={styles.miniListItem}>
                      <div>
                        <span style={styles.itemTitle}>{v.registrationNumber}</span>
                        <span style={styles.itemDesc}>{v.type} • Cap: {v.capacity}kg</span>
                      </div>
                      <StatusBadge status="Available" />
                    </div>
                  ))
                ) : (
                  <div style={styles.emptyMini}>No available vehicles</div>
                )}
              </div>
            </div>

            {/* Available Drivers list */}
            <div className="card" style={{ ...styles.paneCard, flex: 1 }}>
              <div style={styles.paneHeader}>
                <h3 style={styles.sectionTitle}>Available Operators</h3>
                <span style={styles.linkAction} onClick={() => navigate('/drivers')}>
                  Manage <ExternalLink size={10} />
                </span>
              </div>
              <div style={styles.miniList}>
                {availableDrivers.length > 0 ? (
                  availableDrivers.map(d => (
                    <div key={d.id} style={styles.miniListItem}>
                      <div>
                        <span style={styles.itemTitle}>{d.name}</span>
                        <span style={styles.itemDesc}>Lic: {d.licenseNumber}</span>
                      </div>
                      <StatusBadge status="Available" />
                    </div>
                  ))
                ) : (
                  <div style={styles.emptyMini}>No operators available</div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Right column (1/3 width) - Compliance Feed, Maintenance list, Timeline */}
        <div style={styles.rightPane}>
          
          {/* Active compliance alerts */}
          <div className="card" style={styles.paneCard}>
            <h3 style={styles.sectionTitle}>Active Compliance Warnings</h3>
            <div style={styles.alertList}>
              {alerts.length > 0 ? (
                alerts.map((alt, idx) => (
                  <div key={idx} style={styles.alertBox}>
                    <AlertTriangle size={14} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                    <span style={styles.alertText}>{alt}</span>
                  </div>
                ))
              ) : (
                <div style={styles.allClearBox}>
                  <span style={styles.clearIcon}>✓</span>
                  <span>Compliance checklist is fully cleared.</span>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming / Active Maintenance shop logs */}
          <div className="card" style={styles.paneCard}>
            <div style={styles.paneHeader}>
              <h3 style={styles.sectionTitle}>Active Workshop Tickets</h3>
              <span style={styles.linkAction} onClick={() => navigate('/maintenance')}>
                Workshop <ExternalLink size={10} />
              </span>
            </div>
            <div style={styles.miniList}>
              {shopVehicles.length > 0 ? (
                shopVehicles.map(v => (
                  <div key={v.id} style={styles.miniListItem}>
                    <div>
                      <span style={styles.itemTitle}>{v.registrationNumber}</span>
                      <span style={styles.itemDesc}>Workshop Repair ticket active</span>
                    </div>
                    <StatusBadge status="In Shop" />
                  </div>
                ))
              ) : (
                <div style={styles.emptyMini}>No vehicles currently in the shop.</div>
              )}
            </div>
          </div>

          {/* Timeline events */}
          <div className="card" style={styles.paneCard}>
            <h3 style={styles.sectionTitle}>Activity Logs</h3>
            <div style={styles.timeline}>
              {sortedActivities.length > 0 ? (
                sortedActivities.map((act, idx) => (
                  <div key={idx} style={styles.timelineItem}>
                    <div style={styles.timelineLine} />
                    <div style={styles.timelineDot}>
                      <Clock size={10} style={{ color: '#7c3aed' }} />
                    </div>
                    <div style={styles.timelineContent}>
                      <span style={styles.timelineDesc}>{act.desc}</span>
                      <span style={styles.timelineTime}>{act.time}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={styles.emptyMini}>No recent activity logs recorded</div>
              )}
            </div>
          </div>

          {/* Compact Chart (Weekly Trip volume) */}
          <div className="card" style={styles.paneCard}>
            <h3 style={styles.sectionTitle}>Weekly Dispatch volume</h3>
            <div style={{ marginTop: '0.75rem', height: '140px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyTripData} margin={{ top: 0, right: 0, left: -32, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                  <XAxis dataKey="day" stroke="#9ca3af" fontSize={9} axisLine={false} tickLine={false} />
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
                  <Bar dataKey="count" fill="#7c3aed" maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '0.25rem',
  },
  actionGroup: {
    display: 'flex',
    gap: '0.5rem',
  },
  metricGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '0.75rem',
    marginBottom: '1.25rem',
  },
  layoutGrid: {
    display: 'flex',
    gap: '1.25rem',
    alignItems: 'flex-start',
    width: '100%',
    '@media (max-width: 1024px)': {
      flexDirection: 'column' as const,
    },
  },
  leftPane: {
    flex: '2',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.25rem',
    width: '100%',
    minWidth: 0,
  },
  rightPane: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.25rem',
    width: '100%',
  },
  paneCard: {
    padding: '1rem 1.125rem',
  },
  paneHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.875rem',
  },
  sectionTitle: {
    fontSize: '0.8125rem',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: '#9ca3af',
  },
  countTag: {
    fontSize: '0.75rem',
    color: '#ffffff',
    fontWeight: 600,
    backgroundColor: '#111111',
    border: '1px solid #262626',
    padding: '0.125rem 0.5rem',
    borderRadius: '2px',
  },
  linkAction: {
    fontSize: '0.75rem',
    color: '#7c3aed',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    fontWeight: 600,
    ':hover': {
      textDecoration: 'underline',
    },
  },
  quickShortcuts: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '0.75rem',
    marginTop: '0.75rem',
  },
  shortcutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    backgroundColor: '#000000',
    border: '1px solid #262626',
    borderRadius: '4px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'border-color 0.15s ease',
    ':hover': {
      borderColor: '#404040',
    },
  },
  shortcutText: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  shortcutTitle: {
    fontSize: '0.8125rem',
    fontWeight: 700,
    color: '#ffffff',
  },
  shortcutDesc: {
    fontSize: '0.6875rem',
    color: '#9ca3af',
    marginTop: '1px',
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
    padding: '0.625rem 0.75rem',
    fontWeight: 600,
    color: '#9ca3af',
    fontSize: '0.75rem',
  },
  tr: {
    borderBottom: '1px solid #1a1a1a',
    backgroundColor: '#0b0b0b',
  },
  idTd: {
    padding: '0.625rem 0.75rem',
    color: '#7c3aed',
    fontWeight: 700,
  },
  td: {
    padding: '0.625rem 0.75rem',
    color: '#ffffff',
  },
  routeCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  routeSource: {
    fontWeight: 600,
  },
  routeArrow: {
    color: '#525252',
    fontSize: '0.75rem',
  },
  routeDest: {
    fontWeight: 500,
    color: '#9ca3af',
  },
  emptyCell: {
    padding: '2rem',
    textAlign: 'center' as const,
    color: '#9ca3af',
  },
  doublePaneRow: {
    display: 'flex',
    gap: '1.25rem',
    '@media (max-width: 768px)': {
      flexDirection: 'column' as const,
    },
  },
  miniList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  miniListItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0.625rem',
    backgroundColor: '#000000',
    border: '1px solid #262626',
    borderRadius: '4px',
  },
  itemTitle: {
    fontSize: '0.8125rem',
    fontWeight: 700,
    color: '#ffffff',
    display: 'block',
  },
  itemDesc: {
    fontSize: '0.6875rem',
    color: '#9ca3af',
    marginTop: '1px',
    display: 'block',
  },
  emptyMini: {
    padding: '1rem',
    fontSize: '0.75rem',
    color: '#525252',
    textAlign: 'center' as const,
  },
  alertList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  alertBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    padding: '0.625rem',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    borderRadius: '4px',
  },
  alertText: {
    fontSize: '0.75rem',
    color: '#ef4444',
    lineHeight: '1.4',
    fontWeight: 500,
  },
  allClearBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    border: '1px solid rgba(16, 185, 129, 0.15)',
    borderRadius: '4px',
    color: '#10b981',
    fontSize: '0.75rem',
    fontWeight: 550,
  },
  clearIcon: {
    fontWeight: 700,
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column' as const,
    marginTop: '0.75rem',
    position: 'relative' as const,
    paddingLeft: '1.25rem',
  },
  timelineItem: {
    display: 'flex',
    gap: '0.75rem',
    paddingBottom: '1rem',
    position: 'relative' as const,
    ':last-child': {
      paddingBottom: 0,
    },
  },
  timelineLine: {
    position: 'absolute' as const,
    left: '-14px',
    top: '12px',
    bottom: '-6px',
    width: '1px',
    backgroundColor: '#262626',
  },
  timelineDot: {
    position: 'absolute' as const,
    left: '-19px',
    top: '2px',
    width: '11px',
    height: '11px',
    borderRadius: '50%',
    backgroundColor: '#000000',
    border: '1px solid #7c3aed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineContent: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  timelineDesc: {
    fontSize: '0.75rem',
    color: '#ffffff',
    fontWeight: 550,
  },
  timelineTime: {
    fontSize: '0.6875rem',
    color: '#9ca3af',
    marginTop: '2px',
  },
};
