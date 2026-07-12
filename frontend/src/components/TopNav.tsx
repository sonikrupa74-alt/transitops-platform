import { Search, Bell, User, Calendar } from 'lucide-react';

interface TopNavProps {
  userRole: string;
}

export default function TopNav({ userRole }: TopNavProps) {
  return (
    <div style={styles.topNav}>
      {/* Global Quick Search */}
      <div style={styles.searchContainer}>
        <Search size={14} style={styles.searchIcon} />
        <input 
          type="text" 
          placeholder="Quick navigation search... (CMD + K)" 
          style={styles.searchInput}
        />
      </div>

      {/* Date, Notifications, Profile */}
      <div style={styles.rightSection}>
        <div style={styles.dateBadge}>
          <Calendar size={13} style={{ color: '#9ca3af' }} />
          <span>July 12, 2026</span>
        </div>

        {/* Mock Notifications Icon */}
        <button style={styles.navButton} title="Notifications">
          <Bell size={16} />
          <span style={styles.pulseDot} />
        </button>

        {/* Profile Menu pill */}
        <div style={styles.profileBadge}>
          <div style={styles.profileIconBox}>
            <User size={12} style={{ color: '#ffffff' }} />
          </div>
          <span style={styles.profileRole}>
            {userRole.replace(/([A-Z])/g, ' $1').trim()}
          </span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  topNav: {
    height: '48px',
    backgroundColor: '#0b0b0b',
    borderBottom: '1px solid #262626',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 1.25rem',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
  },
  searchContainer: {
    position: 'relative' as const,
    width: '280px',
  },
  searchIcon: {
    position: 'absolute' as const,
    left: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#525252',
  },
  searchInput: {
    width: '100%',
    padding: '0.375rem 0.75rem 0.375rem 2rem',
    backgroundColor: '#000000',
    border: '1px solid #262626',
    borderRadius: '4px',
    color: '#ffffff',
    fontSize: '0.75rem',
    fontFamily: 'var(--font-body)',
    outline: 'none',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.875rem',
  },
  dateBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontSize: '0.75rem',
    color: '#9ca3af',
    fontWeight: 500,
  },
  navButton: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    borderRadius: '4px',
    ':hover': {
      color: '#ffffff',
      backgroundColor: '#111111',
    },
  },
  pulseDot: {
    position: 'absolute' as const,
    top: '4px',
    right: '4px',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#7c3aed',
  },
  profileBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.25rem 0.625rem',
    backgroundColor: '#111111',
    border: '1px solid #262626',
    borderRadius: '4px',
  },
  profileIconBox: {
    width: '18px',
    height: '18px',
    borderRadius: '2px',
    backgroundColor: '#262626',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileRole: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#ffffff',
  },
};
