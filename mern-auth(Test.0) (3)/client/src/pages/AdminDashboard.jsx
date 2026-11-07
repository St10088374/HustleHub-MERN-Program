import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ gigs: 0, bookings: 0, transactions: 0, totalIncome: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [gigsRes, bookingsRes, txRes] = await Promise.all([
          API.get('/gigs'),
          API.get('/bookings/my'),
          API.get('/transactions/my'),
        ]);
        setStats({
          gigs: gigsRes.data.length,
          bookings: bookingsRes.data.length,
          transactions: txRes.data.summary?.transactionCount || 0,
          totalIncome: txRes.data.summary?.totalIncome || 0,
        });
      } catch {
        // silently fail
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  const estimatedTaxReserve = stats.totalIncome * 0.27;

  return (
    <div className="dashboard-content-layout">
      {/* ─── Hero Welcome Banner ─── */}
      <section className="portal-hero-banner admin-banner">
        <div className="portal-hero-main">
          <div className="portal-hero-badge">
            <span className="hero-indicator-dot rose"></span>
            <span>HustleHub+ System Administration &amp; Governance</span>
          </div>
          <h1 className="portal-hero-title">
            Admin Portal: Welcome back, <span className="highlight-text">{user?.name}</span> 🛡️
          </h1>
          <p className="portal-hero-subtitle">
            Full system-level access: Oversee marketplace catalog health, monitor platform transaction volume, inspect client bookings, and track security events.
          </p>
        </div>
        <div className="portal-hero-meta">
          <div className="hero-role-pill admin">
            <span className="hero-role-icon">⚡</span>
            <span className="hero-role-label">System Administrator</span>
          </div>
        </div>
      </section>

      {/* ─── Platform Oversight KPI Grid ─── */}
      <div className="portal-grid">
        {/* Card 1: Gross Platform Volume */}
        <div className="action-card highlight-income-card">
          <div className="action-card-header">
            <div className="action-icon-bubble emerald">
              <span>💰</span>
            </div>
            <span className="action-card-tag text-emerald">Financial Volume (GMV)</span>
          </div>
          <div className="action-card-body">
            <h3 className="action-card-title">Gross Platform Volume</h3>
            {loadingStats ? (
              <div className="stat-loading-pulse">Calculating volume...</div>
            ) : (
              <div className="income-display-large">
                <span className="income-amount-text">
                  R{stats.totalIncome.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </span>
                <span className="tax-calc-sublabel">Total processed through platform bookings</span>
              </div>
            )}
            <div className="stat-summary-box">
              <div className="stat-item">
                <span className="stat-label">Transactions</span>
                <span className="stat-value-large">{stats.transactions}</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-label">Est. 27% Tax Reserve</span>
                <span className="stat-value-large text-emerald">
                  R{estimatedTaxReserve.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
          <div className="action-card-footer">
            <Link to="/income" className="btn-cta btn-emerald-gradient">
              <span>View Financial Ledgers</span>
              <span className="btn-arrow">→</span>
            </Link>
          </div>
        </div>

        {/* Card 2: Marketplace Catalog */}
        <div className="action-card">
          <div className="action-card-header">
            <div className="action-icon-bubble indigo">
              <span>⚡</span>
            </div>
            <span className="action-card-tag">Marketplace Catalog</span>
          </div>
          <div className="action-card-body">
            <h3 className="action-card-title">Active Service Gigs</h3>
            {loadingStats ? (
              <div className="stat-loading-pulse">Loading catalog...</div>
            ) : (
              <div className="stat-big-number">
                <span>{stats.gigs}</span>
                <span className="stat-unit">active gig{stats.gigs !== 1 ? 's' : ''} published</span>
              </div>
            )}
            <p className="action-card-desc" style={{ marginTop: '12px' }}>
              Review, inspect, and moderate all active marketplace listings published by registered freelancers.
            </p>
          </div>
          <div className="action-card-footer">
            <Link to="/gigs" className="btn-cta btn-secondary-styled">
              <span>Browse &amp; Moderate Gigs</span>
              <span className="btn-arrow">→</span>
            </Link>
          </div>
        </div>

        {/* Card 3: Platform Bookings */}
        <div className="action-card">
          <div className="action-card-header">
            <div className="action-icon-bubble cyan">
              <span>📋</span>
            </div>
            <span className="action-card-tag">Order Flow</span>
          </div>
          <div className="action-card-body">
            <h3 className="action-card-title">Platform Bookings</h3>
            {loadingStats ? (
              <div className="stat-loading-pulse">Loading orders...</div>
            ) : (
              <div className="stat-big-number">
                <span>{stats.bookings}</span>
                <span className="stat-unit">total booking{stats.bookings !== 1 ? 's' : ''} placed</span>
              </div>
            )}
            <p className="action-card-desc" style={{ marginTop: '12px' }}>
              Inspect client hires, order fulfillment notes, and transactional records generated across the platform.
            </p>
          </div>
          <div className="action-card-footer">
            <Link to="/bookings" className="btn-cta btn-secondary-styled">
              <span>Inspect All Bookings</span>
              <span className="btn-arrow">→</span>
            </Link>
          </div>
        </div>

        {/* Card 4: Security & Audit Observability */}
        <div className="action-card">
          <div className="action-card-header">
            <div className="action-icon-bubble rose">
              <span>🛡️</span>
            </div>
            <span className="action-card-tag" style={{ color: '#e11d48' }}>Security &amp; Audit</span>
          </div>
          <div className="action-card-body">
            <h3 className="action-card-title">Security &amp; Compliance</h3>
            <div className="stat-summary-box">
              <div className="stat-item">
                <span className="stat-label">Audit Logging</span>
                <span className="stat-value-large" style={{ color: '#059669', fontSize: '1.1rem' }}>Active ✅</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-label">Access Control</span>
                <span className="stat-value-large" style={{ color: '#4f46e5', fontSize: '1.1rem' }}>RBAC Enforced</span>
              </div>
            </div>
            <p className="action-card-desc">
              Structured JSON security events are captured in real-time in <code>server/logs/security-events.log</code>.
            </p>
          </div>
          <div className="action-card-footer">
            <Link to="/income" className="btn-cta btn-secondary-styled">
              <span>Audit Financial Data</span>
              <span className="btn-arrow">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Fast Governance Navigation Bar ─── */}
      <section className="portal-section quick-links-section">
        <div className="quick-actions-bar">
          <div className="quick-action-text">
            <h4>System Administration Shortcuts</h4>
            <p>Direct navigation to platform catalogs, order records, and financial ledgers.</p>
          </div>
          <div className="quick-action-btns">
            <Link to="/gigs" className="btn-cta btn-primary-gradient">
              <span>Browse Catalog</span>
            </Link>
            <Link to="/bookings" className="btn-cta btn-secondary-styled">
              <span>Platform Orders</span>
            </Link>
            <Link to="/income" className="btn-cta btn-outline">
              <span>Financial Reports</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
