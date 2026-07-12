import React, { useState } from 'react';
import { Plus, X, AlertTriangle } from 'lucide-react';
import { 
  getDrivers, 
  setDrivers as saveDrivers, 
  isLicenseExpired,
  Driver 
} from '../utils/storage';
import { 
  PageHeader, 
  DataTable, 
  StatusBadge, 
  SearchBar, 
  FilterDrawer, 
  ConfirmationModal, 
  Toast, 
  ToastMessage,
  ActionDropdown 
} from '../components/ERPComponents';

export default function Drivers() {
  const [drivers, setDrivers] = useState<Driver[]>(() => getDrivers());

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  // Modals & Toast
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);

  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'Available' | 'On Trip' | 'Off Duty' | 'Suspended'>('Available');
  const [safetyScore, setSafetyScore] = useState('');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter & Search Logic
  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredDrivers.length / pageSize);
  const paginatedDrivers = filteredDrivers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const newToast = { id: Date.now().toString(), text, type };
    setToast(newToast);
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenAdd = () => {
    setName('');
    setLicenseNumber('');
    setLicenseExpiryDate('');
    setPhone('');
    setStatus('Available');
    setSafetyScore('95');
    setFormErrors({});
    setModalMode('add');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (d: Driver) => {
    setSelectedDriver(d);
    setName(d.name);
    setLicenseNumber(d.licenseNumber);
    setLicenseExpiryDate(d.licenseExpiryDate);
    setPhone(d.contactNumber);
    setStatus(d.status);
    setSafetyScore(d.safetyScore.toString());
    setFormErrors({});
    setModalMode('edit');
    setIsFormOpen(true);
  };

  const handleOpenView = (d: Driver) => {
    setSelectedDriver(d);
    setModalMode('view');
    setIsFormOpen(true);
  };

  const handleOpenDelete = (d: Driver) => {
    setDriverToDelete(d);
    setIsConfirmOpen(true);
  };

  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Driver name is required';
    if (!licenseNumber.trim() || !/^DL-[a-zA-Z0-9]+$/.test(licenseNumber)) {
      errors.license = 'License number must follow "DL-XXXXX" format';
    }
    if (!licenseExpiryDate) errors.expiry = 'Expiry date is required';
    if (!phone.trim()) errors.phone = 'Phone number is required';
    if (!safetyScore || Number(safetyScore) < 0 || Number(safetyScore) > 100) {
      errors.safety = 'Safety score must be between 0 and 100';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (modalMode === 'add') {
      const newDriver: Driver = {
        id: `DRV-${1000 + drivers.length + 1}`,
        name,
        licenseNumber: licenseNumber.toUpperCase(),
        licenseCategory: 'Class A',
        licenseExpiryDate,
        contactNumber: phone,
        status,
        assignedVehicle: 'None',
        safetyScore: Number(safetyScore)
      };

      const updated = [...drivers, newDriver];
      setDrivers(updated);
      saveDrivers(updated);
      showToast(`Driver ${newDriver.name} added to records`);
    } else if (modalMode === 'edit' && selectedDriver) {
      const updated = drivers.map(d => d.id === selectedDriver.id ? {
        ...d,
        name,
        licenseNumber: licenseNumber.toUpperCase(),
        licenseExpiryDate,
        contactNumber: phone,
        status,
        safetyScore: Number(safetyScore)
      } : d);

      setDrivers(updated);
      saveDrivers(updated);
      showToast(`Driver ${name} profile updated`);
    }

    setIsFormOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!driverToDelete) return;
    
    const updated = drivers.filter(d => d.id !== driverToDelete.id);
    setDrivers(updated);
    saveDrivers(updated);
    showToast(`Driver ${driverToDelete.name} deleted from records`, 'error');
    setIsConfirmOpen(false);
    setDriverToDelete(null);
  };

  // Headers for DataTable
  const tableHeaders = [
    { key: 'id', label: 'ID', sortable: false },
    { key: 'name', label: 'Driver Name', sortable: false },
    { key: 'license', label: 'License Number', sortable: false },
    { key: 'expiry', label: 'License Expiry', sortable: false },
    { key: 'phone', label: 'Phone Number', sortable: false },
    { key: 'safety', label: 'Safety Score', sortable: false },
    { key: 'status', label: 'Status', sortable: false },
    { key: 'actions', label: '', sortable: false }
  ];

  return (
    <div style={styles.container}>
      <PageHeader 
        title="Fleet Operators Deck"
        description="Verify driver status, safety metrics, and license compliance requirements."
        breadcrumbs={[{ label: 'TransitOps ERP', link: '/' }, { label: 'Drivers', active: true }]}
        actions={
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={14} />
            <span>Add Operator</span>
          </button>
        }
      />

      {/* Search & Filters */}
      <div className="card" style={styles.searchBarCard}>
        <SearchBar 
          placeholder="Search operators by ID, name, or license number..."
          value={searchTerm}
          onChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
          onFilterToggle={() => setIsFilterOpen(true)}
          isFilterActive={filterStatus !== 'all'}
        />
      </div>

      {/* Main Drivers Table */}
      <DataTable 
        headers={tableHeaders}
        data={paginatedDrivers}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onRowClick={handleOpenView}
        renderRow={(d) => {
          const isExpired = isLicenseExpired(d.licenseExpiryDate);
          return (
            <>
              <td style={styles.idTd}>{d.id}</td>
              <td style={styles.regTd}>{d.name}</td>
              <td style={styles.td}>{d.licenseNumber}</td>
              <td style={styles.td}>
                {isExpired ? (
                  <span style={styles.expiredAlert}>
                    <AlertTriangle size={12} />
                    <span>{d.licenseExpiryDate} (Expired)</span>
                  </span>
                ) : (
                  <span>{d.licenseExpiryDate}</span>
                )}
              </td>
              <td style={styles.td}>{d.contactNumber}</td>
              <td style={{ ...styles.td, fontWeight: 700 }}>{d.safetyScore}/100</td>
              <td style={styles.td}>
                <StatusBadge status={d.status} />
              </td>
              <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                <ActionDropdown 
                  actions={[
                    { label: 'View Profile', onClick: () => handleOpenView(d) },
                    { label: 'Edit Operator details', onClick: () => handleOpenEdit(d) },
                    { label: 'Delete Record', onClick: () => handleOpenDelete(d), danger: true }
                  ]}
                />
              </td>
            </>
          );
        }}
      />

      {/* Filters Drawer */}
      <FilterDrawer 
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filter Drivers"
        onClear={() => {
          setFilterStatus('all');
          setIsFilterOpen(false);
          setCurrentPage(1);
        }}
        onApply={() => {
          setIsFilterOpen(false);
          setCurrentPage(1);
        }}
      >
        <div style={styles.drawerField}>
          <label className="form-label">Duty Status</label>
          <select 
            className="form-input" 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Duty Statuses</option>
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="Off Duty">Off Duty</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </FilterDrawer>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Confirm Operator Removal"
        message={`Are you sure you want to remove driver profile of ${driverToDelete?.name}? Deleted operator profiles cannot be recovered.`}
        confirmLabel="Remove Driver"
      />

      {/* Toast notifications */}
      <Toast message={toast} onClose={() => setToast(null)} />

      {/* Form / Detail Modal */}
      {isFormOpen && (
        <div style={styles.modalOverlay}>
          <div className="card" style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {modalMode === 'add' && 'Add Fleet Operator Profile'}
                {modalMode === 'edit' && `Edit Driver details ${selectedDriver?.id}`}
                {modalMode === 'view' && `Driver Profile - ${selectedDriver?.id}`}
              </h3>
              <button style={styles.closeBtn} onClick={() => setIsFormOpen(false)}>
                <X size={16} />
              </button>
            </div>

            {modalMode === 'view' && selectedDriver && (
              <div style={styles.viewGrid}>
                <div style={styles.viewRow}>
                  <div>
                    <span style={styles.viewLabel}>Driver Name</span>
                    <span style={styles.viewVal}>{selectedDriver.name}</span>
                  </div>
                  <div>
                    <span style={styles.viewLabel}>License Number</span>
                    <span style={styles.viewVal}>{selectedDriver.licenseNumber}</span>
                  </div>
                </div>
                <div style={styles.viewRow}>
                  <div>
                    <span style={styles.viewLabel}>License Expiration</span>
                    <span style={styles.viewVal}>
                      {isLicenseExpired(selectedDriver.licenseExpiryDate) ? (
                        <span style={{ color: '#ef4444' }}>{selectedDriver.licenseExpiryDate} (Expired)</span>
                      ) : (
                        selectedDriver.licenseExpiryDate
                      )}
                    </span>
                  </div>
                  <div>
                    <span style={styles.viewLabel}>Phone Number</span>
                    <span style={styles.viewVal}>{selectedDriver.contactNumber}</span>
                  </div>
                </div>
                <div style={styles.viewRow}>
                  <div>
                    <span style={styles.viewLabel}>Safety Score</span>
                    <span style={styles.viewVal}>{selectedDriver.safetyScore}/100</span>
                  </div>
                  <div>
                    <span style={styles.viewLabel}>Operational Status</span>
                    <div style={{ marginTop: '4px' }}>
                      <StatusBadge status={selectedDriver.status} />
                    </div>
                  </div>
                </div>
                <div style={styles.modalFooter}>
                  <button className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
                    Close
                  </button>
                  <button className="btn btn-primary" onClick={() => handleOpenEdit(selectedDriver)}>
                    Edit details
                  </button>
                </div>
              </div>
            )}

            {(modalMode === 'add' || modalMode === 'edit') && (
              <form onSubmit={handleSaveDriver}>
                <div className="form-group">
                  <label className="form-label">Driver Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Alex Johnson"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  {formErrors.name && <span style={styles.errorText}>{formErrors.name}</span>}
                </div>

                <div style={styles.formRow}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">License Number</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. DL-12345"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                    />
                    {formErrors.license && <span style={styles.errorText}>{formErrors.license}</span>}
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">License Expiry Date</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={licenseExpiryDate}
                      onChange={(e) => setLicenseExpiryDate(e.target.value)}
                    />
                    {formErrors.expiry && <span style={styles.errorText}>{formErrors.expiry}</span>}
                  </div>
                </div>

                <div style={styles.formRow}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Phone Contact</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. 555-0199"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                    {formErrors.phone && <span style={styles.errorText}>{formErrors.phone}</span>}
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Safety Rating (0-100)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="e.g. 95"
                      value={safetyScore}
                      onChange={(e) => setSafetyScore(e.target.value)}
                    />
                    {formErrors.safety && <span style={styles.errorText}>{formErrors.safety}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Operational Status</label>
                  <select 
                    className="form-input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                  >
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="Off Duty">Off Duty</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>

                <div style={styles.modalFooter}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Record Operator
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
  searchBarCard: {
    padding: '0.75rem 1rem',
    marginBottom: '1rem',
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
  drawerField: {
    marginBottom: '1rem',
  },
  expiredAlert: {
    color: '#ef4444',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
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
    maxWidth: '500px',
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
  viewGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.875rem',
  },
  viewRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    borderBottom: '1px solid #1a1a1a',
    paddingBottom: '0.5rem',
  },
  viewLabel: {
    display: 'block',
    fontSize: '0.6875rem',
    color: '#9ca3af',
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  viewVal: {
    fontSize: '0.875rem',
    fontWeight: 700,
    color: '#ffffff',
    marginTop: '2px',
    display: 'block',
  },
};
