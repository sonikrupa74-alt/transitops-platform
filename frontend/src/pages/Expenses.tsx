import React, { useState } from 'react';
import { Plus, X, Fuel, DollarSign } from 'lucide-react';
import { 
  getFuelLogs, 
  setFuelLogs as saveFuelLogs, 
  getExpenses, 
  setExpenses as saveExpenses, 
  getVehicles, 
  FuelLog, 
  Expense, 
  Vehicle 
} from '../utils/storage';
import { 
  PageHeader, 
  SearchBar, 
  Toast, 
  ToastMessage 
} from '../components/ERPComponents';

export default function Expenses() {
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(() => getFuelLogs());
  const [expenses, setExpenses] = useState<Expense[]>(() => getExpenses());
  const [vehicles] = useState<Vehicle[]>(() => getVehicles());
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Toast
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [modalType, setModalType] = useState<'fuel' | 'expense'>('fuel');
  
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Form Fields
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [liters, setLiters] = useState('');
  const [cost, setCost] = useState('');
  const [expenseType, setExpenseType] = useState<'Toll' | 'Maintenance' | 'Other'>('Toll');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Filter fuel and general expenses
  const filteredFuelLogs = fuelLogs.filter(log => {
    const vehicle = vehicles.find(v => v.id === log.vehicleId);
    return (vehicle?.registrationNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredExpenses = expenses.filter(exp => {
    const vehicle = vehicles.find(v => v.id === exp.vehicleId);
    return (
      (vehicle?.registrationNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const newToast = { id: Date.now().toString(), text, type };
    setToast(newToast);
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenFuel = () => {
    setSelectedVehicleId('');
    setLiters('');
    setCost('');
    setDate(new Date().toISOString().split('T')[0]);
    setFormErrors({});
    setModalType('fuel');
    setIsFormOpen(true);
  };

  const handleOpenExpense = () => {
    setSelectedVehicleId('');
    setExpenseType('Toll');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setFormErrors({});
    setModalType('expense');
    setIsFormOpen(true);
  };

  const handleSaveFuel = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!selectedVehicleId) errors.vehicle = 'Please select a vehicle';
    if (!liters || Number(liters) <= 0) errors.liters = 'Liters must be positive';
    if (!cost || Number(cost) <= 0) errors.cost = 'Total cost must be positive';
    if (!date) errors.date = 'Date is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const matchedVeh = vehicles.find(v => v.id === selectedVehicleId);
    const newFuelLog: FuelLog = {
      id: `FUEL-${1000 + fuelLogs.length + 1}`,
      vehicleId: selectedVehicleId,
      liters: Number(liters),
      cost: Number(cost),
      date
    };

    const updated = [...fuelLogs, newFuelLog];
    setFuelLogs(updated);
    saveFuelLogs(updated);
    showToast(`Logged ${liters}L of fuel for ${matchedVeh?.registrationNumber}`);
    setIsFormOpen(false);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!selectedVehicleId) errors.vehicle = 'Please select a vehicle';
    if (!amount || Number(amount) <= 0) errors.amount = 'Expense amount must be positive';
    if (!date) errors.date = 'Date is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const matchedVeh = vehicles.find(v => v.id === selectedVehicleId);
    const newExpense: Expense = {
      id: `EXP-${1000 + expenses.length + 1}`,
      vehicleId: selectedVehicleId,
      type: expenseType,
      amount: Number(amount),
      date
    };

    const updated = [...expenses, newExpense];
    setExpenses(updated);
    saveExpenses(updated);
    showToast(`Logged $${amount} ${expenseType} fee for ${matchedVeh?.registrationNumber}`);
    setIsFormOpen(false);
  };

  return (
    <div style={styles.container}>
      <PageHeader 
        title="Fleet Fuel & Operational Expenses"
        description="Track fuel transactions, road tolls, maintenance logs, and asset expenses."
        breadcrumbs={[{ label: 'TransitOps ERP', link: '/' }, { label: 'Expenses', active: true }]}
        actions={
          <div style={styles.btnGroup}>
            <button className="btn btn-secondary" onClick={handleOpenFuel}>
              <Plus size={14} />
              <span>Log Fuel</span>
            </button>
            <button className="btn btn-primary" onClick={handleOpenExpense}>
              <Plus size={14} />
              <span>Log Expense</span>
            </button>
          </div>
        }
      />

      {/* Search Bar */}
      <div className="card" style={styles.searchBarCard}>
        <SearchBar 
          placeholder="Search ledgers by vehicle registration or category..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
      </div>

      {/* Dual Ledger Panels */}
      <div style={styles.twoColumnGrid}>
        
        {/* Fuel Logs Column */}
        <div className="card" style={styles.ledgerCard}>
          <div style={styles.ledgerHeader}>
            <Fuel size={16} style={{ color: '#7c3aed' }} />
            <h3 style={styles.ledgerTitle}>Recent Fuel Ledger</h3>
          </div>
          
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Vehicle</th>
                  <th style={styles.th}>Fuel Volume</th>
                  <th style={styles.th}>Total Cost</th>
                  <th style={styles.th}>Logged Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredFuelLogs.length > 0 ? (
                  filteredFuelLogs.map((log) => {
                    const vehicleObj = vehicles.find(v => v.id === log.vehicleId);
                    return (
                      <tr key={log.id} style={styles.tr}>
                        <td style={styles.regTd}>
                          {vehicleObj ? vehicleObj.registrationNumber : log.vehicleId}
                        </td>
                        <td style={styles.td}>{log.liters.toLocaleString()} Liters</td>
                        <td style={{ ...styles.td, fontWeight: 700 }}>${log.cost.toLocaleString()}</td>
                        <td style={styles.td}>{log.date}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} style={styles.emptyCell}>No fuel records logged.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* General Expenses Column */}
        <div className="card" style={styles.ledgerCard}>
          <div style={styles.ledgerHeader}>
            <DollarSign size={16} style={{ color: '#10b981' }} />
            <h3 style={styles.ledgerTitle}>Operational Expenses Ledger</h3>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Vehicle</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Logged Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map((exp) => {
                    const vehicleObj = vehicles.find(v => v.id === exp.vehicleId);
                    return (
                      <tr key={exp.id} style={styles.tr}>
                        <td style={styles.regTd}>
                          {vehicleObj ? vehicleObj.registrationNumber : exp.vehicleId}
                        </td>
                        <td style={styles.td}>
                          <span style={{ 
                            ...styles.categoryBadge,
                            backgroundColor: exp.type === 'Maintenance' ? 'rgba(245,158,11,0.08)' : 'rgba(59,130,246,0.08)',
                            color: exp.type === 'Maintenance' ? '#f59e0b' : '#3b82f6',
                            border: exp.type === 'Maintenance' ? '1px solid rgba(245,158,11,0.15)' : '1px solid rgba(59,130,246,0.15)'
                          }}>
                            {exp.type}
                          </span>
                        </td>
                        <td style={{ ...styles.td, fontWeight: 700 }}>${exp.amount.toLocaleString()}</td>
                        <td style={styles.td}>{exp.date}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} style={styles.emptyCell}>No expenses logged.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Toast alert */}
      <Toast message={toast} onClose={() => setToast(null)} />

      {/* Logging Modals */}
      {isFormOpen && (
        <div style={styles.modalOverlay}>
          <div className="card" style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {modalType === 'fuel' ? 'Log Fuel Transaction' : 'Record Operational Expense'}
              </h3>
              <button style={styles.closeBtn} onClick={() => setIsFormOpen(false)}>
                <X size={16} />
              </button>
            </div>

            {modalType === 'fuel' ? (
              <form onSubmit={handleSaveFuel}>
                <div className="form-group">
                  <label className="form-label">Vehicle Registration</label>
                  <select 
                    className="form-input"
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                  >
                    <option value="">-- Select Fleet Vehicle --</option>
                    {vehicles.filter(v => v.status !== 'Retired').map(v => (
                      <option key={v.id} value={v.id}>{v.registrationNumber} ({v.type})</option>
                    ))}
                  </select>
                  {formErrors.vehicle && <span style={styles.errorText}>{formErrors.vehicle}</span>}
                </div>

                <div style={styles.formRow}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Fuel Volume (Liters)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="e.g. 50"
                      value={liters}
                      onChange={(e) => setLiters(e.target.value)}
                    />
                    {formErrors.liters && <span style={styles.errorText}>{formErrors.liters}</span>}
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Total Cost ($)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="e.g. 98"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                    />
                    {formErrors.cost && <span style={styles.errorText}>{formErrors.cost}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Purchase Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                  {formErrors.date && <span style={styles.errorText}>{formErrors.date}</span>}
                </div>

                <div style={styles.modalFooter}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Record Fuel
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSaveExpense}>
                <div className="form-group">
                  <label className="form-label">Vehicle Registration</label>
                  <select 
                    className="form-input"
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                  >
                    <option value="">-- Select Fleet Vehicle --</option>
                    {vehicles.filter(v => v.status !== 'Retired').map(v => (
                      <option key={v.id} value={v.id}>{v.registrationNumber} ({v.type})</option>
                    ))}
                  </select>
                  {formErrors.vehicle && <span style={styles.errorText}>{formErrors.vehicle}</span>}
                </div>

                <div style={styles.formRow}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Expense Category</label>
                    <select 
                      className="form-input"
                      value={expenseType}
                      onChange={(e) => setExpenseType(e.target.value as any)}
                    >
                      <option value="Toll">Road Toll Fee</option>
                      <option value="Maintenance">Maintenance Shop</option>
                      <option value="Other">Other Miscellaneous</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Total Cost ($)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="e.g. 35"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    {formErrors.amount && <span style={styles.errorText}>{formErrors.amount}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Logged Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                  {formErrors.date && <span style={styles.errorText}>{formErrors.date}</span>}
                </div>

                <div style={styles.modalFooter}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Record Expense
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
  btnGroup: {
    display: 'flex',
    gap: '0.5rem',
  },
  searchBarCard: {
    padding: '0.75rem 1rem',
    marginBottom: '1.25rem',
  },
  twoColumnGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.25rem',
    alignItems: 'start',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  } as React.CSSProperties,
  ledgerCard: {
    padding: '1.25rem 0 0 0',
    overflow: 'hidden',
  },
  ledgerHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0 1.25rem 0.5rem 1.25rem',
    borderBottom: '1px solid #262626',
  },
  ledgerTitle: {
    fontSize: '0.8125rem',
    fontWeight: 700,
    color: '#9ca3af',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
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
    padding: '0.625rem 1.25rem',
    fontWeight: 600,
    color: '#9ca3af',
    fontSize: '0.75rem',
  },
  tr: {
    borderBottom: '1px solid #1a1a1a',
    backgroundColor: '#0b0b0b',
  },
  regTd: {
    padding: '0.625rem 1.25rem',
    fontWeight: 700,
    color: '#ffffff',
  },
  td: {
    padding: '0.625rem 1.25rem',
    color: '#ffffff',
  },
  categoryBadge: {
    padding: '0.125rem 0.5rem',
    borderRadius: '100px',
    fontSize: '0.6875rem',
    fontWeight: 600,
    display: 'inline-block',
  },
  emptyCell: {
    padding: '3rem',
    textAlign: 'center' as const,
    color: '#9ca3af',
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
    maxWidth: '460px',
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
};
