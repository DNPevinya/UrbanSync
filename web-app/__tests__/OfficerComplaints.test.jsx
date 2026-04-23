import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import OfficerComplaints from '../src/pages/OfficerComplaints';

// Intercept routing so we can verify if unauthorized users are correctly redirected
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// leave out the standard layout components to keep the test DOM clean and focused on the table logic
vi.mock('../src/components/Sidebar', () => ({ default: () => <div data-testid="sidebar" /> }));
vi.mock('../src/components/Header', () => ({ default: ({ title }) => <header data-testid="header">{title}</header> }));
vi.mock('../src/components/Footer', () => ({ default: () => <footer data-testid="footer" /> }));

// Replace the browser's native localStorage so we can simulate active user sessions
Object.defineProperty(window, 'localStorage', {
  value: { 
    getItem: vi.fn(),
    setItem: vi.fn() 
  },
  writable: true
});

// Intercept network requests to prevent the test runner from pinging a real backend
global.fetch = vi.fn();

describe('OfficerComplaints Component', () => {

  // Dummy user profile representing a standard department officer
  const mockOfficerUser = {
    id: 1,
    fullName: 'Jane Officer',
    authority_id: 10,
    authorityName: 'Water Board',
    role: 'officer'
  };

  // Dummy data set containing various complaint statuses and citizen details for our filter tests
  const mockComplaints = [
    { complaint_id: 101, citizen_name: 'Alex Doe', citizen_phone: '555-0100', title: 'Leaking pipe on main st', status: 'PENDING' },
    { complaint_id: 102, citizen_name: 'Sam Smith', citizen_phone: '555-0200', title: 'No water pressure', status: 'IN PROGRESS' },
    { complaint_id: 103, citizen_name: 'Charlie Brown', citizen_phone: '555-0300', title: 'Contaminated supply', status: 'RESOLVED' }
  ];

  beforeEach(() => {
    // Start fresh before every test
    vi.clearAllMocks();
    
    // By default, pretend an authorized officer is actively logged in
    window.localStorage.getItem.mockReturnValue(JSON.stringify(mockOfficerUser));
  });

  afterEach(() => {
    // Wipe the DOM clean after every test
    cleanup();
  });

  it('redirects to the login page if no user session is found in localStorage', () => {
    // Override our default setup to simulate a logged-out state
    window.localStorage.getItem.mockReturnValue(null);
    render(<OfficerComplaints />);
    
    // Verify the component protected the route
    expect(mockNavigate).toHaveBeenCalledWith('/login');
    
    // Ensure it didn't waste resources trying to fetch data for an unauthorized user
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('renders correctly and sets up the layout using the officer context', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] })
    });

    render(<OfficerComplaints />);
    
    // Verify the static UI elements rendered
    expect(screen.getByText('Assigned Workbox')).toBeTruthy();
    expect(screen.getByTestId('sidebar')).toBeTruthy();
    expect(screen.getByTestId('footer')).toBeTruthy();
    
    // Verify the component successfully grabbed the officer's department from local storage 
    // and injected it into the Header title
    await waitFor(() => {
      expect(screen.getByTestId('header').textContent).toBe('Master Workbox | Water Board');
    });
  });

  it('fetches and displays assigned complaints based on the officers specific authority_id', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockComplaints })
    });

    render(<OfficerComplaints />);

    await waitFor(() => {
      // Verify it dynamically requested data for Authority ID 10
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/complaints/authority/10');
      
      // Verify the table mapped our dummy data to rows
      expect(screen.getByText('#CMP-101')).toBeTruthy();
      expect(screen.getByText('Leaking pipe on main st')).toBeTruthy();
      
      expect(screen.getByText('#CMP-102')).toBeTruthy();
      expect(screen.getByText('No water pressure')).toBeTruthy();
    });
  });

  it('handles API failure gracefully without crashing the app', async () => {
    // Force a network crash
    global.fetch.mockRejectedValueOnce(new Error('API Down'));

    render(<OfficerComplaints />);

    await waitFor(() => {
      // The table shell and headers should survive the crash
      expect(screen.getByText('Complaint ID')).toBeTruthy();
      
      // But no data rows should be rendered
      expect(screen.queryByText('#CMP-101')).toBeNull();
    });
  });

  it('filters complaints dynamically using a unified search query (Title, ID, or Citizen Info)', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockComplaints })
    });

    render(<OfficerComplaints />);

    // Wait for the table to populate
    await waitFor(() => {
      expect(screen.getByText('#CMP-101')).toBeTruthy();
    });

    const searchInput = screen.getByPlaceholderText('Search by ID, Name or Phone...');
    
    // Test matching against the complaint title
    fireEvent.change(searchInput, { target: { value: 'pressure' } });
    expect(screen.queryByText('#CMP-101')).toBeNull();
    expect(screen.getByText('#CMP-102')).toBeTruthy();

    // Test matching against the citizen's name
    fireEvent.change(searchInput, { target: { value: 'Alex' } });
    expect(screen.getByText('#CMP-101')).toBeTruthy();
    expect(screen.queryByText('#CMP-102')).toBeNull();

    // Test matching against the complaint ID
    fireEvent.change(searchInput, { target: { value: '103' } });
    expect(screen.queryByText('#CMP-101')).toBeNull();
    expect(screen.getByText('#CMP-103')).toBeTruthy();
  });

  it('filters complaints using the exact status dropdown', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockComplaints })
    });

    render(<OfficerComplaints />);

    await waitFor(() => {
      expect(screen.getByText('#CMP-101')).toBeTruthy();
    });

    const statusDropdown = screen.getByRole('combobox');
    
    // Filter the view to only show pending items
    fireEvent.change(statusDropdown, { target: { value: 'Pending' } });
    
    // The component logic should convert the dropdown's "Pending" to "PENDING" and match our dummy data
    expect(screen.getByText('#CMP-101')).toBeTruthy(); 
    expect(screen.queryByText('#CMP-102')).toBeNull();
    expect(screen.queryByText('#CMP-103')).toBeNull();
  });

  it('navigates to the specific complaint details page when an action button is clicked', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockComplaints })
    });

    render(<OfficerComplaints />);

    await waitFor(() => {
      expect(screen.getByText('#CMP-101')).toBeTruthy();
    });

    // The action buttons in the rows don't have text, but they are the only interactive buttons inside the table body.
    // We grab all buttons and simulate clicking the first one (which belongs to ID 101).
    const actionButtons = screen.getAllByRole('button');
    fireEvent.click(actionButtons[0]);

    // Verify it told the router to open the details view and passed the correct ID via query param
    expect(mockNavigate).toHaveBeenCalledWith('/officer/complaint-details?id=101');
  });

});