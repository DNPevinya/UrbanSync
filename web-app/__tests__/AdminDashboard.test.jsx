import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminDashboard from '../src/pages/AdminDashboard'; 

// Intercept routing hooks so we can track where the app tries to redirect users.
// We also fake useLocation to simulate the current active route for the sidebar/header logic.
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    pathname: '/admin/dashboard', 
  }),
}));

// Stub out the layout wrappers and modals. 
// We do this to keep the test focused strictly on the dashboard's internal logic 
// rather than rendering the entire app's DOM tree.
vi.mock('../src/components/Sidebar', () => ({ default: () => <div data-testid="sidebar" /> }));
vi.mock('../src/components/Header', () => ({ default: ({ title }) => <header>{title}</header> }));
vi.mock('../src/components/Footer', () => ({ default: () => <footer>Footer</footer> }));
vi.mock('../src/components/ReassignModal', () => ({ default: () => null }));
vi.mock('../src/components/DetailsModal', () => ({ default: () => null }));

// Intercept network requests so we don't hit the real database
global.fetch = vi.fn();

describe('AdminDashboard Component', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // By default, pretend a Super Admin is logged in so the dashboard renders normally
    const adminUser = { id: 1, role: 'super_admin' };
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(adminUser));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('redirects to the login page if no user session is found in localStorage', () => {
    // Override the default setup to simulate a logged-out state
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    render(<AdminDashboard />);
    
    // Verify the route protection kicked in
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('redirects to the standard officer dashboard if the user lacks super_admin privileges', () => {
    // Override setup to simulate a regular officer trying to hit the admin URL
    const officerUser = { id: 2, role: 'officer' };
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(officerUser));
    render(<AdminDashboard />);
    
    // Verify they were kicked back to their appropriate workspace
    expect(mockNavigate).toHaveBeenCalledWith('/officer/dashboard');
  });

  it('fetches and displays the top-level stats and recent complaints table', async () => {
    // The dashboard fires three simultaneous API calls on mount via Promise.all.
    // We must queue up three mock responses in the exact order the component expects them.
    global.fetch
      .mockResolvedValueOnce({ 
        ok: true,
        json: () => Promise.resolve({ success: true, data: { total: 100, pending: 10, active: 40, resolved: 50 } })
      })
      .mockResolvedValueOnce({ 
        ok: true,
        json: () => Promise.resolve({ success: true, data: [{ name: 'Police', total_cases: 5 }] })
      })
      .mockResolvedValueOnce({ 
        ok: true,
        json: () => Promise.resolve({ success: true, data: [{ complaint_id: 123, title: 'Broken Pipe', status: 'PENDING' }] })
      });

    render(<AdminDashboard />);

    // Wait for the data to process and verify the stat cards updated
    await waitFor(() => {
      expect(screen.getByText('100')).toBeTruthy();
      expect(screen.getByText('10')).toBeTruthy();
    });

    // Verify the recent complaints table mapped our dummy data correctly
    expect(screen.getByText('#CMP-123')).toBeTruthy();
    expect(screen.getByText('Broken Pipe')).toBeTruthy();
  });

  it('shows the Syncing... loading state while data is being fetched', () => {
    // Force the fetch promise to hang forever so the loading state stays on screen
    global.fetch.mockReturnValue(new Promise(() => {})); 
    
    render(<AdminDashboard />);
    
    expect(screen.getByText('Syncing...')).toBeTruthy();
  });
});