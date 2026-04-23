import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useNavigate } from 'react-router-dom';
import OfficerDashboard from '../src/pages/OfficerDashboard';

// Intercept routing so we can verify if unauthorized users are correctly redirected
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Stub out the standard layout components to keep the test DOM clean and focused strictly on the dashboard logic
vi.mock('../src/components/Sidebar', () => ({ default: () => <div data-testid="sidebar" /> }));
vi.mock('../src/components/Header', () => ({ default: ({ title }) => <header data-testid="header">{title}</header> }));
vi.mock('../src/components/Footer', () => ({ default: () => <footer data-testid="footer" /> }));

// Replace the browser's native localStorage so we can simulate active user sessions
Object.defineProperty(window, 'localStorage', {
  value: { 
    getItem: vi.fn(),
  },
  writable: true
});

// Intercept network requests to prevent the test runner from pinging a real backend
global.fetch = vi.fn();

describe('OfficerDashboard Component', () => {

  // Dummy user profile representing a standard department officer
  const mockOfficerUser = {
    id: 2,
    fullName: 'Jane Smith',
    authority_id: 15,
    authorityName: 'Electrical Dept',
    role: 'officer'
  };

  // Dummy data representing recent complaints assigned to this officer's department
  const mockComplaints = [
    { complaint_id: 201, citizen_name: 'John Wick', citizen_phone: '555-0999', title: 'Power outage', status: 'PENDING' },
    { complaint_id: 202, citizen_name: 'Sarah Connor', citizen_phone: '555-0888', title: 'Sparking wire', status: 'IN PROGRESS' }
  ];

  beforeEach(() => {
    // Start fresh before every test to prevent mock state bleeding
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
    render(<OfficerDashboard />);
    
    // Verify the component protected the route
    expect(mockNavigate).toHaveBeenCalledWith('/login');
    
    // Ensure it didn't waste resources trying to fetch data for an unauthorized user
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('renders the initial loading state and layout correctly', () => {
    // Force the fetch promise to hang forever so we can catch the loading UI in action
    global.fetch.mockReturnValue(new Promise(() => {})); 
    
    render(<OfficerDashboard />);
    
    // Verify the component successfully grabbed the officer's info from local storage 
    // and injected it into the Header title
    expect(screen.getByTestId('header').textContent).toBe('Welcome, Officer Jane Smith | Electrical Dept');
    
    // Verify the UI shows placeholder dots for stats while waiting for the network
    expect(screen.getByText('Total Assigned Cases')).toBeTruthy();
    expect(screen.getByText('...')).toBeTruthy();
    
    // Verify the table shows the syncing indicator
    expect(screen.getByText('Syncing records...')).toBeTruthy();
  });

  it('fetches and displays the officer statistics and recent activity', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockComplaints })
    });

    render(<OfficerDashboard />);

    await waitFor(() => {
      // Verify it dynamically requested data for Authority ID 15
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/complaints/authority/15');
      
      // Verify the total cases count updated correctly based on the returned array
      expect(screen.getByText('2')).toBeTruthy();
      
      // Verify the recent activity table mapped our dummy data to rows
      expect(screen.getByText('#CMP-201')).toBeTruthy();
      expect(screen.getByText('John Wick')).toBeTruthy();
      expect(screen.getByText('Power outage')).toBeTruthy();
      expect(screen.getByText('PENDING')).toBeTruthy();
      
      expect(screen.getByText('#CMP-202')).toBeTruthy();
      expect(screen.getByText('Sparking wire')).toBeTruthy();
    });
  });

  it('handles API failure gracefully by leaving the table empty without crashing', async () => {
    // Force a network crash
    global.fetch.mockRejectedValueOnce(new Error("Network Error"));

    render(<OfficerDashboard />);

    await waitFor(() => {
      expect(screen.queryByText('Syncing records...')).toBeNull();
      
      // The total count should safely fall back to 0 instead of throwing an undefined error
      expect(screen.getByText('0')).toBeTruthy();
    });
  });

  it('navigates to the full workbox when the View Full Workbox button is clicked', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] })
    });

    render(<OfficerDashboard />);

    // Wait for the data to settle
    await waitFor(() => {
      expect(screen.queryByText('Syncing records...')).toBeNull();
    });

    const viewAllBtn = screen.getByText('View Full Workbox');
    fireEvent.click(viewAllBtn);

    // Verify it told the router to go to the main complaints list
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

    // The action buttons in the rows don't have text, so we filter out the explicit "View Full Workbox" 
    // header button to ensure we only grab the interactive row buttons.
    const actionButtons = screen.getAllByRole('button').filter(btn => 
      !btn.textContent.includes('View Full Workbox') 
    );
    
    // Simulate clicking the first row's action button (CMP-201)
    fireEvent.click(actionButtons[0]);

    // Verify it passed the correct ID via query param
    expect(mockNavigate).toHaveBeenCalledWith('/officer/complaint-details?id=201');
  });

});