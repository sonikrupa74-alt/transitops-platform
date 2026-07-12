import React, { useState } from 'react';
import { Plus, X, AlertTriangle, Check, ShieldAlert } from 'lucide-react';
import { 
  getMaintenance, 
  setMaintenance as saveMaintenance, 
  getVehicles, 
  setVehicles as saveVehicles,
  getExpenses,
  setExpenses as saveExpenses,
  MaintenanceLog,
  Vehicle,
  Expense,
  formatDateDMY
} from '../utils/storage';
import { 
  PageHeader, 
  DataTable, 
  StatusBadge, 
  SearchBar, 
  FilterDrawer, 
  Toast, 
  ToastMessage,
  ActionDropdown 
} from '../components/ERPComponents';

export default function Maintenance() {
  const [logs, setLogs] = useState<MaintenanceLog[]>(() => getMaintenance());
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => getVehicles());

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Modals & Toast
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'open' | 'close' | 'view' | 'edit'>('open');
  const [selectedLog, setSelectedLog] = useState<MaintenanceLog | null>(null);

  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Form Fields
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [type, setType] = useState<'Oil Change' | 'Brake Service' | 'Engine Repair' | 'Tire Replacement' | 'General Service'>('Oil Change');
  const [garage, setGarage] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Low');
  const [status, setStatus] = useState<'Scheduled' | 'In Progress' | 'Completed'>('Scheduled');
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState('');
  const [mechanicNotes, setMechanicNotes] = useState('');

  // Complete ticket cost field
  const [closeCost, setCloseCost] = useState('');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter & Search Logic
  const filteredLogs = logs.filter(log => {
    const vehicle = vehicles.find(v => v.id === log.vehicleId);
    
    const matchesSearch = log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.garage.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (vehicle?.registrationNumber || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || log.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const newToast = { id: Date.now().toString(), text, type };
    setToast(newToast);
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenOpenTicket = () => {
    setSelectedVehicleId('');
    setDescription('');
    setCost('');
    setType('Oil Change');
    setGarage('');
    setPriority('Low');
    setStatus('Scheduled');
    setEstimatedCompletionDate('');
    setMechanicNotes('');
    setFormErrors({});
    setModalMode('open');
    setIsFormOpen(true);
  };

  const handleOpenCloseTicket = (log: MaintenanceLog) => {
    setSelectedLog(log);
    setCloseCost(log.cost.toString());
    setFormErrors({});
    setModalMode('close');
    setIsFormOpen(true);
  };

  const handleOpenView = (log: MaintenanceLog) => {
    setSelectedLog(log);
    setModalMode('view');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (log: MaintenanceLog) => {
    setSelectedLog(log);
    setSelectedVehicleId(log.vehicleId);
    setDescription(log.description);
    setCost(log.cost.toString());
    setType(log.type);
    setGarage(log.garage);
    setPriority(log.priority);
    setStatus(log.status);
    setEstimatedCompletionDate(log.endDate || '');
    setMechanicNotes(log.notes || '');
    setFormErrors({});
    setModalMode('edit');
    setIsFormOpen(true);
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!selectedVehicleId) errors.vehicle = 'Please select a vehicle';
    if (!description.trim()) errors.description = 'Provide a brief repair description';
    if (!garage.trim()) errors.garage = 'Garage name is required';
    if (!cost || Number(cost) < 0) errors.cost = 'Estimated cost must be positive';
    if (!estimatedCompletionDate) errors.endDate = 'Estimated completion date is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const newTicket: MaintenanceLog = {
      id: `MTN-${1000 + logs.length + 1}`,
      vehicleId: selectedVehicleId,
      description,
      cost: Number(cost),
      startDate: new Date().toISOString().split('T')[0],
      endDate: estimatedCompletionDate,
      status,
      type,
      garage,
      priority,
      notes: mechanicNotes
    };

    // Update logs
    const updatedLogs = [...logs, newTicket];
    setLogs(updatedLogs);
    saveMaintenance(updatedLogs);

    // Lock vehicle to shop if Scheduled or In Progress
    let targetVehicleStatus = vehicles.find(v => v.id === selectedVehicleId)?.status || 'Available';
    if (status === 'Scheduled' || status === 'In Progress') {
      targetVehicleStatus = 'In Shop';
    }

    const updatedVehicles = vehicles.map(v => v.id === selectedVehicleId ? { ...v, status: targetVehicleStatus } : v);
    setVehicles(updatedVehicles);
    saveVehicles(updatedVehicles);

    // If completed, record expense immediately
    if (status === 'Completed') {
      const currentExpenses = getExpenses();
      const newExpense: Expense = {
        id: `EXP-${1000 + currentExpenses.length + 1}`,
        vehicleId: selectedVehicleId,
        type: 'Maintenance',
        amount: Number(cost),
        date: new Date().toISOString().split('T')[0],
        description: `Maintenance Work: ${description}`,
        status: 'Approved'
      };
      saveExpenses([...currentExpenses, newExpense]);
    }

    showToast(`Maintenance log ${newTicket.id} scheduled successfully`);
    setIsFormOpen(false);
  };

  const handleEditTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLog) return;

    const errors: Record<string, string> = {};
    if (!description.trim()) errors.description = 'Provide description';
    if (!garage.trim()) errors.garage = 'Garage is required';
    if (!cost || Number(cost) < 0) errors.cost = 'Cost must be positive';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const updatedLogs = logs.map(l => l.id === selectedLog.id ? {
      ...l,
      description,
      cost: Number(cost),
      endDate: estimatedCompletionDate,
      status,
      type,
      garage,
      priority,
      notes: mechanicNotes
    } : l);

    setLogs(updatedLogs);
    saveMaintenance(updatedLogs);

    // Recompute vehicle status
    let targetVehicleStatus = vehicles.find(v => v.id === selectedLog.vehicleId)?.status || 'Available';
    if (status === 'Scheduled' || status === 'In Progress') {
      targetVehicleStatus = 'In Shop';
    } else if (status === 'Completed' && targetVehicleStatus === 'In Shop') {
      targetVehicleStatus = 'Available';
    }

    const updatedVehicles = vehicles.map(v => v.id === selectedLog.vehicleId ? { ...v, status: targetVehicleStatus } : v);
    setVehicles(updatedVehicles);
    saveVehicles(updatedVehicles);

    // Record expense if completed
    if (status === 'Completed' && selectedLog.status !== 'Completed') {
      const currentExpenses = getExpenses();
      const newExpense: Expense = {
        id: `EXP-${1000 + currentExpenses.length + 1}`,
        vehicleId: selectedLog.vehicleId,
        type: 'Maintenance',
        amount: Number(cost),
        date: new Date().toISOString().split('T')[0],
        description: `Maintenance Work: ${description}`,
        status: 'Approved'
      };
      saveExpenses([...currentExpenses, newExpense]);
    }

    showToast(`Maintenance log ${selectedLog.id} updated`);
    setIsFormOpen(false);
  };

  const handleCloseTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLog) return;

    const errors: Record<string, string> = {};
    const finalCost = Number(closeCost);

    if (!closeCost || finalCost < 0) {
      errors.cost = 'Final cost is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    const updatedLogs = logs.map(l => l.id === selectedLog.id 
      ? { ...l, status: 'Completed' as const, cost: finalCost, endDate: today } 
      : l
    );
    setLogs(updatedLogs);
    saveMaintenance(updatedLogs);

    // Release vehicle
    const updatedVehicles = vehicles.map(v => v.id === selectedLog.vehicleId 
      ? { ...v, status: 'Available' as const } 
      : v
    );
    setVehicles(updatedVehicles);
    saveVehicles(updatedVehicles);

    // Log Expense
    const currentExpenses = getExpenses();
    const newExpense: Expense = {
      id: `EXP-${1000 + currentExpenses.length + 1}`,
      vehicleId: selectedLog.vehicleId,
      type: 'Maintenance',
      amount: finalCost,
      date: today,
      description: `Closed Repair: ${selectedLog.description}`,
      status: 'Approved'
    };
    saveExpenses([...currentExpenses, newExpense]);

    showToast(`Repair ticket ${selectedLog.id} completed. Vehicle released.`);
    setIsFormOpen(false);
  };

  const handleTransitionStatus = (log: MaintenanceLog, nextStatus: 'In Progress' | 'Completed') => {
    const today = new Date().toISOString().split('T')[0];
    
    const updatedLogs = logs.map(l => l.id === log.id 
      ? { 
          ...l, 
          status: nextStatus, 
          endDate: nextStatus === 'Completed' ? today : l.endDate 
        } 
      : l
    );
    setLogs(updatedLogs);
    saveMaintenance(updatedLogs);

    let vehicleStatus = vehicles.find(v => v.id === log.vehicleId)?.status || 'Available';
    if (nextStatus === 'In Progress') {
      vehicleStatus = 'In Shop';
    } else if (nextStatus === 'Completed') {
      vehicleStatus = 'Available';

      // Log Expense
      const currentExpenses = getExpenses();
      const newExpense: Expense = {
        id: `EXP-${1000 + currentExpenses.length + 1}`,
        vehicleId: log.vehicleId,
        type: 'Maintenance',
        amount: log.cost,
        date: today,
        description: `Transition Completed: ${log.description}`,
        status: 'Approved'
      };
      saveExpenses([...currentExpenses, newExpense]);
    }

    const updatedVehicles = vehicles.map(v => v.id === log.vehicleId ? { ...v, status: vehicleStatus } : v);
    setVehicles(updatedVehicles);
    saveVehicles(updatedVehicles);

    showToast(`Ticket ${log.id} moved to ${nextStatus}.`);
  };

  const getPriorityStyle = (p: string) => {
    if (p === 'High') return { color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', padding: '1px 6px', borderRadius: '2px', fontSize: '10px', fontWeight: 700 };
    if (p === 'Medium') return { color: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', padding: '1px 6px', borderRadius: '2px', fontSize: '10px', fontWeight: 700 };
    return { color: '#9ca3af', backgroundColor: 'rgba(156,163,175,0.05)', border: '1px solid rgba(156,163,175,0.15)', padding: '1px 6px', borderRadius: '2px', fontSize: '10px', fontWeight: 700 };
  };

  const tableHeaders = [
    { key: 'id', label: 'Ticket ID', sortable: false },
    { key: 'vehicle', label: 'Vehicle', sortable: false },
    { key: 'type', label: 'Service Type', sortable: false },
    { key: 'garage', label: 'Garage Workshop', sortable: false },
    { key: 'cost', label: 'Cost (₹)', sortable: false },
    { key: 'priority', label: 'Priority', sortable: false },
    { key: 'status', label: 'Status', sortable: false },
    { key: 'actions', label: '', sortable: false }
  ];

  return (
    <div style={styles.container}>
      <PageHeader 
        title="Vehicle Maintenance Management"
        description="Schedule vehicle repairs, track garage check-ins, and inspect maintenance priority logs."
        breadcrumbs={[{ label: 'TransitOps ERP', link: '/' }, { label: 'Maintenance Logs', active: true }]}
        actions={
          <button className="btn btn-primary" onClick={handleOpenOpenTicket}>
            <Plus size={14} />
            <span>Schedule Maintenance</span>
          </button>
        }
      />

      {/* Main split display: Logs vs Vehicle list compatibility */}
      <div style={styles.splitGrid}>
        
        {/* Left Side: Maintenance Tickets Ledger */}
        <div style={styles.leftPane}>
          <div className="card" style={styles.ledgerHeaderCard}>
            <SearchBar 
              placeholder="Search by ticket ID, vehicle registration, type, or garage..."
              value={searchTerm}
              onChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
              onFilterToggle={() => setIsFilterOpen(true)}
              isFilterActive={filterStatus !== 'all' || filterPriority !== 'all'}
            />
          </div>

          <DataTable 
            headers={tableHeaders}
            data={paginatedLogs}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onRowClick={handleOpenView}
            renderRow={(log) => {
              const veh = vehicles.find(v => v.id === log.vehicleId);
              
              const dropdownActions = [
                { label: 'View Service Log', onClick: () => handleOpenView(log) },
                { label: 'Edit Service Details', onClick: () => handleOpenEdit(log) }
              ];
              if (log.status === 'Scheduled') {
                dropdownActions.push({ label: 'Mark "In Progress"', onClick: () => handleTransitionStatus(log, 'In Progress') });
              }
              if (log.status !== 'Completed') {
                dropdownActions.push({ label: 'Close Ticket (Complete)', onClick: () => handleOpenCloseTicket(log) });
              }

              return (
                <>
                  <td style={styles.idTd}>{log.id}</td>
                  <td style={styles.regTd}>{veh ? veh.registrationNumber : log.vehicleId}</td>
                  <td style={styles.td}>{log.type}</td>
                  <td style={styles.td}>{log.garage}</td>
                  <td style={{ ...styles.td, fontWeight: 700 }}>₹{log.cost.toLocaleString('en-IN')}</td>
                  <td style={styles.td}>
                    <span style={getPriorityStyle(log.priority)}>{log.priority}</span>
                  </td>
                  <td style={styles.td}>
                    <StatusBadge status={log.status} />
                  </td>
                  <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                    <ActionDropdown actions={dropdownActions} />
                  </td>
                </>
              );
            }}
          />
        </div>

        {/* Right Side: Vehicle List Maintenance Compatibility Status */}
        <div style={styles.rightPane}>
          <div className="card" style={styles.rightPaneCard}>
            <div style={styles.rightHeader}>
              <ShieldAlert size={16} style={{ color: '#ef4444' }} />
              <h3 style={styles.rightTitle}>Fleet Maintenance Gating</h3>
            </div>
            <p style={styles.rightDescription}>
              Vehicles actively marked in shop cannot be dispatched to trips to prevent operational breakdowns.
            </p>

            <div style={styles.vehicleScrollBox}>
              {vehicles.filter(v => v.status !== 'Retired').map(v => {
                const inMaintenance = v.status === 'In Shop';
                return (
                  <div 
                    key={v.id} 
                    style={{
                      ...styles.vehicleRow,
                      borderColor: inMaintenance ? 'rgba(239, 68, 68, 0.25)' : '#262626',
                      backgroundColor: inMaintenance ? 'rgba(239, 68, 68, 0.02)' : '#000000',
                    }}
                  >
                    <div>
                      <span style={styles.vehicleRegText}>{v.registrationNumber}</span>
                      <span style={styles.vehicleOdoText}>{v.odometer.toLocaleString()} km • {v.type}</span>
                    </div>

                    <div style={styles.compatibilityCell}>
                      {inMaintenance ? (
                        <div style={styles.gatedBadge} title="Vehicle locked in workshop and cannot be dispatched to trips.">
                          <AlertTriangle size={12} />
                          <span>Blocked from Trips</span>
                        </div>
                      ) : (
                        <div style={styles.compatibleBadge}>
                          <Check size={12} />
                          <span>Trip Ready</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Filter Drawer */}
      <FilterDrawer 
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filter Maintenance"
        onClear={() => {
          setFilterStatus('all');
          setFilterPriority('all');
          setIsFilterOpen(false);
          setCurrentPage(1);
        }}
        onApply={() => {
          setIsFilterOpen(false);
          setCurrentPage(1);
        }}
      >
        <div style={styles.drawerField}>
          <label className="form-label">Service Status</label>
          <select 
            className="form-input" 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div style={styles.drawerField}>
          <label className="form-label">Service Priority</label>
          <select 
            className="form-input" 
            value={filterPriority} 
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
      </FilterDrawer>

      {/* Toast Notification */}
      <Toast message={toast} onClose={() => setToast(null)} />

      {/* Form / Details Modals */}
      {isFormOpen && (
        <div style={styles.modalOverlay}>
          <div className="card" style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {modalMode === 'open' && 'Schedule Vehicle Maintenance'}
                {modalMode === 'edit' && `Edit Service Log - ${selectedLog?.id}`}
                {modalMode === 'close' && `Complete Repair Service - ${selectedLog?.id}`}
                {modalMode === 'view' && `Service Ticket details - ${selectedLog?.id}`}
              </h3>
              <button style={styles.closeBtn} onClick={() => setIsFormOpen(false)}>
                <X size={16} />
              </button>
            </div>

            {modalMode === 'view' && selectedLog && (
              <div style={styles.viewGrid}>
                <div style={styles.viewRow}>
                  <div>
                    <span style={styles.viewLabel}>Vehicle Registration</span>
                    <span style={styles.viewVal}>
                      {vehicles.find(v => v.id === selectedLog.vehicleId)?.registrationNumber}
                    </span>
                  </div>
                  <div>
                    <span style={styles.viewLabel}>Maintenance Type</span>
                    <span style={styles.viewVal}>{selectedLog.type}</span>
                  </div>
                </div>

                <div style={styles.viewRow}>
                  <div>
                    <span style={styles.viewLabel}>Garage Workshop</span>
                    <span style={styles.viewVal}>{selectedLog.garage}</span>
                  </div>
                  <div>
                    <span style={styles.viewLabel}>Ticket Status</span>
                    <div style={{ marginTop: '4px' }}>
                      <StatusBadge status={selectedLog.status} />
                    </div>
                  </div>
                </div>

                <div style={styles.viewRow}>
                  <div>
                    <span style={styles.viewLabel}>Priority level</span>
                    <span style={{ ...styles.viewVal, color: selectedLog.priority === 'High' ? '#ef4444' : '#ffffff' }}>
                      {selectedLog.priority}
                    </span>
                  </div>
                  <div>
                    <span style={styles.viewLabel}>Cost (INR)</span>
                    <span style={styles.viewVal}>₹{selectedLog.cost.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div style={styles.viewRow}>
                  <div>
                    <span style={styles.viewLabel}>Start Date</span>
                    <span style={styles.viewVal}>{formatDateDMY(selectedLog.startDate)}</span>
                  </div>
                  <div>
                    <span style={styles.viewLabel}>Estimated Completion Date</span>
                    <span style={styles.viewVal}>{selectedLog.endDate ? formatDateDMY(selectedLog.endDate) : 'N/A'}</span>
                  </div>
                </div>

                <div>
                  <span style={styles.viewLabel}>Mechanic Notes & Diagnosis</span>
                  <span style={{ ...styles.viewVal, whiteSpace: 'normal', fontWeight: 500 }}>
                    {selectedLog.notes || 'No notes logged.'}
                  </span>
                </div>

                <div style={styles.modalFooter}>
                  <button className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
                    Close Details
                  </button>
                  {selectedLog.status !== 'Completed' && (
                    <button className="btn btn-primary" onClick={() => handleOpenEdit(selectedLog)}>
                      Edit Details
                    </button>
                  )}
                </div>
              </div>
            )}

            {modalMode === 'close' && selectedLog && (
              <form onSubmit={handleCloseTicketSubmit}>
                <p style={styles.formInstructions}>
                  Record the final costs incurred for this maintenance log. This releases the vehicle status.
                </p>

                <div className="form-group">
                  <label className="form-label">Final Maintenance Cost (₹)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="e.g. 15000"
                    value={closeCost}
                    onChange={(e) => setCloseCost(e.target.value)}
                  />
                  {formErrors.cost && <span style={styles.errorText}>{formErrors.cost}</span>}
                </div>

                <div style={styles.modalFooter}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Record & Close
                  </button>
                </div>
              </form>
            )}

            {(modalMode === 'open' || modalMode === 'edit') && (
              <form onSubmit={modalMode === 'open' ? handleCreateTicket : handleEditTicket}>
                <div style={styles.formRow}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Vehicle Registration</label>
                    <select 
                      className="form-input"
                      value={selectedVehicleId}
                      onChange={(e) => setSelectedVehicleId(e.target.value)}
                      disabled={modalMode === 'edit'}
                    >
                      <option value="">-- Choose Vehicle --</option>
                      {vehicles.filter(v => v.status !== 'Retired').map(v => (
                        <option key={v.id} value={v.id}>
                          {v.registrationNumber} ({v.type}) [{v.status}]
                        </option>
                      ))}
                    </select>
                    {formErrors.vehicle && <span style={styles.errorText}>{formErrors.vehicle}</span>}
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Maintenance Type</label>
                    <select 
                      className="form-input"
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                    >
                      <option value="Oil Change">Oil Change</option>
                      <option value="Brake Service">Brake Service</option>
                      <option value="Engine Repair">Engine Repair</option>
                      <option value="Tire Replacement">Tire Replacement</option>
                      <option value="General Service">General Service</option>
                    </select>
                  </div>
                </div>

                <div style={styles.formRow}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Garage Workshop Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Bangalore Garage"
                      value={garage}
                      onChange={(e) => setGarage(e.target.value)}
                    />
                    {formErrors.garage && <span style={styles.errorText}>{formErrors.garage}</span>}
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Estimated Cost (₹)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="e.g. 8500"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                    />
                    {formErrors.cost && <span style={styles.errorText}>{formErrors.cost}</span>}
                  </div>
                </div>

                <div style={styles.formRow}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Estimated Completion Date</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={estimatedCompletionDate}
                      onChange={(e) => setEstimatedCompletionDate(e.target.value)}
                    />
                    {formErrors.endDate && <span style={styles.errorText}>{formErrors.endDate}</span>}
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Priority Level</label>
                    <select 
                      className="form-input"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div style={styles.formRow}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Operational Status</label>
                    <select 
                      className="form-input"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Mechanic Notes / Diagnosis</label>
                  <textarea 
                    className="form-input" 
                    placeholder="Enter diagnostic details, replacement parts, or service instructions..."
                    value={mechanicNotes}
                    onChange={(e) => setMechanicNotes(e.target.value)}
                    style={styles.textarea}
                  />
                </div>

                <div style={styles.modalFooter}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Record Schedule
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
  splitGrid: {
    display: 'flex',
    gap: '1.25rem',
    alignItems: 'flex-start',
    width: '100%',
    '@media (max-width: 1024px)': {
      flexDirection: 'column' as const,
    },
  },
  leftPane: {
    flex: '2.5',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    minWidth: 0,
    width: '100%',
  },
  rightPane: {
    flex: '1',
    width: '100%',
  },
  ledgerHeaderCard: {
    padding: '0.75rem 1rem',
  },
  rightPaneCard: {
    padding: '1.25rem 1rem',
  },
  rightHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
  },
  rightTitle: {
    fontSize: '0.8125rem',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: '#9ca3af',
  },
  rightDescription: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    marginBottom: '1rem',
    lineHeight: '1.4',
  },
  vehicleScrollBox: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
    maxHeight: '440px',
    overflowY: 'auto' as const,
  },
  vehicleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.625rem 0.75rem',
    border: '1px solid #262626',
    borderRadius: '4px',
  },
  vehicleRegText: {
    fontSize: '0.8125rem',
    fontWeight: 700,
    color: '#ffffff',
    display: 'block',
  },
  vehicleOdoText: {
    fontSize: '0.6875rem',
    color: '#9ca3af',
    display: 'block',
    marginTop: '2px',
  },
  compatibilityCell: {
    display: 'flex',
    alignItems: 'center',
  },
  gatedBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 6px',
    borderRadius: '2px',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    color: '#ef4444',
    fontSize: '0.71875rem',
    fontWeight: 700,
  },
  compatibleBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 6px',
    borderRadius: '2px',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    color: '#10b981',
    fontSize: '0.71875rem',
    fontWeight: 700,
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
  formInstructions: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    marginBottom: '1rem',
  },
  formRow: {
    display: 'flex',
    gap: '0.75rem',
  },
  textarea: {
    minHeight: '60px',
    resize: 'vertical' as const,
    width: '100%',
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
    fontSize: '0.8125rem',
    fontWeight: 700,
    color: '#ffffff',
    marginTop: '2px',
    display: 'block',
  },
};
