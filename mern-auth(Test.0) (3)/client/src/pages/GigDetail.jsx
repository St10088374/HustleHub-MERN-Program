import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const GigDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    const fetchGig = async () => {
      try {
        const { data } = await API.get(`/gigs/${id}`);
        setGig(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Gig not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchGig();
  }, [id]);

  const handleBook = async () => {
    if (bookingNotes.length > 500) {
      setBookingError('Notes cannot exceed 500 characters.');
      return;
    }
    setBooking(true);
    setBookingError('');
    try {
      const { data } = await API.post('/bookings', { gigId: id, notes: bookingNotes });
      setBookingSuccess(data);
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div className="loading-center"><div className="spinner" /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div className="page-content">
          <div className="error-banner" role="alert">{error}</div>
          <button className="btn-secondary" onClick={() => navigate('/gigs')}>Back to Gigs</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="page-content gig-detail-content">
        <button className="btn-back" onClick={() => navigate('/gigs')}>← Back to Gigs</button>

        {bookingSuccess ? (
          <div className="booking-success-card">
            <div className="success-icon">✅</div>
            <h2>Booking Confirmed!</h2>
            <p>Your booking for <strong>{gig.title}</strong> has been confirmed.</p>
            <p className="booking-ref">Booking ID: <code>{bookingSuccess.booking._id}</code></p>
            <p>Total paid: <strong>R{gig.price.toLocaleString()}</strong></p>
            <button className="btn-primary" onClick={() => navigate('/bookings')}>View My Bookings</button>
          </div>
        ) : (
          <div className="gig-detail-grid">
            {/* Gig Info */}
            <div className="gig-detail-main">
              <span className="gig-category">{gig.category}</span>
              <h1 className="gig-detail-title">{gig.title}</h1>
              <div className="gig-freelancer-info">
                <div className="freelancer-avatar">{gig.freelancer?.name[0]?.toUpperCase()}</div>
                <div>
                  <strong>{gig.freelancer?.name}</strong>
                  <p>{gig.freelancer?.email}</p>
                </div>
              </div>
              <div className="gig-detail-description">
                <h3>About this Gig</h3>
                <p>{gig.description}</p>
              </div>
            </div>

            {/* Booking Panel */}
            <div className="booking-panel">
              <div className="booking-price">
                <span className="price-label">Price</span>
                <span className="price-value">R{gig.price.toLocaleString()}</span>
              </div>
              <div className="booking-delivery">
                ⏱ Delivery in <strong>{gig.deliveryDays} day{gig.deliveryDays > 1 ? 's' : ''}</strong>
              </div>

              {user?.role === 'client' && (
                <>
                  {bookingError && (
                    <div className="error-banner" role="alert">{bookingError}</div>
                  )}
                  <div className="form-group">
                    <label className="form-label" htmlFor="booking-notes">
                      Notes (optional)
                    </label>
                    <textarea
                      id="booking-notes"
                      className="form-textarea"
                      placeholder="Describe your requirements..."
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      maxLength={500}
                      rows={4}
                    />
                    <small>{bookingNotes.length}/500</small>
                  </div>
                  <button
                    className="btn-primary booking-btn"
                    onClick={handleBook}
                    disabled={booking}
                  >
                    {booking ? <><span className="btn-spinner" /> Processing...</> : '🛒 Book Now'}
                  </button>
                  <p className="booking-note">⚡ Instant confirmation · No payment required</p>
                </>
              )}

              {user?.role === 'freelancer' && (
                <p className="booking-note">This is your gig or you are a freelancer — booking not available.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default GigDetail;
