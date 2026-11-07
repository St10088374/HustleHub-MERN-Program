import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// roles: optional array of allowed roles e.g. ['freelancer']
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Role-based guard: if roles provided and user's role not included → redirect to dashboard
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
