import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandLogo from './BrandLogo';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  // Extract avatar initial safely
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <header className="navbar-container">
      <nav className="navbar">
        {/* Brand Logo with H+ */}
        <div className="nav-brand">
          <Link to="/dashboard" className="nav-brand-link" title="HustleHub+ Dashboard">
            <BrandLogo size={36} showText={true} />
          </Link>
        </div>

        {/* Navigation Tabs */}
        <div className="nav-links">
          <Link to="/gigs" className={`nav-link ${isActive('/gigs') ? 'active' : ''}`}>
            <span className="nav-link-icon">⚡</span>
            <span>Browse Gigs</span>
          </Link>

          {user?.role === 'freelancer' && (
            <Link to="/my-gigs" className={`nav-link ${isActive('/my-gigs') ? 'active' : ''}`}>
              <span className="nav-link-icon">💼</span>
              <span>My Gigs</span>
            </Link>
          )}

          {(user?.role === 'freelancer' || user?.role === 'admin') && (
            <Link to="/income" className={`nav-link ${isActive('/income') ? 'active' : ''}`}>
              <span className="nav-link-icon">📊</span>
              <span>{user?.role === 'admin' ? 'Financial Ledgers' : 'Income & Tax'}</span>
            </Link>
          )}

          {(user?.role === 'client' || user?.role === 'freelancer' || user?.role === 'admin') && (
            <Link to="/bookings" className={`nav-link ${isActive('/bookings') ? 'active' : ''}`}>
              <span className="nav-link-icon">📑</span>
              <span>Bookings</span>
            </Link>
          )}

          <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
            <span className="nav-link-icon">🧭</span>
            <span>Dashboard</span>
          </Link>
        </div>

        {/* User Identity & Logout Controls */}
        <div className="nav-user-cluster">
          <div className="nav-user-info">
            <div className="nav-user-avatar" title={user?.name}>
              {initial}
            </div>
            <div className="nav-user-details">
              <span className="nav-user-name">{user?.name || 'User'}</span>
              <span className={`role-badge role-${user?.role || 'client'}`}>
                {user?.role || 'client'}
              </span>
            </div>
          </div>

          <button className="btn-logout" onClick={handleLogout} title="Sign Out of HustleHub+">
            <svg viewBox="0 0 20 20" fill="currentColor" className="logout-icon" width="16" height="16">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
