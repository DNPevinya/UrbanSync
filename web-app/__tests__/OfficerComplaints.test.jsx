import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import OfficerComplaints from '../src/pages/OfficerComplaints';
import { BASE_URL } from '../src/config';

// Mock React Router navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock layout components
vi.mock('../src/components/Sidebar', () => ({ default: () => <div data-testid="sidebar" /> }));
vi.mock('../src/components/Header', () => ({ default: ({ title }) => <header data-testid="header">{title}</header> }));
vi.mock('../src/components/Footer', () => ({ default: () => <footer data-testid="footer" /> }));

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: { 
    getItem: vi.fn(),
    setItem: vi.fn() 
  },
  writable: true
});

// Mock API calls
global.fetch = vi.fn();

describe('OfficerComplaints Component', () => {

  // Mock Officer user session
  const mockOfficerUser = {
    id: 1,
    fullName: 'Jane Officer',
    authority_id: 10,
    authorityName: 'Water Board',
    role: 'officer'
  };

  // Mock API response data
  const mockComplaints = [
    { complaint_id: 101, citizen_name: 'Alex Doe', citizen_phone: '555-0100', title: 'Leaking pipe on main st', status: 'PENDING' },
    { complaint_id: 102, citizen_name: 'Sam Smith', citizen_phone: '555-0200', title: 'No water pressure', status: 'IN PROGRESS' },
    { complaint_id: 103, citizen_name: 'Charlie Brown', citizen_phone: '555-0300', title: 'Contaminated supply', status: 'RESOLVED' }
  ];

  beforeEach(() => {
    // Clear mock data before each test
    vi.clearAllMocks();
    
    // Simulate a logged-in Officer
    window.localStorage.getItem.mockReturnValue(JSON.stringify(mockOfficerUser));
  });

  afterEach(() => {
    // Clean up rendered components after each test
    cleanup();
  });

  it('redirects to the login page if no user session is found in localStorage', () => {
    // Simulate a logged-out user
    window.localStorage.getItem.mockReturnValue(null);
    render(<OfficerComplaints />);
    
    // Check if user is redirected to login
    expect(mockNavigate).toHaveBeenCalledWith('/login');
    
    // Check if API request is prevented
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('renders correctly and sets up the layout using the officer context', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] })
    });

    render(<OfficerComplaints />);
    
    // Check if static UI elements are rendered
    expect(screen.getByText('Assigned Workbox')).toBeTruthy();
    expect(screen.getByTestId('sidebar')).toBeTruthy();
    expect(screen.getByTestId('footer')).toBeTruthy();
    
    // Check if header title includes officer's department
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
      // Check if API call targets the correct Authority ID
      expect(global.fetch).toHaveBeenCalledWith(`${BASE_URL}/api/complaints/authority/10`);
      
      // Check if complaint data is rendered in the table
      expect(screen.getByText('#CMP-101')).toBeTruthy();
      expect(screen.getByText('Leaking pipe on main st')).toBeTruthy();
      
      expect(screen.getByText('#CMP-102')).toBeTruthy();
      expect(screen.getByText('No water pressure')).toBeTruthy();
    });
  });

  it('handles API failure gracefully without crashing the app', async () => {
    // Simulate an API network error
    global.fetch.mockRejectedValueOnce(new Error('API Down'));

    render(<OfficerComplaints />);

    await waitFor(() => {
      // Check if table headers are visible
      expect(screen.getByText('Complaint ID')).toBeTruthy();
      
      // Check if table body is empty
      expect(screen.queryByText('#CMP-101')).toBeNull();
    });
  });

  it('filters complaints dynamically using a unified search query (Title, ID, or Citizen Info)', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockComplaints })
    });

    render(<OfficerComplaints />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('#CMP-101')).toBeTruthy();
    });

    const searchInput = screen.getByPlaceholderText('Search by ID, Name or Phone...');
    
    // Test searching by complaint title
    fireEvent.change(searchInput, { target: { value: 'pressure' } });
    expect(screen.queryByText('#CMP-101')).toBeNull();
    expect(screen.getByText('#CMP-102')).toBeTruthy();

    // Test searching by citizen's name
    fireEvent.change(searchInput, { target: { value: 'Alex' } });
    expect(screen.getByText('#CMP-101')).toBeTruthy();
    expect(screen.queryByText('#CMP-102')).toBeNull();

    // Test searching by complaint ID
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
    
    // Filter by Pending status
    fireEvent.change(statusDropdown, { target: { value: 'Pending' } });
    
    // Check if filtered results are displayed correctly
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

    // Simulate clicking the action button
    const actionButtons = screen.getAllByRole('button');
    fireEvent.click(actionButtons[0]);

    // Check if user is navigated to complaint details page
    expect(mockNavigate).toHaveBeenCalledWith('/officer/complaint-details?id=101');
  });

});