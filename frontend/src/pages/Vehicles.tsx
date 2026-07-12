import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { 
  Vehicle, 
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
import api from '../../api/api';

const mapVehicleFromBackend = (v: any): Vehicle => ({
  id: `VEH-${v.vehicle_id}`,
  registrationNumber: v.registration_no,
  type: v.vehicle_type,
  capacity: Number(v.max_capacity),
  odometer: Number(v.odometer),
  status: v.status,
  acquisitionCost: Number(v.acquisition_cost),
  driver: v.driver_id ? `DRV-${v.driver_id}` : 'None',
  region: 'North'
});

const mapDriverFromBackend = (d: any): Driver => ({
  id: `DRV-${d.driver_id}`,
  name: d.full_name,
  licenseNumber: d.license_number,
  licenseCategory: d.license_category,
  licenseExpiryDate: d.license_expiry,
  contactNumber: d.contact_number,
  status: d.status,
  assignedVehicle: d.assigned_vehicle_id ? `VEH-${d.assigned_vehicle_id}` : 'None',
  safetyScore: Number(d.safety_score)
});

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      const [vehiclesRes, driversRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/drivers')
      ]);
      setVehicles(vehiclesRes.data.map(mapVehicleFromBackend));
      setDrivers(driversRes.data.map(mapDriverFromBackend));
    } catch (err) {
      showToast('Failed to load fleet registry from database', 'error');
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modals & Toast
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Form Fields
  const [regNumber, setRegNumber] = useState('');
  const [type, setType] = useState('Van');
  const [capacity, setCapacity] = useState('');
  const [odometer, setOdometer] = useState('');
  const [status, setStatus] = useState<'Available' | 'On Trip' | 'In Shop' | 'Retired'>('Available');
  const [acquisitionCost, setAcquisitionCost] = useState('');
  const [assignedDriverId, setAssignedDriverId] = useState('');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter & Search Logic
  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || v.type.toLowerCase() === filterType.toLowerCase();
    const matchesStatus = filterStatus === 'all' || v.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filteredVehicles.length / pageSize);
  const paginatedVehicles = filteredVehicles.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const newToast = { id: Date.now().toString(), text, type };
    setToast(newToast);
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenAdd = () => {
    setRegNumber('');
    setType('Van');
    setCapacity('');
    setOdometer('');
    setStatus('Available');
    setAcquisitionCost('');
    setAssignedDriverId('');
    setFormErrors({});
    setModalMode('add');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (v: Vehicle) => {
    setSelectedVehicle(v);
    setRegNumber(v.registrationNumber);
    setType(v.type);
    setCapacity(v.capacity.toString());
    setOdometer(v.odometer.toString());
    setStatus(v.status);
    setAcquisitionCost(v.acquisitionCost.toString());
    setAssignedDriverId(v.driver === 'None' ? '' : v.driver);
    setFormErrors({});
    setModalMode('edit');
    setIsFormOpen(true);
  };

  const handleOpenView = (v: Vehicle) => {
    setSelectedVehicle(v);
    setModalMode('view');
    setIsFormOpen(true);
  };

  const handleOpenDelete = (v: Vehicle) => {
    setVehicleToDelete(v);
    setIsConfirmOpen(true);
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    const errors: Record<string, string> = {};
    if (!regNumber.trim()) errors.regNumber = 'Registration number is required';
    if (!capacity || Number(capacity) <= 0) errors.capacity = 'Capacity must be greater than 0';
    if (!odometer || Number(odometer) < 0) errors.odometer = 'Odometer cannot be negative';
    if (!acquisitionCost || Number(acquisitionCost) <= 0) errors.cost = 'Acquisition cost must be positive';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      vehicle_name: `${type} (${regNumber.toUpperCase()})`,
      registration_no: regNumber.toUpperCase(),
      vehicle_type: type,
      max_capacity: Number(capacity),
      odometer: Number(odometer),
      acquisition_cost: Number(acquisitionCost),
      status: status,
      driver_id: assignedDriverId ? Number(assignedDriverId.replace('DRV-', '')) : null
    };

    try {
      if (modalMode === 'add') {
        await api.post('/vehicles', payload);
        showToast(`Vehicle ${regNumber.toUpperCase()} registered successfully`);
      } else if (modalMode === 'edit' && selectedVehicle) {
        const numericId = Number(selectedVehicle.id.replace('VEH-', ''));
        await api.put(`/vehicles/${numericId}`, payload);
        showToast(`Vehicle ${regNumber.toUpperCase()} profile updated`);
      }
      setIsFormOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Failed to save vehicle', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!vehicleToDelete) return;
    try {
      const numericId = Number(vehicleToDelete.id.replace('VEH-', ''));
      await api.delete(`/vehicles/${numericId}`);
      showToast(`Vehicle ${vehicleToDelete.registrationNumber} removed from registry`, 'error');
      setIsConfirmOpen(false);
      setVehicleToDelete(null);
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Failed to delete vehicle', 'error');
    }
  };

  // Headers for DataTable
  const tableHeaders = [
    { key: 'id', label: 'ID', sortable: false },
    { key: 'reg', label: 'Registration Number', sortable: false },
    { key: 'type', label: 'Type', sortable: false },
    { key: 'capacity', label: 'Capacity', sortable: false },
    { key: 'odometer', label: 'Odometer', sortable: false },
    { key: 'driver', label: 'Assigned Driver', sortable: false },
    { key: 'status', label: 'Status', sortable: false },
    { key: 'actions', label: '', sortable: false }
  ];

  return (
    <div style={styles.container}>
      <PageHeader 
        title="Fleet Vehicles Registry"
        description="Monitor vehicle configurations, odometer metrics, and driver assignments."
        breadcrumbs={[{ label: 'TransitOps ERP', link: '/' }, { label: 'Vehicles', active: true }]}
        actions={
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={14} />
            <span>Add Vehicle</span>
          </button>
        }
      />

      {/* Search & Filters */}
      <div className="card" style={styles.searchBarCard}>
        <SearchBar 
          placeholder="Search vehicles by ID, type, or registration..."
          value={searchTerm}
          onChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
          onFilterToggle={() => setIsFilterOpen(true)}
          isFilterActive={filterType !== 'all' || filterStatus !== 'all'}
        />
      </div>

      {/* Main Vehicles Table */}
      <DataTable 
        headers={tableHeaders}
        data={paginatedVehicles}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onRowClick={handleOpenView}
        renderRow={(veh) => {
          const matchedDriver = drivers.find(d => d.id === veh.driver);
          return (
            <>
              <td style={styles.idTd}>{veh.id}</td>
              <td style={styles.regTd}>{veh.registrationNumber}</td>
              <td style={styles.td}>{veh.type}</td>
              <td style={styles.td}>{veh.capacity.toLocaleString()} kg</td>
              <td style={styles.td}>{veh.odometer.toLocaleString()} km</td>
              <td style={styles.td}>{matchedDriver ? matchedDriver.name : <span style={{ color: '#525252' }}>Unassigned</span>}</td>
              <td style={styles.td}>
                <StatusBadge status={veh.status} />
              </td>
              <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                <ActionDropdown 
                  actions={[
                    { label: 'View Profile', onClick: () => handleOpenView(veh) },
                    { label: 'Edit Configuration', onClick: () => handleOpenEdit(veh) },
                    { label: 'Delete Record', onClick: () => handleOpenDelete(veh), danger: true }
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
        title="Filter Vehicles"
        onClear={() => {
          setFilterType('all');
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
          <label className="form-label">Vehicle Type</label>
          <select 
            className="form-input" 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="Van">Van</option>
            <option value="Box Truck">Box Truck</option>
            <option value="Semi-Truck">Semi-Truck</option>
            <option value="Flatbed">Flatbed</option>
          </select>
        </div>

        <div style={styles.drawerField}>
          <label className="form-label">Current Status</label>
          <select 
            className="form-input" 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="In Shop">In Shop</option>
            <option value="Retired">Retired</option>
          </select>
        </div>
      </FilterDrawer>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Confirm Vehicle Removal"
        message={`Are you sure you want to remove vehicle ${vehicleToDelete?.registrationNumber} from the registry? This operation is permanent and cannot be undone.`}
        confirmLabel="Delete Vehicle"
      />

      {/* Toast notifications */}
      <Toast message={toast} onClose={() => setToast(null)} />

      {/* Form / Detail Modal */}
      {isFormOpen && (
        <div style={styles.modalOverlay}>
          <div className="card" style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {modalMode === 'add' && 'Register New Fleet Vehicle'}
                {modalMode === 'edit' && `Edit Vehicle ${selectedVehicle?.id}`}
                {modalMode === 'view' && `Vehicle Profile Details - ${selectedVehicle?.id}`}
              </h3>
              <button style={styles.closeBtn} onClick={() => setIsFormOpen(false)}>
                <X size={16} />
              </button>
            </div>

            {modalMode === 'view' && selectedVehicle && (
              <div style={styles.viewGrid}>
                <div style={styles.viewRow}>
                  <div>
                    <span style={styles.viewLabel}>Registration Number</span>
                    <span style={styles.viewVal}>{selectedVehicle.registrationNumber}</span>
                  </div>
                  <div>
                    <span style={styles.viewLabel}>Asset Type</span>
                    <span style={styles.viewVal}>{selectedVehicle.type}</span>
                  </div>
                </div>
                <div style={styles.viewRow}>
                  <div>
                    <span style={styles.viewLabel}>Max Load Capacity</span>
                    <span style={styles.viewVal}>{selectedVehicle.capacity.toLocaleString()} kg</span>
                  </div>
                  <div>
                    <span style={styles.viewLabel}>Current Odometer</span>
                    <span style={styles.viewVal}>{selectedVehicle.odometer.toLocaleString()} km</span>
                  </div>
                </div>
                <div style={styles.viewRow}>
                  <div>
                    <span style={styles.viewLabel}>Acquisition Cost</span>
                    <span style={styles.viewVal}>₹{selectedVehicle.acquisitionCost.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span style={styles.viewLabel}>Assigned Operator</span>
                    <span style={styles.viewVal}>
                      {drivers.find(d => d.id === selectedVehicle.driver)?.name || 'None Assigned'}
                    </span>
                  </div>
                </div>
                <div style={styles.viewRow}>
                  <div>
                    <span style={styles.viewLabel}>Status</span>
                    <div style={{ marginTop: '4px' }}>
                      <StatusBadge status={selectedVehicle.status} />
                    </div>
                  </div>
                </div>
                <div style={styles.modalFooter}>
                  <button className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
                    Close Profile
                  </button>
                  <button className="btn btn-primary" onClick={() => handleOpenEdit(selectedVehicle)}>
                    Edit Profile
                  </button>
                </div>
              </div>
            )}

            {(modalMode === 'add' || modalMode === 'edit') && (
              <form onSubmit={handleSaveVehicle}>
                <div style={styles.formRow}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Registration Number</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. GJ-01-AB-4521"
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                    />
                    {formErrors.regNumber && <span style={styles.errorText}>{formErrors.regNumber}</span>}
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Vehicle Type</label>
                    <select 
                      className="form-input"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                    >
                      <option value="Van">Van</option>
                      <option value="Box Truck">Box Truck</option>
                      <option value="Semi-Truck">Semi-Truck</option>
                      <option value="Flatbed">Flatbed</option>
                    </select>
                  </div>
                </div>

                <div style={styles.formRow}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Load Capacity (kg)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="e.g. 5000"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                    />
                    {formErrors.capacity && <span style={styles.errorText}>{formErrors.capacity}</span>}
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Initial Odometer (km)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="e.g. 15000"
                      value={odometer}
                      onChange={(e) => setOdometer(e.target.value)}
                    />
                    {formErrors.odometer && <span style={styles.errorText}>{formErrors.odometer}</span>}
                  </div>
                </div>

                <div style={styles.formRow}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Acquisition Cost (₹)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="e.g. 1800000"
                      value={acquisitionCost}
                      onChange={(e) => setAcquisitionCost(e.target.value)}
                    />
                    {formErrors.cost && <span style={styles.errorText}>{formErrors.cost}</span>}
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Assign Driver</label>
                    <select 
                      className="form-input"
                      value={assignedDriverId}
                      onChange={(e) => setAssignedDriverId(e.target.value)}
                    >
                      <option value="">-- No Driver Assigned --</option>
                      {drivers.filter(d => d.status === 'Available').map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.id})</option>
                      ))}
                    </select>
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
                    <option value="In Shop">In Shop</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>

                <div style={styles.modalFooter}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Record Vehicle
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
    maxWidth: '520px',
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
