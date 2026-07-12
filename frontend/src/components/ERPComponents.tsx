import React, { useState } from 'react';
import { Search, ChevronDown, Filter, X, AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

// ----------------------------------------------------
// 1. BREADCRUMB
// ----------------------------------------------------
export interface BreadcrumbItem {
  label: string;
  link?: string;
  active?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav style={erpStyles.breadcrumb}>
      {items.map((item, index) => (
        <span key={index} style={erpStyles.breadcrumbSpan}>
          <span style={item.active ? erpStyles.breadcrumbActive : erpStyles.breadcrumbInactive}>
            {item.label}
          </span>
          {index < items.length - 1 && <span style={erpStyles.breadcrumbSeparator}>/</span>}
        </span>
      ))}
    </nav>
  );
}

// ----------------------------------------------------
// 2. PAGE HEADER
// ----------------------------------------------------
interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div style={erpStyles.pageHeader}>
      <div>
        {breadcrumbs && <Breadcrumb items={breadcrumbs} />}
        <h2 style={erpStyles.pageHeaderTitle}>{title}</h2>
        {description && <p style={erpStyles.pageHeaderDescription}>{description}</p>}
      </div>
      {actions && <div style={erpStyles.pageHeaderActions}>{actions}</div>}
    </div>
  );
}

// ----------------------------------------------------
// 3. STATUS BADGE
// ----------------------------------------------------
interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getBadgeStyle = (val: string) => {
    const norm = val.toLowerCase();
    
    // Green Statuses
    if (norm === 'available' || norm === 'completed' || norm === 'active') {
      return {
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        color: '#10b981',
        border: '1px solid rgba(16, 185, 129, 0.2)'
      };
    }
    
    // Orange/Amber Statuses
    if (norm === 'in shop' || norm === 'draft' || norm === 'off duty' || norm === 'pending') {
      return {
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        color: '#f59e0b',
        border: '1px solid rgba(245, 158, 11, 0.2)'
      };
    }
    
    // Blue Statuses
    if (norm === 'on trip' || norm === 'dispatched' || norm === 'driving') {
      return {
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        color: '#3b82f6',
        border: '1px solid rgba(59, 130, 246, 0.2)'
      };
    }
    
    // Red Statuses (Suspended/Retired/Cancelled)
    return {
      backgroundColor: 'rgba(239, 68, 68, 0.08)',
      color: '#ef4444',
      border: '1px solid rgba(239, 68, 68, 0.2)'
    };
  };

  return (
    <span style={{ ...erpStyles.statusBadge, ...getBadgeStyle(status) }}>
      {status}
    </span>
  );
}

// ----------------------------------------------------
// 4. METRIC CARD
// ----------------------------------------------------
interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ComponentType<any>;
}

