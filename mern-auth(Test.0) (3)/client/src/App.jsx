import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GigBrowse from './pages/GigBrowse';
import GigDetail from './pages/GigDetail';
import MyGigs from './pages/MyGigs';
import MyBookings from './pages/MyBookings';
import Income from './pages/Income';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/gigs" element={<ProtectedRoute><GigBrowse /></ProtectedRoute>} />
          <Route path="/gigs/:id" element={<ProtectedRoute><GigDetail /></ProtectedRoute>} />
          <Route path="/my-gigs" element={<ProtectedRoute roles={['freelancer']}><MyGigs /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/income" element={<ProtectedRoute roles={['freelancer', 'admin']}><Income /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
