import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  'All', 'Web Development', 'Mobile Development', 'Graphic Design',
  'Content Writing', 'Digital Marketing', 'Data Analysis', 'Video Editing', 'Other',
];

const GigBrowse = () => {
  const { user } = useAuth();
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchGigs = async (category) => {
    setLoading(true);
    setError('');
    try {
      const params = category && category !== 'All' ? { category } : {};
      const { data } = await API.get('/gigs', { params });
      setGigs(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load gigs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGigs(selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="page-content">
        <div className="page-header">
          <h1>Browse Gigs</h1>
          <p>Discover talented freelancers for your project.</p>
        </div>

        {/* Category Filter */}
        <div className="category-filter">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`filter-btn${selectedCategory === cat ? ' active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading && (
          <div className="loading-center">
            <div className="spinner" />
            <p>Loading gigs...</p>
          </div>
        )}

        {error && <div className="error-banner" role="alert">{error}</div>}

        {!loading && !error && gigs.length === 0 && (
          <div className="empty-state">
            <p>No gigs found in this category.</p>
            {user?.role === 'freelancer' && (
              <Link to="/my-gigs" className="btn-primary">Create Your First Gig</Link>
            )}
          </div>
        )}

        <div className="gigs-grid">
          {gigs.map((gig) => (
            <div className="gig-card" key={gig._id}>
              <div className="gig-card-header">
                <span className="gig-category">{gig.category}</span>
                <span className="gig-price">R{gig.price.toLocaleString()}</span>
              </div>
              <h3 className="gig-title">{gig.title}</h3>
              <p className="gig-description">
                {gig.description.length > 120
                  ? `${gig.description.slice(0, 120)}…`
                  : gig.description}
              </p>
              <div className="gig-card-footer">
                <span className="gig-freelancer">by {gig.freelancer?.name}</span>
                <span className="gig-delivery">⏱ {gig.deliveryDays}d delivery</span>
              </div>
              <Link to={`/gigs/${gig._id}`} className="btn-secondary gig-view-btn">
                View Details
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default GigBrowse;