export function MetricCard({ title, value, trend, trendType = 'neutral', icon: Icon }: MetricCardProps) {
  const getTrendStyle = (type: string) => {
    if (type === 'positive') return { color: '#10b981' };
    if (type === 'negative') return { color: '#ef4444' };
    return { color: '#9ca3af' };
  };

  return (
    <div style={erpStyles.metricCard}>
      <div style={erpStyles.metricHeader}>
        <span style={erpStyles.metricTitle}>{title}</span>
        {Icon && <Icon size={14} style={{ color: '#525252' }} />}
      </div>
      <div style={erpStyles.metricBody}>
        <span style={erpStyles.metricValue}>{value}</span>
        {trend && (
          <span style={{ ...erpStyles.metricTrend, ...getTrendStyle(trendType) }}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 5. SEARCH BAR
// ----------------------------------------------------
interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  onFilterToggle?: () => void;
  isFilterActive?: boolean;
}

export function SearchBar({ placeholder = 'Search...', value, onChange, onFilterToggle, isFilterActive }: SearchBarProps) {
  return (
    <div style={erpStyles.searchBarContainer}>
      <div style={erpStyles.searchField}>
        <Search size={14} style={erpStyles.searchIcon} />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={erpStyles.searchInput}
        />
        {value && (
          <button onClick={() => onChange('')} style={erpStyles.searchClearBtn}>
            <X size={12} />
          </button>
        )}
      </div>
      {onFilterToggle && (
        <button 
          onClick={onFilterToggle} 
          style={{
            ...erpStyles.searchFilterBtn,
            backgroundColor: isFilterActive ? '#1a1a1a' : 'transparent',
            borderColor: isFilterActive ? '#7c3aed' : '#262626'
          }}
        >
          <Filter size={14} style={{ color: isFilterActive ? '#a78bfa' : '#9ca3af' }} />
          <span style={{ color: isFilterActive ? '#ffffff' : '#9ca3af' }}>Filters</span>
        </button>
      )}
    </div>
  );
}

// ----------------------------------------------------
// 6. FILTER DRAWER
// ----------------------------------------------------
interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  onClear?: () => void;
  onApply?: () => void;
}

export function FilterDrawer({ isOpen, onClose, title = 'Filters', children, onClear, onApply }: FilterDrawerProps) {
  if (!isOpen) return null;

  return (
    <div style={erpStyles.drawerOverlay}>
      <div style={erpStyles.drawerCard}>
        <div style={erpStyles.drawerHeader}>
          <h4 style={erpStyles.drawerTitle}>{title}</h4>
          <button onClick={onClose} style={erpStyles.drawerCloseBtn}>
            <X size={16} />
          </button>
        </div>
        <div style={erpStyles.drawerBody}>
          {children}
        </div>
        <div style={erpStyles.drawerFooter}>
          {onClear && (
            <button onClick={onClear} style={erpStyles.btnSecondary}>
              Reset Filters
            </button>
          )}
          {onApply && (
            <button onClick={onApply} style={erpStyles.btnPrimary}>
              Apply Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 7. EMPTY STATE
// ----------------------------------------------------
interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ComponentType<any>;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, icon: Icon, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div style={erpStyles.emptyStateContainer}>
      <div style={erpStyles.emptyStateIconBox}>
        {Icon ? <Icon size={24} style={{ color: '#525252' }} /> : <AlertCircle size={24} style={{ color: '#525252' }} />}
      </div>
      <h3 style={erpStyles.emptyStateTitle}>{title}</h3>
      <p style={erpStyles.emptyStateDescription}>{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} style={erpStyles.btnPrimary}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ----------------------------------------------------
// 8. DATA TABLE
// ----------------------------------------------------
interface DataTableHeader {
  key: string;
  label: string;
  sortable?: boolean;
}

interface DataTableProps {
  headers: DataTableHeader[];
  data: any[];
  renderRow: (row: any, index: number) => React.ReactNode;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  // Pagination
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: any) => void;
}

export function DataTable({ 
  headers, 
  data, 
  renderRow, 
  sortKey, 
  sortDirection = 'asc', 
  onSort, 
  currentPage = 1, 
  totalPages = 1, 
  onPageChange,
  onRowClick
}: DataTableProps) {
  return (
    <div style={erpStyles.tableContainer}>
      <div style={erpStyles.tableWrapper}>
        <table style={erpStyles.table}>
          <thead>
            <tr style={erpStyles.tableThRow}>
              {headers.map((h) => (
                <th 
                  key={h.key} 
                  style={{ 
                    ...erpStyles.tableTh, 
                    cursor: h.sortable && onSort ? 'pointer' : 'default' 
                  }}
                  onClick={() => h.sortable && onSort && onSort(h.key)}
                >
                  <div style={erpStyles.thCell}>
                    <span>{h.label}</span>
                    {h.sortable && sortKey === h.key && (
                      <span style={erpStyles.sortIndicator}>
                        {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, idx) => (
                <tr 
                  key={idx} 
                  style={erpStyles.tableTr}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {renderRow(row, idx)}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length} style={{ padding: 0 }}>
                  <EmptyState 
                    title="No records found" 
                    description="Try adjusting your filters or search keywords." 
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controller */}
      {totalPages > 1 && onPageChange && (
        <div style={erpStyles.pagination}>
          <span style={erpStyles.paginationLabel}>
            Page {currentPage} of {totalPages}
          </span>
          <div style={erpStyles.paginationActions}>
            <button 
              onClick={() => onPageChange(currentPage - 1)} 
              disabled={currentPage <= 1}
              style={currentPage <= 1 ? erpStyles.btnPaginateDisabled : erpStyles.btnPaginate}
            >
              Previous
            </button>
            <button 
              onClick={() => onPageChange(currentPage + 1)} 
              disabled={currentPage >= totalPages}
              style={currentPage >= totalPages ? erpStyles.btnPaginateDisabled : erpStyles.btnPaginate}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// 9. CONFIRMATION MODAL
// ----------------------------------------------------
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmLabel = 'Confirm Action', 
  cancelLabel = 'Cancel' 
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div style={erpStyles.modalOverlay}>
      <div style={erpStyles.modalCard}>
        <div style={erpStyles.modalHeader}>
          <div style={erpStyles.modalTitleRow}>
            <AlertTriangle size={18} style={{ color: '#ef4444' }} />
            <h4 style={erpStyles.modalTitle}>{title}</h4>
          </div>
          <button onClick={onClose} style={erpStyles.modalCloseBtn}>
            <X size={16} />
          </button>
        </div>
        <p style={erpStyles.modalBody}>{message}</p>
        <div style={erpStyles.modalFooter}>
          <button onClick={onClose} style={erpStyles.btnSecondary}>
            {cancelLabel}
          </button>
          <button onClick={onConfirm} style={erpStyles.btnDanger}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 10. TOAST NOTIFICATION
// ----------------------------------------------------
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastProps {
  message: ToastMessage | null;
  onClose: () => void;
}

export function Toast({ message, onClose }: ToastProps) {
  if (!message) return null;

  const getToastIcon = (type: string) => {
    if (type === 'success') return <CheckCircle2 size={16} style={{ color: '#10b981' }} />;
    if (type === 'error') return <AlertCircle size={16} style={{ color: '#ef4444' }} />;
    return <Info size={16} style={{ color: '#3b82f6' }} />;
  };

  return (
    <div style={erpStyles.toastContainer}>
      <div style={erpStyles.toast}>
        {getToastIcon(message.type)}
        <span style={erpStyles.toastText}>{message.text}</span>
        <button onClick={onClose} style={erpStyles.toastCloseBtn}>
          <X size={12} />
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// ACTION DROPDOWN FOR TABLES
// ----------------------------------------------------
interface ActionDropdownProps {
  actions: { label: string; onClick: () => void; danger?: boolean }[];
}

export function ActionDropdown({ actions }: ActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        style={erpStyles.actionDropdownToggle}
      >
        <span>Actions</span>
        <ChevronDown size={12} />
      </button>
      {isOpen && (
        <>
          <div 
            style={erpStyles.actionDropdownBackdrop} 
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} 
          />
          <div style={erpStyles.actionDropdownMenu}>
            {actions.map((act, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  act.onClick();
                }}
                style={{
                  ...erpStyles.actionDropdownItem,
                  color: act.danger ? '#ef4444' : '#ffffff',
                }}
              >
                {act.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ----------------------------------------------------
// 11. SHARED STYLING FOR COMPONENT MODULES
// ----------------------------------------------------
const erpStyles = {
  // Breadcrumb
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontSize: '0.75rem',
    fontFamily: 'var(--font-body)',
    marginBottom: '0.375rem',
  },
  breadcrumbSpan: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
  },
  breadcrumbActive: {
    color: '#9ca3af',
    fontWeight: 500,
  },
  breadcrumbInactive: {
    color: '#525252',
    textDecoration: 'none',
  },
  breadcrumbSeparator: {
    color: '#262626',
    fontWeight: 400,
  },
  // Page Header
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: '1.25rem',
    borderBottom: '1px solid #262626',
    marginBottom: '1.5rem',
    flexWrap: 'wrap' as const,
    gap: '1rem',
  },
  pageHeaderTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#ffffff',
    letterSpacing: '-0.02em',
  },
  pageHeaderDescription: {
    fontSize: '0.8125rem',
    color: '#9ca3af',
    marginTop: '0.125rem',
  },
  pageHeaderActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  // Status Badge
  statusBadge: {
    padding: '0.125rem 0.5rem',
    borderRadius: '100px',
    fontSize: '0.71875rem',
    fontWeight: 600,
    display: 'inline-block',
    whiteSpace: 'nowrap' as const,
  },
  // Metric Card
  metricCard: {
    backgroundColor: '#0b0b0b',
    border: '1px solid #262626',
    padding: '1rem 1.125rem',
    borderRadius: '4px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
  },
  metricHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricTitle: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    color: '#9ca3af',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  metricBody: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: '0.125rem',
  },
  metricValue: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#ffffff',
    letterSpacing: '-0.02em',
  },
  metricTrend: {
    fontSize: '0.71875rem',
    fontWeight: 600,
  },
  // Search bar
  searchBarContainer: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    width: '100%',
  },
  searchField: {
    position: 'relative' as const,
    flex: 1,
  },
  searchIcon: {
    position: 'absolute' as const,
    left: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
  },
  searchInput: {
    width: '100%',
    padding: '0.5rem 2rem 0.5rem 2rem',
    borderRadius: '4px',
    border: '1px solid #262626',
    backgroundColor: '#000000',
    color: '#ffffff',
    fontSize: '0.8125rem',
    fontFamily: 'var(--font-body)',
  },
  searchClearBtn: {
    position: 'absolute' as const,
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
  },
  searchFilterBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.5rem 0.875rem',
    borderRadius: '4px',
    border: '1px solid #262626',
    cursor: 'pointer',
    fontSize: '0.8125rem',
    fontWeight: 550,
  },
  // DataTable
  tableContainer: {
    border: '1px solid #262626',
    backgroundColor: '#0b0b0b',
    borderRadius: '4px',
    overflow: 'hidden',
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
  tableThRow: {
    borderBottom: '1px solid #262626',
    backgroundColor: '#111111',
  },
  tableTh: {
    padding: '0.6875rem 1rem',
    fontWeight: 600,
    color: '#9ca3af',
    fontSize: '0.75rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  thCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  sortIndicator: {
    color: '#7c3aed',
    fontWeight: 700,
  },
  tableTr: {
    borderBottom: '1px solid #1a1a1a',
    backgroundColor: '#0b0b0b',
    cursor: 'pointer',
    transition: 'background-color 0.1s ease',
    ':hover': {
      backgroundColor: '#111111',
    },
  },
  // Pagination
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.625rem 1rem',
    borderTop: '1px solid #262626',
    backgroundColor: '#111111',
  },
  paginationLabel: {
    fontSize: '0.75rem',
    color: '#9ca3af',
  },
  paginationActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  btnPaginate: {
    padding: '0.375rem 0.75rem',
    fontSize: '0.75rem',
    borderRadius: '4px',
    border: '1px solid #262626',
    backgroundColor: '#0b0b0b',
    color: '#ffffff',
    cursor: 'pointer',
    fontWeight: 600,
  },
  btnPaginateDisabled: {
    padding: '0.375rem 0.75rem',
    fontSize: '0.75rem',
    borderRadius: '4px',
    border: '1px solid #1a1a1a',
    backgroundColor: '#050505',
    color: '#525252',
    cursor: 'not-allowed',
    fontWeight: 600,
  },
  // Overlays & Modals & Drawers
  drawerOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1050,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  drawerCard: {
    width: '100%',
    maxWidth: '380px',
    backgroundColor: '#0b0b0b',
    borderLeft: '1px solid #262626',
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  drawerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.25rem',
    borderBottom: '1px solid #262626',
    backgroundColor: '#111111',
  },
  drawerTitle: {
    fontSize: '0.9375rem',
    fontWeight: 700,
    color: '#ffffff',
  },
  drawerCloseBtn: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
  },
  drawerBody: {
    padding: '1.25rem',
    flex: 1,
    overflowY: 'auto' as const,
  },
  drawerFooter: {
    padding: '1rem 1.25rem',
    borderTop: '1px solid #262626',
    display: 'flex',
    gap: '0.5rem',
    backgroundColor: '#111111',
  },
  // Modal dialog
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  modalCard: {
    width: '100%',
    maxWidth: '420px',
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
    marginBottom: '0.875rem',
  },
  modalTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  modalTitle: {
    fontSize: '0.9375rem',
    fontWeight: 700,
    color: '#ffffff',
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
  },
  modalBody: {
    fontSize: '0.8125rem',
    color: '#9ca3af',
    lineHeight: '1.4',
    marginBottom: '1.25rem',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.5rem',
    borderTop: '1px solid #262626',
    paddingTop: '0.75rem',
  },
  // Button styles
  btnPrimary: {
    backgroundColor: '#7c3aed',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    padding: '0.5rem 1rem',
    fontSize: '0.8125rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnSecondary: {
    backgroundColor: '#111111',
    color: '#ffffff',
    border: '1px solid #262626',
    borderRadius: '4px',
    padding: '0.5rem 1rem',
    fontSize: '0.8125rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnDanger: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    padding: '0.5rem 1rem',
    fontSize: '0.8125rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  // Empty state
  emptyStateContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1.5rem',
    textAlign: 'center' as const,
  },
  emptyStateIconBox: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#111111',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.75rem',
    border: '1px solid #262626',
  },
  emptyStateTitle: {
    fontSize: '0.875rem',
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: '0.25rem',
  },
  emptyStateDescription: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    maxWidth: '280px',
    marginBottom: '1rem',
    lineHeight: '1.4',
  },
  // Action Dropdown
  actionDropdownToggle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.375rem 0.625rem',
    borderRadius: '4px',
    border: '1px solid #262626',
    backgroundColor: '#111111',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  actionDropdownBackdrop: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 90,
  },
  actionDropdownMenu: {
    position: 'absolute' as const,
    right: 0,
    marginTop: '4px',
    width: '140px',
    backgroundColor: '#0b0b0b',
    border: '1px solid #262626',
    borderRadius: '4px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '4px 0',
  },
  actionDropdownItem: {
    padding: '0.5rem 0.75rem',
    fontSize: '0.75rem',
    background: 'none',
    border: 'none',
    textAlign: 'left' as const,
    cursor: 'pointer',
    width: '100%',
    fontWeight: 550,
  },
  // Toast styles
  toastContainer: {
    position: 'fixed' as const,
    bottom: '1.5rem',
    right: '1.5rem',
    zIndex: 2000,
    animation: 'slideIn 0.2s ease',
  },
  toast: {
    backgroundColor: '#0b0b0b',
    border: '1px solid #262626',
    padding: '0.75rem 1rem',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
  },
  toastText: {
    fontSize: '0.78125rem',
    color: '#ffffff',
    fontWeight: 550,
  },
  toastCloseBtn: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
};
