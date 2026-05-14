import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminDashboard from '../src/pages/AdminDashboard'; 

// Mock React Router navigation and location
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    pathname: '/admin/dashboard', 
  }),
}));

// Mock layout and modal components
vi.mock('../src/components/Sidebar', () => ({ default: () => <div data-testid="sidebar" /> }));
vi.mock('../src/components/Header', () => ({ default: ({ title }) => <header>{title}</header> }));
vi.mock('../src/components/Footer', () => ({ default: () => <footer>Footer</footer> }));
vi.mock('../src/components/ReassignModal', () => ({ default: () => null }));
vi.mock('../src/components/DetailsModal', () => ({ default: () => null }));

// Mock API calls
global.fetch = vi.fn();

describe('AdminDashboard Component', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Simulate a logged-in Super Admin user
    const adminUser = { id: 1, role: 'super_admin' };
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(adminUser));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('redirects to the login page if no user session is found in localStorage', () => {
    // Simulate a logged-out user
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    render(<AdminDashboard />);
    
    // Check if user is redirected to login
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('redirects to the standard officer dashboard if the user lacks super_admin privileges', () => {
    // Simulate an officer accessing the admin panel
    const officerUser = { id: 2, role: 'officer' };
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(officerUser));
    render(<AdminDashboard />);
    
    // Check if officer is redirected to their dashboard
    expect(mockNavigate).toHaveBeenCalledWith('/officer/dashboard');
  });

  it('fetches and displays the top-level stats and recent complaints table', async () => {
    // Mock three API responses in the required order
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

    // Check if statistics are updated
    await waitFor(() => {
      expect(screen.getByText('100')).toBeTruthy();
      expect(screen.getByText('10')).toBeTruthy();
    });

    // Check if recent complaints are displayed
    expect(screen.getByText('#CMP-123')).toBeTruthy();
    expect(screen.getByText('Broken Pipe')).toBeTruthy();
  });

  it('shows the Syncing... loading state while data is being fetched', () => {
    // Simulate a pending API request to test loading state
    global.fetch.mockReturnValue(new Promise(() => {})); 
    
    render(<AdminDashboard />);
    
    expect(screen.getByText('Syncing...')).toBeTruthy();
  });
});