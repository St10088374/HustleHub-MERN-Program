/**
 * GigBrowse.test.jsx
 * Tests for the GigBrowse page component
 */
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import GigBrowse from '../pages/GigBrowse';

// Mock Navbar
vi.mock('../components/Navbar', () => ({ default: () => <nav data-testid="navbar">Nav</nav> }));

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Test Client', role: 'client' } }),
}));

// Mock API
const mockGet = vi.fn();
vi.mock('../api/axios', () => ({
  default: { get: (...args) => mockGet(...args) },
}));

const MOCK_GIGS = [
  {
    _id: 'gig1',
    title: 'I will build a professional React app',
    description: 'Full-stack React development with backend integration and clean code.',
    category: 'Web Development',
    price: 2500,
    deliveryDays: 7,
    freelancer: { name: 'Alice Dev', email: 'alice@example.com' },
  },
  {
    _id: 'gig2',
    title: 'I will design a modern logo for your brand',
    description: 'Professional logo design with unlimited revisions and commercial license.',
    category: 'Graphic Design',
    price: 800,
    deliveryDays: 3,
    freelancer: { name: 'Bob Designer', email: 'bob@example.com' },
  },
];

const renderGigBrowse = () =>
  render(
    <MemoryRouter>
      <GigBrowse />
    </MemoryRouter>
  );

describe('GigBrowse Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the navbar and browse gigs heading', async () => {
    mockGet.mockResolvedValue({ data: [] });
    await act(async () => { renderGigBrowse(); });
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByText('Browse Gigs')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    mockGet.mockImplementation(() => new Promise(() => {}));
    renderGigBrowse();
    expect(screen.getByText('Loading gigs...')).toBeInTheDocument();
  });

  it('renders gig cards after loading', async () => {
    mockGet.mockResolvedValue({ data: MOCK_GIGS });
    renderGigBrowse();

    await waitFor(() => {
      expect(screen.getByText('I will build a professional React app')).toBeInTheDocument();
      expect(screen.getByText('I will design a modern logo for your brand')).toBeInTheDocument();
    });
  });

  it('renders gig prices with R prefix', async () => {
    mockGet.mockResolvedValue({ data: MOCK_GIGS });
    renderGigBrowse();

    await waitFor(() => {
      // Use regex to match price regardless of locale-specific thousand separators
      expect(screen.getByText(/R[\s\xa0]*2[,.\s\xa0]?500/)).toBeInTheDocument();
      expect(screen.getByText(/R[\s\xa0]*800/)).toBeInTheDocument();
    });
  });

  it('renders category filter buttons', async () => {
    mockGet.mockResolvedValue({ data: [] });
    await act(async () => { renderGigBrowse(); });
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Web Development')).toBeInTheDocument();
    expect(screen.getByText('Graphic Design')).toBeInTheDocument();
  });

  it('fetches with category param when category filter clicked', async () => {
    mockGet.mockResolvedValue({ data: [] });
    renderGigBrowse();
    const user = userEvent.setup();

    await waitFor(() => screen.getByText('Web Development'));
    const webDevBtn = screen.getByText('Web Development');
    await user.click(webDevBtn);

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/gigs', { params: { category: 'Web Development' } });
    });
  });

  it('shows empty state when no gigs found', async () => {
    mockGet.mockResolvedValue({ data: [] });
    renderGigBrowse();

    await waitFor(() => {
      expect(screen.getByText('No gigs found in this category.')).toBeInTheDocument();
    });
  });

  it('shows an error message when API call fails', async () => {
    mockGet.mockRejectedValue({ response: { data: { message: 'Server error' } } });
    renderGigBrowse();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Server error');
    });
  });

  it('renders View Details links for each gig', async () => {
    mockGet.mockResolvedValue({ data: MOCK_GIGS });
    renderGigBrowse();

    await waitFor(() => {
      const links = screen.getAllByText('View Details');
      expect(links).toHaveLength(2);
    });
  });
});
