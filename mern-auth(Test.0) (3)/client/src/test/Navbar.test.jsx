/**
 * Navbar.test.jsx
 * Tests for the Navbar component
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';

const mockLogout = vi.fn();
const mockNavigate = vi.fn();
let currentUser = null;

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: currentUser, logout: mockLogout }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/dashboard' }),
  };
});

const renderNavbar = (user) => {
  currentUser = user;
  return render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>
  );
};

describe('Navbar Component', () => {
  it('renders the brand name', () => {
    renderNavbar({ name: 'Alice', role: 'client' });
    expect(screen.getByText('HustleHub+')).toBeInTheDocument();
  });

  it('shows Browse Gigs link for all users', () => {
    renderNavbar({ name: 'Alice', role: 'client' });
    expect(screen.getByText('Browse Gigs')).toBeInTheDocument();
  });

  it('shows My Gigs and Income links for freelancers', () => {
    renderNavbar({ name: 'Bob', role: 'freelancer' });
    expect(screen.getByText('My Gigs')).toBeInTheDocument();
    expect(screen.getByText(/Income/)).toBeInTheDocument();
  });

  it('does NOT show My Gigs or Income links for clients', () => {
    renderNavbar({ name: 'Alice', role: 'client' });
    expect(screen.queryByText('My Gigs')).not.toBeInTheDocument();
    expect(screen.queryByText(/Income/)).not.toBeInTheDocument();
  });

  it('shows user name and role badge', () => {
    renderNavbar({ name: 'Alice', role: 'client' });
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('client')).toBeInTheDocument();
  });

  it('shows Financial Ledgers and Bookings links for admin', () => {
    renderNavbar({ name: 'Dan', role: 'admin' });
    expect(screen.getByText('Financial Ledgers')).toBeInTheDocument();
    expect(screen.getByText('Bookings')).toBeInTheDocument();
    expect(screen.queryByText('My Gigs')).not.toBeInTheDocument();
  });

  it('calls logout and navigates on logout button click', async () => {
    renderNavbar({ name: 'Alice', role: 'client' });
    const user = userEvent.setup();
    await user.click(screen.getByText('Logout'));
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
