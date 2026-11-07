/**
 * ProtectedRoute.test.jsx
 * Tests for the ProtectedRoute component (access control)
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

// Mock AuthContext – will be overridden per test
const mockUseAuth = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const renderWithRoute = (authState, roles) =>
  render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
        <Route
          path="/protected"
          element={
            <ProtectedRoute roles={roles}>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );

describe('ProtectedRoute Component', () => {
  it('shows spinner while loading', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });
    renderWithRoute({ user: null, loading: true });
    // spinner should render (loading-screen div)
    expect(document.querySelector('.loading-screen')).toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    renderWithRoute({ user: null, loading: false });
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders children when authenticated with no role restriction', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Alice', role: 'client' },
      loading: false,
    });
    renderWithRoute({ user: { role: 'client' }, loading: false });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders children when user role matches required role', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '2', name: 'Bob', role: 'freelancer' },
      loading: false,
    });
    renderWithRoute(null, ['freelancer']);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to /dashboard when user role does not match', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '3', name: 'Carol', role: 'client' },
      loading: false,
    });
    renderWithRoute(null, ['freelancer']);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('allows admin to pass a freelancer-only route', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '4', name: 'Dan', role: 'admin' },
      loading: false,
    });
    renderWithRoute(null, ['freelancer', 'admin']);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
