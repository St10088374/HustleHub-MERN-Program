/**
 * Register.test.jsx
 * Tests for the Register page component
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Register from '../pages/Register';

const mockRegister = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ register: mockRegister }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderRegister = () =>
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );

describe('Register Component', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the registration form', () => {
    renderRegister();
    expect(screen.getByText(/Create your .*account/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Full name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
    expect(screen.getByLabelText('Account Type')).toBeInTheDocument();
  });

  it('shows a password mismatch error', async () => {
    renderRegister();
    // Use fireEvent.change for reliable state changes in vmThreads
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'differentpass' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Passwords do not match');
    });
  });

  it('shows password too short error', async () => {
    renderRegister();
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'abc' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'abc' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('at least 6 characters');
    });
  });

  it('allows selecting a role', async () => {
    renderRegister();
    const roleSelect = screen.getByLabelText('Account Type');
    fireEvent.change(roleSelect, { target: { value: 'freelancer' } });
    expect(roleSelect.value).toBe('freelancer');
  });

  it('calls register and navigates on successful submission', async () => {
    mockRegister.mockResolvedValueOnce({ token: 'tok', user: { role: 'client' } });
    renderRegister();

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'strongpass' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'strongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('Jane Doe', 'jane@example.com', 'strongpass', 'client');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays server error on register failure', async () => {
    mockRegister.mockRejectedValueOnce({
      response: { data: { message: 'An account with this email already exists' } },
    });
    renderRegister();

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'existing@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'strongpass' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'strongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('already exists');
    });
  });
});
