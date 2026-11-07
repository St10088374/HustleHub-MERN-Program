import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const FreelancerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ gigs: 0, bookings: 0, income: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [gigsRes, txRes] = await Promise.all([
          API.get('/gigs/my'),
          API.get('/transactions/my'),
        ]);
        setStats({
          gigs: gigsRes.data.length,
          bookings: txRes.data.summary.transactionCount,
          income: txRes.data.summary.totalNetIncome,
        });
      } catch {
        // fail gracefully
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="dashboard-content-layout">
      {/* ─── Hero Welcome Banner ─── */}
      <section className="portal-hero-banner freelancer-banner">
        <div className="portal-hero-main">
          <div className="portal-hero-badge">
            <span className="hero-indicator-dot green"></span>
            <span>HustleHub+ Freelancer Pro Portal</span>
          </div>
          <h1 className="portal-hero-title">
            Welcome back, <span className="highlight-text">{user?.name}</span> 💼
          </h1>
          <p className="portal-hero-subtitle">
            Manage your service catalog, process incoming orders, track recognized income, and monitor your 27% estimated tax obligations.
          </p>
        </div>
        <div className="portal-hero-meta">
          <div className="hero-role-pill freelancer">
            <span className="hero-role-icon">⚡</span>
            <span className="hero-role-label">Freelancer Partner</span>
          </div>
        </div>
      </section>

      {/* ─── Financial & Operational KPI Cards ─── */}
      <div className="portal-grid">
        {/* Card 1: Net Income */}
        <div className="action-card highlight-income-card">
          <div className="action-card-header">
            <div className="action-icon-bubble emerald">
              <span>💰</span>
            </div>
            <span className="action-card-tag text-emerald">Financial Core</span>
          </div>
          <div className="action-card-body">
            <h3 className="action-card-title">Net Take-Home Earnings</h3>
            {loadingStats ? (
              <div className="stat-loading-pulse">Calculating net...</div>
            ) : (
              <div className="income-display-large">
                <span className="income-amount-text">
                  R{stats.income.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </span>
                <span className="tax-calc-sublabel">After 27% provisional tax estimation</span>
              </div>
            )}
          </div>
          <div className="action-card-footer">
            <Link to="/income" className="btn-cta btn-emerald-gradient">
              <span>View Tax & Ledgers</span>
              <span className="btn-arrow">→</span>
            </Link>
          </div>
        </div>

        {/* Card 2: Active Gigs */}
        <div className="action-card">
          <div className="action-card-header">
            <div className="action-icon-bubble indigo">
              <span>📂</span>
            </div>
            <span className="action-card-tag">Listings</span>
          </div>
          <div className="action-card-body">
            <h3 className="action-card-title">Service Gigs</h3>
            {loadingStats ? (
              <div className="stat-loading-pulse">Loading gigs...</div>
            ) : (
              <div className="stat-big-number">
                <span>{stats.gigs}</span>
                <span className="stat-unit">active gig{stats.gigs !== 1 ? 's' : ''} published</span>
              </div>
            )}
          </div>
          <div className="action-card-footer">
            <Link to="/my-gigs" className="btn-cta btn-secondary-styled">
              <span>Manage Service Listings</span>
              <span className="btn-arrow">→</span>
            </Link>
          </div>
        </div>

        {/* Card 3: Incoming Bookings */}
        <div className="action-card">
          <div className="action-card-header">
            <div className="action-icon-bubble cyan">
              <span>📋</span>
            </div>
            <span className="action-card-tag">Orders</span>
          </div>
          <div className="action-card-body">
            <h3 className="action-card-title">Client Bookings</h3>
            {loadingStats ? (
              <div className="stat-loading-pulse">Loading orders...</div>
            ) : (
              <div className="stat-big-number">
                <span>{stats.bookings}</span>
                <span className="stat-unit">booking{stats.bookings !== 1 ? 's' : ''} received</span>
              </div>
            )}
          </div>
          <div className="action-card-footer">
            <Link to="/bookings" className="btn-cta btn-secondary-styled">
              <span>View Customer Bookings</span>
              <span className="btn-arrow">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Quick Actions Bar ─── */}
      <section className="portal-section quick-links-section">
        <div className="quick-actions-bar">
          <div className="quick-action-text">
            <h4>Ready to grow your freelance business?</h4>
            <p>Publish a new service gig or analyze your monthly performance breakdown.</p>
          </div>
          <div className="quick-action-btns">
            <Link to="/my-gigs" className="btn-cta btn-primary-gradient">
              <span>+ Create New Gig</span>
            </Link>
            <Link to="/gigs" className="btn-cta btn-outline">
              <span>Explore Market Trends</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FreelancerDashboard;
