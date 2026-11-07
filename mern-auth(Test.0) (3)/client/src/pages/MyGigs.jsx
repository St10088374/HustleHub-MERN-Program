import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import API from '../api/axios';

const CATEGORIES = [
  'Web Development', 'Mobile Development', 'Graphic Design',
  'Content Writing', 'Digital Marketing', 'Data Analysis', 'Video Editing', 'Other',
];

const EMPTY_FORM = {
  title: '', description: '', category: 'Web Development', price: '', deliveryDays: '',
};

const MyGigs = () => {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editGig, setEditGig] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchMyGigs = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/gigs/my');
      setGigs(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load gigs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyGigs(); }, []);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const openCreate = () => {
    setEditGig(null);
    setFormData(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (gig) => {
    setEditGig(gig);
    setFormData({
      title: gig.title,
      description: gig.description,
      category: gig.category,
      price: gig.price,
      deliveryDays: gig.deliveryDays,
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Client-side validation
    if (!formData.title.trim() || formData.title.length < 5) {
      return setFormError('Title must be at least 5 characters.');
    }
    if (!formData.description.trim() || formData.description.length < 20) {
      return setFormError('Description must be at least 20 characters.');
    }
    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 1) return setFormError('Price must be at least R1.');
    const days = parseInt(formData.deliveryDays);
    if (isNaN(days) || days < 1) return setFormError('Delivery days must be at least 1.');

    setFormLoading(true);
    try {
      if (editGig) {
        await API.put(`/gigs/${editGig._id}`, { ...formData, price, deliveryDays: days });
        setSuccessMsg('Gig updated successfully!');
      } else {
        await API.post('/gigs', { ...formData, price, deliveryDays: days });
        setSuccessMsg('Gig created successfully!');
      }
      setShowForm(false);
      await fetchMyGigs();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save gig.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (gigId) => {
    if (!window.confirm('Are you sure you want to delete this gig?')) return;
    try {
      await API.delete(`/gigs/${gigId}`);
      setSuccessMsg('Gig deleted.');
      await fetchMyGigs();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete gig.');
    }
  };

  const handleToggleActive = async (gig) => {
    try {
      await API.put(`/gigs/${gig._id}`, { isActive: !gig.isActive });
      await fetchMyGigs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update gig.');
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="page-content">
        <div className="page-header">
          <div>
            <h1>My Gigs</h1>
            <p>Manage your freelance listings.</p>
          </div>
          <button className="btn-primary" onClick={openCreate}>+ Create New Gig</button>
        </div>

        {successMsg && <div className="success-banner" role="status">{successMsg}</div>}
        {error && <div className="error-banner" role="alert">{error}</div>}

        {/* Create/Edit Form Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <h2>{editGig ? 'Edit Gig' : 'Create New Gig'}</h2>

              {formError && <div className="error-banner" role="alert">{formError}</div>}

              <form onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                  <label className="form-label" htmlFor="gig-title">Title</label>
                  <input
                    id="gig-title"
                    name="title"
                    className="form-input"
                    placeholder="e.g. I will build a React app"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    maxLength={100}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="gig-category">Category</label>
                  <select
                    id="gig-category"
                    name="category"
                    className="form-input"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="gig-desc">Description</label>
                  <textarea
                    id="gig-desc"
                    name="description"
                    className="form-textarea"
                    placeholder="Describe what you offer in detail (min. 20 characters)"
                    value={formData.description}
                    onChange={handleChange}
                    rows={5}
                    required
                    maxLength={2000}
                  />
                  <small>{formData.description.length}/2000</small>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="gig-price">Price (R)</label>
                    <input
                      id="gig-price"
                      name="price"
                      type="number"
                      className="form-input"
                      placeholder="e.g. 1500"
                      value={formData.price}
                      onChange={handleChange}
                      min={1}
                      max={100000}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="gig-days">Delivery Days</label>
                    <input
                      id="gig-days"
                      name="deliveryDays"
                      type="number"
                      className="form-input"
                      placeholder="e.g. 7"
                      value={formData.deliveryDays}
                      onChange={handleChange}
                      min={1}
                      max={365}
                      required
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={formLoading}>
                    {formLoading ? <><span className="btn-spinner" /> Saving...</> : (editGig ? 'Update Gig' : 'Create Gig')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Gigs List */}
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : gigs.length === 0 ? (
          <div className="empty-state">
            <p>You haven't created any gigs yet.</p>
            <button className="btn-primary" onClick={openCreate}>Create Your First Gig</button>
          </div>
        ) : (
          <div className="my-gigs-list">
            {gigs.map((gig) => (
              <div className={`my-gig-row${gig.isActive ? '' : ' inactive'}`} key={gig._id}>
                <div className="my-gig-info">
                  <span className="gig-category">{gig.category}</span>
                  <h3>{gig.title}</h3>
                  <p className="gig-meta">R{gig.price.toLocaleString()} · {gig.deliveryDays}d delivery</p>
                </div>
                <div className="my-gig-actions">
                  <span className={`status-badge ${gig.isActive ? 'active' : 'inactive'}`}>
                    {gig.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button className="btn-secondary btn-sm" onClick={() => handleToggleActive(gig)}>
                    {gig.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="btn-secondary btn-sm" onClick={() => openEdit(gig)}>Edit</button>
                  <button className="btn-danger btn-sm" onClick={() => handleDelete(gig._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyGigs;
