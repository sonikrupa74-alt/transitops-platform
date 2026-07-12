import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { 
  isLicenseExpired,
  formatDateDMY,
  Trip,
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

const mapTripFromBackend = (t: any): Trip => ({
  id: `TRIP-${t.trip_id}`,
  source: t.source,
  destination: t.destination,
  vehicleId: `VEH-${t.vehicle_id}`,
  driverId: `DRV-${t.driver_id}`,
  cargoWeight: Number(t.cargo_weight),
  plannedDistance: Number(t.planned_distance),
  status: t.trip_status === 'Scheduled' ? 'Draft' : t.trip_status,
  revenue: Number(t.revenue || 0),
  finalOdometer: t.final_odometer ? Number(t.final_odometer) : undefined,
  fuelConsumed: t.fuel_consumed ? Number(t.fuel_consumed) : undefined,
  createdAt: t.created_at || new Date().toISOString()
});

export default function Trips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      const [tripsRes, vehiclesRes, driversRes] = await Promise.all([
        api.get('/trips'),
        api.get('/vehicles'),
        api.get('/drivers')
      ]);
      setTrips(tripsRes.data.map(mapTripFromBackend));
      setVehicles(vehiclesRes.data.map(mapVehicleFromBackend));
      setDrivers(driversRes.data.map(mapDriverFromBackend));
    } catch (err) {
      showToast('Failed to load trips dispatch deck from database', 'error');
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  // Modals & Toast
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'complete' | 'view'>('add');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [tripToCancel, setTripToCancel] = useState<Trip | null>(null);

  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Form Fields
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [plannedDistance, setPlannedDistance] = useState('');
  const [revenue, setRevenue] = useState('');

  // Complete Trip Form Fields
  const [finalOdometer, setFinalOdometer] = useState('');
  const [fuelConsumed, setFuelConsumed] = useState('');

  const [warnings, setWarnings] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [cargoType, setCargoType] = useState('General Cargo');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter & Search Logic
  const filteredTrips = trips.filter(t => {
    const v = vehicles.find(veh => veh.id === t.vehicleId);
    const d = drivers.find(drv => drv.id === t.driverId);
    
    const matchesSearch = t.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (v?.registrationNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (d?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredTrips.length / pageSize);
  const paginatedTrips = filteredTrips.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const newToast = { id: Date.now().toString(), text, type };
    setToast(newToast);
    setTimeout(() => setToast(null), 3000);
  };

  // Dynamic Warning Trigger
  const handleSelectAsset = (vehicleId: string, driverId: string, weightStr: string) => {
    const activeWarnings: string[] = [];
    const weight = Number(weightStr) || 0;

    if (vehicleId) {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (vehicle) {
        if (vehicle.status === 'In Shop') {
          activeWarnings.push(`⚠️ Selected vehicle (${vehicle.registrationNumber}) is in maintenance workshop.`);
        }
        if (vehicle.status === 'Retired') {
          activeWarnings.push(`⚠️ Selected vehicle (${vehicle.registrationNumber}) is retired.`);
        }
        if (vehicle.status === 'On Trip') {
          activeWarnings.push(`⚠️ Selected vehicle (${vehicle.registrationNumber}) is already dispatched on a trip.`);
        }
        if (weight > vehicle.capacity) {
          activeWarnings.push(`❌ Cargo overload! Weight (${weight}kg) exceeds vehicle max capacity (${vehicle.capacity}kg).`);
        }
      }
    }

    if (driverId) {
      const driver = drivers.find(d => d.id === driverId);
      if (driver) {
        if (driver.status === 'On Trip') {
          activeWarnings.push(`⚠️ Selected operator (${driver.name}) is currently driving an active trip.`);
        }
        if (driver.status === 'Suspended') {
          activeWarnings.push(`❌ Selected operator (${driver.name}) is Suspended.`);
        }
        if (driver.status === 'Off Duty') {
          activeWarnings.push(`⚠️ Selected operator (${driver.name}) is Off Duty.`);
        }
        if (isLicenseExpired(driver.licenseExpiryDate)) {
          activeWarnings.push(`❌ Selected operator (${driver.name}) has an expired driver license (${driver.licenseExpiryDate}).`);
        }
      }
    }

    setWarnings(activeWarnings);
  };

  const handleOpenAdd = () => {
    setSource('');
    setDestination('');
    setSelectedVehicleId('');
    setSelectedDriverId('');
    setCargoWeight('');
    setCargoType('General Cargo');
    setPlannedDistance('');
    setRevenue('');
    setWarnings([]);
    setFormErrors({});
    setCurrentStep(1);
    setModalMode('add');
    setIsFormOpen(true);
  };

  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    if (!source.trim()) errors.source = 'Origin location is required';
    if (!destination.trim()) errors.destination = 'Destination is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors: Record<string, string> = {};
    if (!selectedVehicleId) {
      errors.vehicle = 'Please select a vehicle';
    } else {
      const vehicle = vehicles.find(v => v.id === selectedVehicleId);
      if (!vehicle) {
        errors.vehicle = 'Selected vehicle does not exist';
      } else if (vehicle.status !== 'Available') {
        errors.vehicle = `Vehicle is currently ${vehicle.status} (must be Available)`;
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = () => {
    const errors: Record<string, string> = {};
    if (!selectedDriverId) {
      errors.driver = 'Please select an operator';
    } else {
      const driver = drivers.find(d => d.id === selectedDriverId);
      if (!driver) {
        errors.driver = 'Selected driver does not exist';
      } else if (driver.status !== 'Available') {
        errors.driver = `Driver is currently ${driver.status} (must be Available)`;
      } else if (isLicenseExpired(driver.licenseExpiryDate)) {
        errors.driver = `Operator license is expired (${driver.licenseExpiryDate})`;
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep4 = () => {
    const errors: Record<string, string> = {};
    if (!cargoWeight || Number(cargoWeight) <= 0) {
      errors.weight = 'Cargo weight must be positive';
    } else {
      const vehicle = vehicles.find(v => v.id === selectedVehicleId);
      if (vehicle && Number(cargoWeight) > vehicle.capacity) {
        errors.weight = `Cargo weight exceeds vehicle capacity of ${vehicle.capacity.toLocaleString()} kg`;
      }
    }

    if (!plannedDistance || Number(plannedDistance) <= 0) {
      errors.distance = 'Planned distance must be positive';
    }
    if (!revenue || Number(revenue) < 0) {
      errors.revenue = 'Revenue cannot be negative';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep1() || !validateStep2() || !validateStep3() || !validateStep4()) {
      showToast('Validation failed. Please review entries.', 'error');
      return;
    }

    const payload = {
      vehicle_id: Number(selectedVehicleId.replace('VEH-', '')),
      driver_id: Number(selectedDriverId.replace('DRV-', '')),
      source,
      destination,
      cargo_weight: Number(cargoWeight),
      planned_distance: Number(plannedDistance),
      revenue: Number(revenue),
      trip_status: 'Draft'
    };

    try {
      await api.post('/trips', payload);
      showToast(`Trip request registered as Draft`);
      setIsFormOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Failed to create trip', 'error');
    }
  };

  const handleDispatchTrip = async (trip: Trip) => {
    const veh = vehicles.find(v => v.id === trip.vehicleId);
    const drv = drivers.find(d => d.id === trip.driverId);

    if (!veh || !drv) return;

    if (veh.status !== 'Available') {
      showToast(`Dispatch blocked: Vehicle is currently ${veh.status}`, 'error');
      return;
    }
    if (drv.status !== 'Available') {
      showToast(`Dispatch blocked: Operator is currently ${drv.status}`, 'error');
      return;
    }
    if (isLicenseExpired(drv.licenseExpiryDate)) {
      showToast('Dispatch blocked: Operator license is expired', 'error');
      return;
    }

    try {
      const numericId = Number(trip.id.replace('TRIP-', ''));
      await api.put(`/trips/${numericId}`, {
        trip_status: 'Dispatched'
      });
      showToast(`Trip ${trip.id} dispatched successfully`);
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Failed to dispatch trip', 'error');
    }
  };

  const handleOpenComplete = (trip: Trip) => {
    setSelectedTrip(trip);
    const veh = vehicles.find(v => v.id === trip.vehicleId);
    setFinalOdometer(veh ? (veh.odometer + trip.plannedDistance).toString() : '');
    setFuelConsumed('');
    setFormErrors({});
    setModalMode('complete');
    setIsFormOpen(true);
  };

  const handleCompleteTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrip) return;

    const veh = vehicles.find(v => v.id === selectedTrip.vehicleId);
    if (!veh) return;

    const errors: Record<string, string> = {};
    const odoVal = Number(finalOdometer);
    const fuelVal = Number(fuelConsumed);

    if (!finalOdometer || odoVal <= 0) {
      errors.odometer = 'Final odometer value is required';
    } else if (odoVal < veh.odometer) {
      errors.odometer = `Odometer must be greater than current (${veh.odometer.toLocaleString()} km)`;
    }

    if (!fuelConsumed || fuelVal <= 0) {
      errors.fuel = 'Fuel volume is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const numericId = Number(selectedTrip.id.replace('TRIP-', ''));
      await api.put(`/trips/${numericId}`, {
        trip_status: 'Completed',
        final_odometer: odoVal,
        fuel_consumed: fuelVal
      });
      showToast(`Trip ${selectedTrip.id} completed. Assets released.`);
      setIsFormOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Failed to complete trip', 'error');
    }
  };

  const handleOpenCancel = (trip: Trip) => {
    setTripToCancel(trip);
    setIsCancelConfirmOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!tripToCancel) return;
    try {
      const numericId = Number(tripToCancel.id.replace('TRIP-', ''));
      await api.put(`/trips/${numericId}`, {
        trip_status: 'Cancelled'
      });
      showToast(`Trip dispatch ${tripToCancel.id} cancelled`, 'error');
      setIsCancelConfirmOpen(false);
      setTripToCancel(null);
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Failed to cancel trip', 'error');
    }
  };

  const handleOpenView = (trip: Trip) => {
    setSelectedTrip(trip);
    setModalMode('view');
    setIsFormOpen(true);
  };

  const tableHeaders = [
    { key: 'id', label: 'ID', sortable: false },
    { key: 'route', label: 'Route', sortable: false },
    { key: 'vehicle', label: 'Vehicle Assigned', sortable: false },
    { key: 'driver', label: 'Operator', sortable: false },
    { key: 'cargo', label: 'Cargo Load', sortable: false },
    { key: 'distance', label: 'Planned Dist', sortable: false },
    { key: 'revenue', label: 'Revenue', sortable: false },
    { key: 'status', label: 'Status', sortable: false },
    { key: 'actions', label: '', sortable: false }
  ];

  return (
    <div style={styles.container}>
      <PageHeader 
        title="Trips Dispatch Desk"
        description="Verify route dispatch workflows, enforce driver compliance, and check transport states."
        breadcrumbs={[{ label: 'TransitOps ERP', link: '/' }, { label: 'Dispatches', active: true }]}
        actions={
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={14} />
            <span>Create Dispatch</span>
          </button>
        }
      />

      {/* Search & Filters */}
      <div className="card" style={styles.searchBarCard}>
        <SearchBar 
          placeholder="Search dispatches by origin, destination, vehicle registration..."
          value={searchTerm}
          onChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
          onFilterToggle={() => setIsFilterOpen(true)}
          isFilterActive={filterStatus !== 'all'}
        />
      </div>

      {/* Main Table */}
      <DataTable 
        headers={tableHeaders}
        data={paginatedTrips}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onRowClick={handleOpenView}
        renderRow={(trip) => {
          const veh = vehicles.find(v => v.id === trip.vehicleId);
          const drv = drivers.find(d => d.id === trip.driverId);
          
          const dropdownActions = [];
          dropdownActions.push({ label: 'View log details', onClick: () => handleOpenView(trip) });
          
          if (trip.status === 'Draft') {
            dropdownActions.push({ label: 'Dispatch Fleet', onClick: () => handleDispatchTrip(trip) });
            dropdownActions.push({ label: 'Cancel Request', onClick: () => handleOpenCancel(trip), danger: true });
          } else if (trip.status === 'Dispatched') {
            dropdownActions.push({ label: 'Record Arrival', onClick: () => handleOpenComplete(trip) });
            dropdownActions.push({ label: 'Cancel Dispatch', onClick: () => handleOpenCancel(trip), danger: true });
          }

          return (
            <>
              <td style={styles.idTd}>{trip.id}</td>
              <td style={styles.td}>
                <div style={styles.routeCell}>
                  <span style={styles.routeSource}>{trip.source}</span>
                  <span style={styles.routeArrow}>➔</span>
                  <span style={styles.routeDest}>{trip.destination}</span>
                </div>
              </td>
              <td style={styles.td}>{veh ? veh.registrationNumber : trip.vehicleId}</td>
              <td style={styles.td}>{drv ? drv.name : trip.driverId}</td>
              <td style={styles.td}>{trip.cargoWeight.toLocaleString('en-IN')} kg</td>
              <td style={styles.td}>{trip.plannedDistance.toLocaleString('en-IN')} km</td>
              <td style={{ ...styles.td, fontWeight: 700 }}>₹{trip.revenue.toLocaleString('en-IN')}</td>
              <td style={styles.td}>
                <StatusBadge status={trip.status} />
              </td>
              <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                <ActionDropdown actions={dropdownActions} />
              </td>
            </>
          );
        }}
      />

      {/* Filter Drawer */}
      <FilterDrawer 
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filter Dispatches"
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
          <label className="form-label">Dispatch Status</label>
          <select 
            className="form-input" 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Dispatches</option>
            <option value="Draft">Draft</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </FilterDrawer>

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal 
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={handleCancelConfirm}
        title="Cancel Fleet Dispatch"
        message={`Are you sure you want to cancel dispatch log ${tripToCancel?.id}? This will revert both the vehicle and operator statuses back to Available.`}
        confirmLabel="Cancel Dispatch"
      />

      {/* Toast notifications */}
      <Toast message={toast} onClose={() => setToast(null)} />

      {/* Form / View details Modal */}
      {isFormOpen && (
        <div style={styles.modalOverlay}>
          <div className="card" style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {modalMode === 'add' && 'Create Fleet Dispatch'}
                {modalMode === 'complete' && `Log Trip Arrival Metrics - ${selectedTrip?.id}`}
                {modalMode === 'view' && `Trip Log Details - ${selectedTrip?.id}`}
              </h3>
              <button style={styles.closeBtn} onClick={() => setIsFormOpen(false)}>
                <X size={16} />
              </button>
            </div>

            {modalMode === 'view' && selectedTrip && (
              <div style={styles.viewGrid}>
                {/* Visual Status Progress Timeline */}
                <div style={styles.timelineContainer}>
                  <div style={{ ...styles.timelineStep, color: '#ffffff' }}>
                    <div style={{ ...styles.timelineDot, backgroundColor: '#7c3aed' }} />
                    <span style={styles.timelineLabel}>Draft</span>
                  </div>
                  <div style={{ 
                    ...styles.timelineLine, 
                    backgroundColor: (selectedTrip.status === 'Dispatched' || selectedTrip.status === 'Completed') ? '#7c3aed' : '#262626' 
                  }} />
                  <div style={{ 
                    ...styles.timelineStep, 
                    color: (selectedTrip.status === 'Dispatched' || selectedTrip.status === 'Completed') ? '#ffffff' : '#525252' 
                  }}>
                    <div style={{ 
                      ...styles.timelineDot, 
                      backgroundColor: (selectedTrip.status === 'Dispatched' || selectedTrip.status === 'Completed') ? '#7c3aed' : '#262626' 
                    }} />
                    <span style={styles.timelineLabel}>Dispatched</span>
                  </div>
                  <div style={{ 
                    ...styles.timelineLine, 
                    backgroundColor: selectedTrip.status === 'Completed' ? '#7c3aed' : '#262626' 
                  }} />
                  <div style={{ 
                    ...styles.timelineStep, 
                    color: selectedTrip.status === 'Completed' ? '#ffffff' : '#525252' 
                  }}>
                    <div style={{ 
                      ...styles.timelineDot, 
                      backgroundColor: selectedTrip.status === 'Completed' ? '#7c3aed' : '#262626' 
                    }} />
                    <span style={styles.timelineLabel}>Completed</span>
                  </div>
                  {selectedTrip.status === 'Cancelled' && (
                    <>
                      <div style={{ ...styles.timelineLine, backgroundColor: '#ef4444' }} />
                      <div style={{ ...styles.timelineStep, color: '#ef4444' }}>
                        <div style={{ ...styles.timelineDot, backgroundColor: '#ef4444' }} />
                        <span style={styles.timelineLabel}>Cancelled</span>
                      </div>
                    </>
                  )}
                </div>

                <div style={styles.viewRow}>
                  <div>
                    <span style={styles.viewLabel}>Route Source</span>
                    <span style={styles.viewVal}>{selectedTrip.source}</span>
                  </div>
                  <div>
                    <span style={styles.viewLabel}>Destination Address</span>
                    <span style={styles.viewVal}>{selectedTrip.destination}</span>
                  </div>
                </div>
                <div style={styles.viewRow}>
                  <div>
                    <span style={styles.viewLabel}>Vehicle Assigned</span>
                    <span style={styles.viewVal}>
                      {vehicles.find(v => v.id === selectedTrip.vehicleId)?.registrationNumber}
                    </span>
                  </div>
                  <div>
                    <span style={styles.viewLabel}>Operator Assigned</span>
                    <span style={styles.viewVal}>
                      {drivers.find(d => d.id === selectedTrip.driverId)?.name}
                    </span>
                  </div>
                </div>
                <div style={styles.viewRow}>
                  <div>
                    <span style={styles.viewLabel}>Cargo Load Weight</span>
                    <span style={styles.viewVal}>{selectedTrip.cargoWeight.toLocaleString()} kg</span>
                  </div>
                  <div>
                    <span style={styles.viewLabel}>Planned Distance</span>
                    <span style={styles.viewVal}>{selectedTrip.plannedDistance.toLocaleString()} km</span>
                  </div>
                </div>
                <div style={styles.viewRow}>
                  <div>
                    <span style={styles.viewLabel}>Trip Cargo Revenue</span>
                    <span style={styles.viewVal}>₹{selectedTrip.revenue.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span style={styles.viewLabel}>Dispatch State</span>
                    <div style={{ marginTop: '4px' }}>
                      <StatusBadge status={selectedTrip.status} />
                    </div>
                  </div>
                </div>
                {selectedTrip.status === 'Completed' && (
                  <div style={styles.viewRow}>
                    <div>
                      <span style={styles.viewLabel}>Arrival Odometer</span>
                      <span style={styles.viewVal}>{selectedTrip.finalOdometer?.toLocaleString()} km</span>
                    </div>
                    <div>
                      <span style={styles.viewLabel}>Fuel Volume Consumed</span>
                      <span style={styles.viewVal}>{selectedTrip.fuelConsumed} Liters</span>
                    </div>
                  </div>
                )}
                <div style={styles.viewRow}>
                  <div>
                    <span style={styles.viewLabel}>Date Created</span>
                    <span style={styles.viewVal}>{formatDateDMY(selectedTrip.createdAt)}</span>
                  </div>
                </div>
                <div style={styles.modalFooter}>
                  <button className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
                    Close Details
                  </button>
                  {selectedTrip.status === 'Draft' && (
                    <button className="btn btn-primary" onClick={() => { setIsFormOpen(false); handleDispatchTrip(selectedTrip); }}>
                      Dispatch Fleet
                    </button>
                  )}
                </div>
              </div>
            )}

            {modalMode === 'complete' && selectedTrip && (
              <form onSubmit={handleCompleteTrip}>
                <p style={styles.formInstructions}>
                  Record final metrics below to complete trip dispatch and release driver/vehicle active states.
                </p>

                <div className="form-group">
                  <label className="form-label">Final Odometer (km)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="e.g. 15665"
                    value={finalOdometer}
                    onChange={(e) => setFinalOdometer(e.target.value)}
                  />
                  {formErrors.odometer && <span style={styles.errorText}>{formErrors.odometer}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Fuel Volume Consumed (Liters)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="e.g. 60"
                    value={fuelConsumed}
                    onChange={(e) => setFuelConsumed(e.target.value)}
                  />
                  {formErrors.fuel && <span style={styles.errorText}>{formErrors.fuel}</span>}
                </div>

                <div style={styles.modalFooter}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Complete Trip
                  </button>
                </div>
              </form>
            )}

            {modalMode === 'add' && (
              <form onSubmit={handleCreateTrip}>
                {/* Step Indicators */}
                <div style={styles.wizardStepsHeader}>
                  <div style={{ ...styles.wizardStepIndicator, color: currentStep >= 1 ? '#ffffff' : '#525252' }}>
                    <span style={{ ...styles.stepNumber, backgroundColor: currentStep >= 1 ? '#7c3aed' : '#262626' }}>1</span>
                    <span>Route</span>
                  </div>
                  <div style={styles.wizardStepLine} />
                  <div style={{ ...styles.wizardStepIndicator, color: currentStep >= 2 ? '#ffffff' : '#525252' }}>
                    <span style={{ ...styles.stepNumber, backgroundColor: currentStep >= 2 ? '#7c3aed' : '#262626' }}>2</span>
                    <span>Vehicle</span>
                  </div>
                  <div style={styles.wizardStepLine} />
                  <div style={{ ...styles.wizardStepIndicator, color: currentStep >= 3 ? '#ffffff' : '#525252' }}>
                    <span style={{ ...styles.stepNumber, backgroundColor: currentStep >= 3 ? '#7c3aed' : '#262626' }}>3</span>
                    <span>Driver</span>
                  </div>
                  <div style={styles.wizardStepLine} />
                  <div style={{ ...styles.wizardStepIndicator, color: currentStep >= 4 ? '#ffffff' : '#525252' }}>
                    <span style={{ ...styles.stepNumber, backgroundColor: currentStep >= 4 ? '#7c3aed' : '#262626' }}>4</span>
                    <span>Cargo</span>
                  </div>
                  <div style={styles.wizardStepLine} />
                  <div style={{ ...styles.wizardStepIndicator, color: currentStep >= 5 ? '#ffffff' : '#525252' }}>
                    <span style={{ ...styles.stepNumber, backgroundColor: currentStep >= 5 ? '#7c3aed' : '#262626' }}>5</span>
                    <span>Review</span>
                  </div>
                </div>

                {/* Step 1 Content: Source and Destination */}
                {currentStep === 1 && (
                  <div style={styles.wizardStepContent}>
                    <h4 style={styles.stepTitle}>Step 1: Select Route</h4>
                    <p style={styles.stepDescription}>Provide the dispatch origin address and target destination coordinates.</p>
                    
                    <div className="form-group">
                      <label className="form-label">Origin Address</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. Ahmedabad, Gujarat"
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                      />
                      {formErrors.source && <span style={styles.errorText}>{formErrors.source}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Destination Address</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. Mumbai, Maharashtra"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                      />
                      {formErrors.destination && <span style={styles.errorText}>{formErrors.destination}</span>}
                    </div>
                  </div>
                )}

                {/* Step 2 Content: Select Vehicle */}
                {currentStep === 2 && (
                  <div style={styles.wizardStepContent}>
                    <h4 style={styles.stepTitle}>Step 2: Assign Vehicle</h4>
                    <p style={styles.stepDescription}>Select from available active fleet assets. In Shop or On Trip vehicles are disabled.</p>
                    {formErrors.vehicle && <span style={styles.errorText}>{formErrors.vehicle}</span>}

                    <div style={styles.selectorScrollBox}>
                      {vehicles.filter(v => v.status === 'Available').map(v => {
                        const isSelected = selectedVehicleId === v.id;
                        const matchedDrv = drivers.find(d => d.id === v.driver);
                        return (
                          <div 
                            key={v.id} 
                            style={{
                              ...styles.selectorItem,
                              cursor: 'pointer',
                              borderColor: isSelected ? '#7c3aed' : '#262626',
                              backgroundColor: isSelected ? '#111111' : '#000000',
                            }}
                            onClick={() => {
                              setSelectedVehicleId(v.id);
                              handleSelectAsset(v.id, selectedDriverId, cargoWeight);
                              setFormErrors({});
                            }}
                          >
                            <div style={styles.selectorItemHeader}>
                              <span style={styles.selectorItemTitle}>{v.registrationNumber} <span style={styles.faint}>({v.type})</span></span>
                              <StatusBadge status={v.status} />
                            </div>
                            <div style={styles.selectorItemDetails}>
                              <span>Max Capacity: {v.capacity.toLocaleString()} kg</span>
                              <span>• Odometer: {v.odometer.toLocaleString()} km</span>
                              <span>• Assigned: {matchedDrv ? matchedDrv.name : 'None'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 3 Content: Select Driver */}
                {currentStep === 3 && (
                  <div style={styles.wizardStepContent}>
                    <h4 style={styles.stepTitle}>Step 3: Assign Operator</h4>
                    <p style={styles.stepDescription}>Only available drivers with unexpired operating licenses are shown.</p>
                    {formErrors.driver && <span style={styles.errorText}>{formErrors.driver}</span>}

                    <div style={styles.selectorScrollBox}>
                      {drivers
                        .filter(d => d.status === 'Available' && !isLicenseExpired(d.licenseExpiryDate))
                        .map(d => {
                          const isSelected = selectedDriverId === d.id;
                          return (
                            <div 
                              key={d.id} 
                              style={{
                                ...styles.selectorItem,
                                cursor: 'pointer',
                                borderColor: isSelected ? '#7c3aed' : '#262626',
                                backgroundColor: isSelected ? '#111111' : '#000000',
                              }}
                              onClick={() => {
                                setSelectedDriverId(d.id);
                                handleSelectAsset(selectedVehicleId, d.id, cargoWeight);
                                setFormErrors({});
                              }}
                            >
                              <div style={styles.selectorItemHeader}>
                                <span style={styles.selectorItemTitle}>{d.name}</span>
                                <span style={styles.safetyScoreTag}>Safety: {d.safetyScore}/5</span>
                              </div>
                              <div style={styles.selectorItemDetails}>
                                <span>License: {d.licenseNumber}</span>
                                <span>• Expiry Date: {d.licenseExpiryDate}</span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Step 4 Content: Cargo Details */}
                {currentStep === 4 && (
                  <div style={styles.wizardStepContent}>
                    <h4 style={styles.stepTitle}>Step 4: Cargo & Distance Specs</h4>
                    <p style={styles.stepDescription}>Input freight specifications. Cargo weight must not exceed selected vehicle capacity.</p>
                    
                    {warnings.length > 0 && (
                      <div style={styles.warningBox}>
                        {warnings.map((warn, idx) => (
                          <div key={idx} style={styles.warnText}>{warn}</div>
                        ))}
                      </div>
                    )}
                    
                    <div style={styles.formRow}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Cargo Type</label>
                        <select 
                          className="form-input"
                          value={cargoType}
                          onChange={(e) => setCargoType(e.target.value)}
                        >
                          <option value="General Cargo">General Cargo</option>
                          <option value="Dry Van">Dry Van Freight</option>
                          <option value="Refrigerated">Refrigerated Logistics</option>
                          <option value="Hazardous">Hazardous Materials</option>
                          <option value="Liquids">Bulk Liquids</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Cargo Weight (kg)</label>
                        <input 
                          type="number" 
                          className="form-input" 
                          placeholder="e.g. 2500"
                          value={cargoWeight}
                          onChange={(e) => {
                            setCargoWeight(e.target.value);
                            handleSelectAsset(selectedVehicleId, selectedDriverId, e.target.value);
                          }}
                        />
                        {formErrors.weight && <span style={styles.errorText}>{formErrors.weight}</span>}
                      </div>
                    </div>

                    <div style={styles.formRow}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Planned Distance (km)</label>
                        <input 
                          type="number" 
                          className="form-input" 
                          placeholder="e.g. 520"
                          value={plannedDistance}
                          onChange={(e) => setPlannedDistance(e.target.value)}
                        />
                        {formErrors.distance && <span style={styles.errorText}>{formErrors.distance}</span>}
                      </div>

                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Planned Revenue (₹)</label>
                        <input 
                          type="number" 
                          className="form-input" 
                          placeholder="e.g. 25000"
                          value={revenue}
                          onChange={(e) => setRevenue(e.target.value)}
                        />
                        {formErrors.revenue && <span style={styles.errorText}>{formErrors.revenue}</span>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5 Content: Review & Confirm */}
                {currentStep === 5 && (
                  <div style={styles.wizardStepContent}>
                    <h4 style={styles.stepTitle}>Step 5: Review & Confirm</h4>
                    <p style={styles.stepDescription}>Verify trip details before committing changes to database registry.</p>
                    
                    <div style={styles.reviewGrid}>
                      <div style={styles.reviewRow}>
                        <div>
                          <span style={styles.reviewLabel}>Route Origin</span>
                          <span style={styles.reviewVal}>{source}</span>
                        </div>
                        <div>
                          <span style={styles.reviewLabel}>Route Destination</span>
                          <span style={styles.reviewVal}>{destination}</span>
                        </div>
                      </div>

                      <div style={styles.reviewRow}>
                        <div>
                          <span style={styles.reviewLabel}>Asset Registration</span>
                          <span style={styles.reviewVal}>
                            {vehicles.find(v => v.id === selectedVehicleId)?.registrationNumber} ({vehicles.find(v => v.id === selectedVehicleId)?.type})
                          </span>
                        </div>
                        <div>
                          <span style={styles.reviewLabel}>Assigned Operator</span>
                          <span style={styles.reviewVal}>
                            {drivers.find(d => d.id === selectedDriverId)?.name}
                          </span>
                        </div>
                      </div>

                      <div style={styles.reviewRow}>
                        <div>
                          <span style={styles.reviewLabel}>Cargo Summary</span>
                          <span style={styles.reviewVal}>{Number(cargoWeight).toLocaleString('en-IN')} kg ({cargoType})</span>
                        </div>
                        <div>
                          <span style={styles.reviewLabel}>Planned Distance</span>
                          <span style={styles.reviewVal}>{Number(plannedDistance).toLocaleString('en-IN')} km</span>
                        </div>
                      </div>

                      <div style={styles.reviewRow}>
                        <div>
                          <span style={styles.reviewLabel}>Estimated Revenue</span>
                          <span style={{ ...styles.reviewVal, color: '#10b981' }}>₹{Number(revenue).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div style={styles.modalFooter}>
                  {currentStep > 1 ? (
                    <button type="button" className="btn btn-secondary" onClick={() => { setCurrentStep(currentStep - 1); setFormErrors({}); }}>
                      Back
                    </button>
                  ) : (
                    <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
                      Cancel
                    </button>
                  )}

                  {currentStep < 5 ? (
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      onClick={() => {
                        let isValid = false;
                        if (currentStep === 1) isValid = validateStep1();
                        else if (currentStep === 2) isValid = validateStep2();
                        else if (currentStep === 3) isValid = validateStep3();
                        else if (currentStep === 4) isValid = validateStep4();
                        if (isValid) {
                          setCurrentStep(currentStep + 1);
                          setFormErrors({});
                        }
                      }}
                    >
                      Next Step
                    </button>
                  ) : (
                    <button type="submit" className="btn btn-primary">
                      Confirm & Dispatch
                    </button>
                  )}
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
  td: {
    padding: '0.6875rem 1rem',
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
    maxWidth: '540px',
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
  formInstructions: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    marginBottom: '1rem',
  },
  formRow: {
    display: 'flex',
    gap: '0.75rem',
  },
  warningBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderLeft: '3px solid #ef4444',
    padding: '0.625rem 0.875rem',
    marginBottom: '1rem',
    borderRadius: '2px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
  },
  warnText: {
    fontSize: '0.75rem',
    color: '#ef4444',
    fontWeight: 550,
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
  // Wizard Styles
  wizardStepsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.25rem',
    borderBottom: '1px solid #262626',
    paddingBottom: '0.75rem',
  },
  wizardStepIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  stepNumber: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.6875rem',
    color: '#ffffff',
  },
  wizardStepLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#262626',
    margin: '0 0.5rem',
  },
  wizardStepContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
    minHeight: '240px',
  },
  stepTitle: {
    fontSize: '0.875rem',
    fontWeight: 700,
    color: '#ffffff',
  },
  stepDescription: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    marginBottom: '0.5rem',
  },
  selectorScrollBox: {
    maxHeight: '180px',
    overflowY: 'auto' as const,
    border: '1px solid #262626',
    borderRadius: '4px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
    backgroundColor: '#000000',
    padding: '4px',
  },
  selectorItem: {
    border: '1px solid #262626',
    borderRadius: '3px',
    padding: '0.5rem 0.625rem',
    transition: 'all 0.1s ease',
  },
  selectorItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.125rem',
  },
  selectorItemTitle: {
    fontSize: '0.8125rem',
    fontWeight: 700,
    color: '#ffffff',
  },
  faint: {
    color: '#525252',
    fontWeight: 500,
  },
  selectorItemDetails: {
    display: 'flex',
    gap: '0.5rem',
    fontSize: '0.6875rem',
    color: '#9ca3af',
  },
  safetyScoreTag: {
    fontSize: '0.6875rem',
    fontWeight: 700,
    color: '#10b981',
  },
  reviewGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.625rem',
    backgroundColor: '#000000',
    border: '1px solid #262626',
    borderRadius: '4px',
    padding: '0.75rem 1rem',
  },
  reviewRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    borderBottom: '1px solid #111111',
    paddingBottom: '0.25rem',
  },
  reviewLabel: {
    display: 'block',
    fontSize: '0.6875rem',
    color: '#525252',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    fontWeight: 600,
  },
  reviewVal: {
    fontSize: '0.8125rem',
    fontWeight: 700,
    color: '#ffffff',
    marginTop: '2px',
    display: 'block',
  },
  // Timeline Progress Styles
  timelineContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.875rem 1rem',
    backgroundColor: '#000000',
    border: '1px solid #262626',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  timelineStep: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.6875rem',
    fontWeight: 700,
    width: '80px',
  },
  timelineDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    transition: 'all 0.2s ease',
  },
  timelineLabel: {
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  timelineLine: {
    flex: 1,
    height: '2px',
    margin: '0 0.25rem',
    transition: 'all 0.2s ease',
  },
};

