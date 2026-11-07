import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  pending: '#f59e0b',
  confirmed: '#6366f1',
  in_progress: '#3b82f6',
  completed: '#22c55e',
  cancelled: '#ef4444',
};

const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const { data } = await API.get('/bookings/my');
        setBookings(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load bookings.');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-ZA', {
      year: 'numeric', month: 'short', day: 'numeric',
    });

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="page-content">
        <div className="page-header">
          <h1>{user?.role === 'client' ? 'My Bookings' : 'Received Bookings'}</h1>
          <p>
            {user?.role === 'client'
              ? 'Track your service bookings.'
              : 'Bookings received from clients.'}
          </p>
        </div>

        {error && <div className="error-banner" role="alert">{error}</div>}

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <p>{user?.role === 'client' ? "You haven't made any bookings yet." : "No bookings received yet."}</p>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map((booking) => (
              <div className="booking-card" key={booking._id}>
                <div className="booking-card-header">
                  <h3 className="booking-gig-title">{booking.gig?.title}</h3>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: STATUS_COLORS[booking.status] }}
                  >
                    {booking.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="booking-meta">
                  <div className="booking-meta-row">
                    <span className="meta-label">
                      {user?.role === 'client' ? 'Freelancer' : 'Client'}
                    </span>
                    <span className="meta-value">
                      {user?.role === 'client'
                        ? booking.freelancer?.name
                        : booking.client?.name}
                    </span>
                  </div>
                  <div className="booking-meta-row">
                    <span className="meta-label">Category</span>
                    <span className="meta-value">{booking.gig?.category}</span>
                  </div>
                  <div className="booking-meta-row">
                    <span className="meta-label">Amount</span>
                    <span className="meta-value booking-amount">R{booking.amount?.toLocaleString()}</span>
                  </div>
                  <div className="booking-meta-row">
                    <span className="meta-label">Booked on</span>
                    <span className="meta-value">{formatDate(booking.createdAt)}</span>
                  </div>
                  {booking.notes && (
                    <div className="booking-meta-row">
                      <span className="meta-label">Notes</span>
                      <span className="meta-value booking-notes">{booking.notes}</span>
                    </div>
                  )}
                </div>

                <div className="booking-id">
                  Booking ID: <code>{booking._id}</code>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyBookings;
