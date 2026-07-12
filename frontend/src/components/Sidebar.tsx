import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Navigation, 
  Wrench, 
  Receipt, 
  BarChart3, 
  LogOut 
} from 'lucide-react';

interface SidebarProps {
  userRole?: string;
  onLogout?: () => void;
}

export default function Sidebar({ userRole = 'FleetManager', onLogout }: SidebarProps) {
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['FleetManager', 'Driver', 'SafetyOfficer', 'FinancialAnalyst'] },
    { name: 'Vehicles', path: '/vehicles', icon: Truck, roles: ['FleetManager', 'Driver', 'SafetyOfficer', 'FinancialAnalyst'] },
    { name: 'Drivers', path: '/drivers', icon: Users, roles: ['FleetManager', 'Driver', 'SafetyOfficer', 'FinancialAnalyst'] },
    { name: 'Trips', path: '/trips', icon: Navigation, roles: ['FleetManager', 'Driver', 'SafetyOfficer', 'FinancialAnalyst'] },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench, roles: ['FleetManager', 'Driver', 'SafetyOfficer', 'FinancialAnalyst'] },
    { name: 'Fuel Logs', path: '/expenses', icon: Receipt, roles: ['FleetManager', 'Driver', 'SafetyOfficer', 'FinancialAnalyst'] },
    { name: 'Reports', path: '/reports', icon: BarChart3, roles: ['FleetManager', 'Driver', 'SafetyOfficer', 'FinancialAnalyst'] },
  ];

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      navigate('/login');
    }
  };

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logoContainer}>
        <span style={styles.logoIcon}>🚚</span>
        <h1 style={styles.logoText}>TransitOps</h1>
      </div>
      
      <div style={styles.userSection}>
        <div style={styles.avatar}>
          {userRole.charAt(0).toUpperCase()}
        </div>
        <div style={styles.userInfo}>
          <div style={styles.userName}>Operator Account</div>
          <div style={styles.userRoleTag}>{userRole.replace(/([A-Z])/g, ' $1').trim()}</div>
        </div>
      </div>

      <nav style={styles.nav}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              ...styles.navLink,
              ...(isActive ? styles.navLinkActive : {}),
            })}
          >
            <item.icon size={16} />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <button onClick={handleLogout} style={styles.logoutBtn}>
        <LogOut size={16} />
        <span>Logout Session</span>
      </button>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: '240px',
    backgroundColor: '#0b0b0b',
    borderRight: '1px solid #262626',
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    position: 'sticky' as const,
    top: 0,
    padding: '1.25rem 1rem',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    marginBottom: '1.75rem',
    paddingLeft: '0.5rem',
  },
  logoIcon: {
    fontSize: '1.375rem',
  },
  logoText: {
    fontSize: '1.125rem',
    fontWeight: 700,
    color: '#ffffff',
    letterSpacing: '-0.02em',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    padding: '0.625rem',
    backgroundColor: '#111111',
    border: '1px solid #262626',
    borderRadius: '4px',
    marginBottom: '1.5rem',
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '2px',
    backgroundColor: '#262626',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.75rem',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  userName: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#ffffff',
  },
  userRoleTag: {
    fontSize: '0.6875rem',
    color: '#9ca3af',
    marginTop: '1px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
    flex: 1,
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '2px',
    color: '#9ca3af',
    textDecoration: 'none',
    fontSize: '0.8125rem',
    fontWeight: 500,
    borderLeft: '3px solid transparent',
    transition: 'all 0.15s ease',
  },
  navLinkActive: {
    backgroundColor: '#111111',
    color: '#ffffff',
    fontWeight: 600,
    borderLeftColor: '#7c3aed',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '2px',
    color: '#ef4444',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '0.8125rem',
    fontWeight: 600,
    marginTop: 'auto',
    width: '100%',
    textAlign: 'left' as const,
    transition: 'background-color 0.15s ease',
  },
};
