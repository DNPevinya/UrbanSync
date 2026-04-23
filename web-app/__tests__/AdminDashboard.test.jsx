import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminDashboard from '../src/pages/AdminDashboard'; 

// 1. MOCK THE ROUTER (Now with useLocation!)
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    pathname: '/admin/dashboard', // Provides a fake current path
  }),
}));

// 2. MOCK CHILD COMPONENTS
// We mock these so we don't have to worry about what's inside Sidebar or Header
vi.mock('../src/components/Sidebar', () => ({ default: () => <div data-testid="sidebar" /> }));
vi.mock('../src/components/Header', () => ({ default: ({ title }) => <header>{title}</header> }));
vi.mock('../src/components/Footer', () => ({ default: () => <footer>Footer</footer> }));
vi.mock('../src/components/ReassignModal', () => ({ default: () => null }));
vi.mock('../src/components/DetailsModal', () => ({ default: () => null }));

// 3. MOCK FETCH & LOCAL STORAGE
global.fetch = vi.fn();

describe('AdminDashboard Component', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: Mock an Admin user in LocalStorage
    const adminUser = { id: 1, role: 'super_admin' };
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(adminUser));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  // --- 1. SECURITY & ACCESS TESTS ---
  it('redirects to login if no user is found in localStorage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    render(<AdminDashboard />);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('redirects to officer dashboard if user is not a super_admin', () => {
    const officerUser = { id: 2, role: 'officer' };
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(officerUser));
    render(<AdminDashboard />);
    expect(mockNavigate).toHaveBeenCalledWith('/officer/dashboard');
  });

  // --- 2. DATA LOADING & RENDERING ---
  it('fetches and displays stats and recent complaints', async () => {
    // Mock the 3 Promise.all API calls
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

    // Check if Stats cards render the numbers
    await waitFor(() => {
      expect(screen.getByText('100')).toBeTruthy();
      expect(screen.getByText('10')).toBeTruthy();
    });

    // Check if the Table renders the mocked complaint ID
    expect(screen.getByText('#CMP-123')).toBeTruthy();
    expect(screen.getByText('Broken Pipe')).toBeTruthy();
  });

  // --- 3. LOADING STATE TEST ---
  it('shows the Syncing... state while data is loading', () => {
    global.fetch.mockReturnValue(new Promise(() => {})); // Never resolves
    render(<AdminDashboard />);
    expect(screen.getByText('Syncing...')).toBeTruthy();
  });
});