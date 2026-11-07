import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const ClientDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ bookings: 0, totalSpent: 0, recentBookings: [] });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await API.get('/bookings/my');
        const totalSpent = data.reduce((sum, b) => sum + (b.amount || 0), 0);
        setStats({
          bookings: data.length,
          totalSpent,
          recentBookings: data.slice(0, 4),
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
      <section className="portal-hero-banner client-banner">
        <div className="portal-hero-main">
          <div className="portal-hero-badge">
            <span className="hero-indicator-dot"></span>
            <span>HustleHub+ Client Workspace</span>
          </div>
          <h1 className="portal-hero-title">
            Welcome back, <span className="highlight-text">{user?.name}</span> 👋
          </h1>
          <p className="portal-hero-subtitle">
            Browse verified services, book top talent with instant confirmation, and manage project deliverables seamlessly.
          </p>
        </div>
        <div className="portal-hero-meta">
          <div className="hero-role-pill">
            <span className="hero-role-icon">👤</span>
            <span className="hero-role-label">Client Account</span>
          </div>
        </div>
      </section>

      {/* ─── Metrics & Quick Action Grid ─── */}
      <div className="portal-grid">
        {/* Card 1: Explore Gigs */}
        <div className="action-card explore-card">
          <div className="action-card-header">
            <div className="action-icon-bubble indigo">
              <span>🔍</span>
            </div>
            <span className="action-card-tag">Marketplace</span>
          </div>
          <div className="action-card-body">
            <h3 className="action-card-title">Browse Services</h3>
            <p className="action-card-desc">
              Discover web developers, designers, copywriters, and specialists ready for your next project.
            </p>
          </div>
          <div className="action-card-footer">
            <Link to="/gigs" className="btn-cta btn-primary-gradient">
              <span>Explore Marketplace</span>
              <span className="btn-arrow">→</span>
            </Link>
          </div>
        </div>

        {/* Card 2: My Bookings & Spend */}
        <div className="action-card bookings-card">
          <div className="action-card-header">
            <div className="action-icon-bubble emerald">
              <span>📑</span>
            </div>
            <span className="action-card-tag">Hires & Orders</span>
          </div>
          <div className="action-card-body">
            <h3 className="action-card-title">My Bookings</h3>
            {loadingStats ? (
              <div className="stat-loading-pulse">Loading activity...</div>
            ) : (
              <div className="stat-summary-box">
                <div className="stat-item">
                  <span className="stat-label">Active Bookings</span>
                  <span className="stat-value-large">{stats.bookings}</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <span className="stat-label">Total Invested</span>
                  <span className="stat-value-large text-emerald">
                    R{stats.totalSpent.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="action-card-footer">
            <Link to="/bookings" className="btn-cta btn-secondary-styled">
              <span>View All Bookings</span>
              <span className="btn-arrow">→</span>
            </Link>
          </div>
        </div>

        {/* Card 3: Platform Security Guarantee */}
        <div className="action-card security-card">
          <div className="action-card-header">
            <div className="action-icon-bubble violet">
              <span>🛡️</span>
            </div>
            <span className="action-card-tag">Security Guarantee</span>
          </div>
          <div className="action-card-body">
            <h3 className="action-card-title">H+ Escrow & Trust</h3>
            <p className="action-card-desc">
              Every booking is protected by automated transactional records, verified freelancer IDs, and simulated secure payments.
            </p>
          </div>
          <div className="action-card-footer">
            <div className="security-status-pill">
              <span className="status-check">✓</span> 256-Bit JWT Encryption & RBAC
            </div>
          </div>
        </div>
      </div>

      {/* ─── Recent Bookings Activity ─── */}
      <section className="portal-section">
        <div className="portal-section-header">
          <div>
            <h2 className="section-title">Recent Activity</h2>
            <p className="section-desc">Latest bookings and service fulfillments</p>
          </div>
          <Link to="/bookings" className="section-link">View history →</Link>
        </div>

        {loadingStats ? (
          <div className="empty-state-box">
            <div className="spinner-small"></div>
            <p>Loading recent bookings...</p>
          </div>
        ) : stats.recentBookings.length === 0 ? (
          <div className="empty-state-box">
            <div className="empty-icon">📂</div>
            <h4>No bookings yet</h4>
            <p>You haven't hired any freelancers yet. Find top talent and initiate your first booking!</p>
            <Link to="/gigs" className="btn-cta btn-primary-gradient mt-3">
              Explore Available Gigs
            </Link>
          </div>
        ) : (
          <div className="recent-activity-list">
            {stats.recentBookings.map((b) => (
              <div className="activity-card-row" key={b._id}>
                <div className="activity-avatar-icon">📦</div>
                <div className="activity-info">
                  <span className="activity-title">{b.gig?.title || 'Custom Service'}</span>
                  <span className="activity-subtitle">
                    Freelancer: <strong>{b.freelancer?.name || 'Assigned Freelancer'}</strong>
                  </span>
                </div>
                <div className="activity-amount">
                  R{b.amount?.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </div>
                <div className="activity-status">
                  <span className={`status-pill pill-${b.status}`}>
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ClientDashboard;
