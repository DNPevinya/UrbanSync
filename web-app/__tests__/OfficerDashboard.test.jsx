import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useNavigate } from 'react-router-dom';
import OfficerDashboard from '../src/pages/OfficerDashboard';
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
  },
  writable: true
});

// Mock API calls
global.fetch = vi.fn();

describe('OfficerDashboard Component', () => {

  // Mock Officer user session
  const mockOfficerUser = {
    id: 2,
    fullName: 'Jane Smith',
    authority_id: 15,
    authorityName: 'Electrical Dept',
    role: 'officer'
  };

  // Mock API response data
  const mockComplaints = [
    { complaint_id: 201, citizen_name: 'John Wick', citizen_phone: '555-0999', title: 'Power outage', status: 'PENDING' },
    { complaint_id: 202, citizen_name: 'Sarah Connor', citizen_phone: '555-0888', title: 'Sparking wire', status: 'IN PROGRESS' }
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
    render(<OfficerDashboard />);
    
    // Check if user is redirected to login
    expect(mockNavigate).toHaveBeenCalledWith('/login');
    
    // Check if API request is prevented
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('renders the initial loading state and layout correctly', () => {
    // Simulate a pending API request to test loading state
    global.fetch.mockReturnValue(new Promise(() => {})); 
    
    render(<OfficerDashboard />);
    
    // Check if header includes the officer's name and department
    expect(screen.getByTestId('header').textContent).toBe('Welcome, Officer Jane Smith | Electrical Dept');
    
    // Check if placeholder stats are shown
    expect(screen.getByText('Total Assigned Cases')).toBeTruthy();
    expect(screen.getByText('...')).toBeTruthy();
    
    // Check if loading text is shown in the table
    expect(screen.getByText('Syncing records...')).toBeTruthy();
  });

  it('fetches and displays the officer statistics and recent activity', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockComplaints })
    });

    render(<OfficerDashboard />);

    await waitFor(() => {
      // Check if API request uses the correct Authority ID
      expect(global.fetch).toHaveBeenCalledWith(`${BASE_URL}/api/complaints/authority/15`);
      
      // Check if total cases count is calculated accurately
      expect(screen.getByText('2')).toBeTruthy();
      
      // Check if recent complaints are rendered
      expect(screen.getByText('#CMP-201')).toBeTruthy();
      expect(screen.getByText('John Wick')).toBeTruthy();
      expect(screen.getByText('Power outage')).toBeTruthy();
      expect(screen.getByText('PENDING')).toBeTruthy();
      
      expect(screen.getByText('#CMP-202')).toBeTruthy();
      expect(screen.getByText('Sparking wire')).toBeTruthy();
    });
  });

  it('handles API failure gracefully by leaving the table empty without crashing', async () => {
    // Simulate an API network error
    global.fetch.mockRejectedValueOnce(new Error("Network Error"));

    render(<OfficerDashboard />);

    await waitFor(() => {
      expect(screen.queryByText('Syncing records...')).toBeNull();
      
      // Check if total cases count falls back to 0
      expect(screen.getByText('0')).toBeTruthy();
    });
  });

  it('navigates to the full workbox when the View Full Workbox button is clicked', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] })
    });

    render(<OfficerDashboard />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText('Syncing records...')).toBeNull();
    });

    const viewAllBtn = screen.getByText('View Full Workbox');
    fireEvent.click(viewAllBtn);

    // Check if user is navigated to complaints list
    expect(mockNavigate).toHaveBeenCalledWith('/officer/complaints');
  });

  it('navigates to specific complaint details when an action button is clicked', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockComplaints })
    });

    render(<OfficerDashboard />);

    await waitFor(() => {
      expect(screen.getByText('#CMP-201')).toBeTruthy();
    });

    // Select row action buttons
    const actionButtons = screen.getAllByRole('button').filter(btn => 
      !btn.textContent.includes('View Full Workbox') 
    );
    
    // Simulate clicking the first action button
    fireEvent.click(actionButtons[0]);

    // Check if user is navigated to complaint details page
    expect(mockNavigate).toHaveBeenCalledWith('/officer/complaint-details?id=201');
  });

});