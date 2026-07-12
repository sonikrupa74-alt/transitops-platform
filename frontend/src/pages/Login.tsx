import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Shield, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLogin: (role: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('FleetManager');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      onLogin(role);
      navigate('/');
    }, 1000);
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.container}>
        {/* Brand Header */}
        <div style={styles.brandHeader}>
          <span style={styles.logoIcon}>🚚</span>
          <span style={styles.logoText}>TransitOps</span>
        </div>

        {/* Credentials Card */}
        <div className="card" style={styles.loginCard}>
          <div style={styles.cardHeader}>
            <h1 style={styles.formTitle}>Sign In</h1>
            <p style={styles.formSubtitle}>Enter credentials to access transport ERP records</p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={styles.inputWrapper}>
                <Mail size={14} style={styles.inputIcon} />
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="e.g. manager@transitops.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.inputWithIcon}
                  required 
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <div style={styles.passwordLabelRow}>
                <label className="form-label">Password</label>
                <span style={styles.forgotLink}>Forgot password?</span>
              </div>
              <div style={styles.inputWrapper}>
                <Lock size={14} style={styles.inputIcon} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className="form-input" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ ...styles.inputWithIcon, paddingRight: '36px' }}
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.togglePasswordBtn}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Test Role (RBAC Helper) */}
            <div style={styles.roleGroup}>
              <div style={styles.roleLabel}>
                <Shield size={12} style={{ color: '#a78bfa' }} />
                <span>Test Role Profile (RBAC Scope)</span>
              </div>
              <select 
                className="form-input" 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                style={styles.roleSelect}
              >
                <option value="FleetManager">Fleet Manager (Full control)</option>
                <option value="Driver">Driver / Dispatcher (Dispatches)</option>
                <option value="SafetyOfficer">Safety Officer (DL validity)</option>
                <option value="FinancialAnalyst">Financial Analyst (Expenses)</option>
              </select>
            </div>

            {/* Submit */}
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isLoading}
              style={styles.submitBtn}
            >
              {isLoading ? (
                <div style={styles.spinnerContainer}>
                  <div style={styles.spinner} />
                  <span>Signing in...</span>
                </div>
              ) : (
                <div style={styles.btnContent}>
                  <span>Access Platform</span>
                  <ArrowRight size={14} />
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          © 2026 TransitOps ERP. Compliance Secured.
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  container: {
    width: '100%',
    maxWidth: '380px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },
  brandHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1.5rem',
  },
  logoIcon: {
    fontSize: '1.5rem',
  },
  logoText: {
    fontSize: '1.25rem',
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '-0.02em',
  },
  loginCard: {
    width: '100%',
    backgroundColor: '#0b0b0b',
    border: '1px solid #262626',
    borderRadius: '4px',
    padding: '1.5rem',
    boxShadow: 'none',
  },
  cardHeader: {
    marginBottom: '1.25rem',
    textAlign: 'center' as const,
  },
  formTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: '0.25rem',
  },
  formSubtitle: {
    fontSize: '0.75rem',
    color: '#9ca3af',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  inputWrapper: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute' as const,
    left: '10px',
    color: '#525252',
    pointerEvents: 'none' as const,
  },
  inputWithIcon: {
    paddingLeft: '1.875rem',
  },
  passwordLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.25rem',
  },
  forgotLink: {
    fontSize: '0.6875rem',
    color: '#7c3aed',
    fontWeight: 600,
    cursor: 'pointer',
  },
  togglePasswordBtn: {
    position: 'absolute' as const,
    right: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#9ca3af',
    display: 'flex',
    alignItems: 'center',
  },
  roleGroup: {
    backgroundColor: '#111111',
    border: '1px solid #262626',
    borderRadius: '4px',
    padding: '0.75rem 0.875rem',
    marginTop: '0.25rem',
    marginBottom: '1.25rem',
  },
  roleLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    color: '#ffffff',
    marginBottom: '0.5rem',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  roleSelect: {
    cursor: 'pointer',
    fontSize: '0.75rem',
    backgroundColor: '#000000',
    borderColor: '#262626',
  },
  submitBtn: {
    width: '100%',
    padding: '0.625rem 1rem',
    height: '38px',
  },
  btnContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.375rem',
  },
  spinnerContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  spinner: {
    width: '14px',
    height: '14px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  footer: {
    fontSize: '0.6875rem',
    color: '#525252',
    marginTop: '1.5rem',
    textAlign: 'center' as const,
  },
};
