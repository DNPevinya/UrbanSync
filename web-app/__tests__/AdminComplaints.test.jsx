import React from 'react';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import AdminComplaints from '../src/pages/AdminComplaints';

// Mock React Router navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock layout components
vi.mock('../src/components/Sidebar', () => ({ default: () => <div data-testid="sidebar" /> }));
vi.mock('../src/components/Header', () => ({ default: () => <header data-testid="header" /> }));
vi.mock('../src/components/Footer', () => ({ default: () => <footer data-testid="footer" /> }));

// Mock modal components to verify visibility
vi.mock('../src/components/ReassignModal', () => ({ 
  default: ({ isOpen, onClose }) => isOpen ? (
    <div data-testid="reassign-modal">
      <button onClick={onClose} data-testid="close-reassign">Close</button>
    </div>
  ) : null 
}));
vi.mock('../src/components/DetailsModal', () => ({ 
  default: ({ isOpen, onClose }) => isOpen ? (
    <div data-testid="details-modal">
      <button onClick={onClose} data-testid="close-details">Close</button>
    </div>
  ) : null 
}));
vi.mock('../src/components/DeleteComplaintModal', () => ({ 
  default: ({ isOpen, onClose }) => isOpen ? (
    <div data-testid="delete-modal">
      <button onClick={onClose} data-testid="close-delete">Close</button>
    </div>
  ) : null 
}));

// Mock API calls
global.fetch = vi.fn();

// Mock API response data
const mockStats = { total: 100, pending: 10, active: 40, resolved: 50 };
const mockComplaints = [
  { complaint_id: 101, title: 'Massive Pipe Leak', category: 'Water Supply Services', status: 'PENDING', authority_name: null, created_at: '2023-10-01' },
  { complaint_id: 102, title: 'Broken Streetlight', category: 'Public Safety & Law Enforcement', status: 'RESOLVED', authority_name: 'Police', created_at: '2023-10-02' },
  { complaint_id: 103, title: 'Deep Pothole', category: 'Urban Infrastructure & Municipal Services', status: 'IN PROGRESS', authority_name: 'City Council', created_at: '2023-10-03' },
];

describe('AdminComplaints Component', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Simulate a logged-in Super Admin user
    const adminUser = { id: 1, role: 'super_admin' };
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(adminUser));

    // Mock API responses for stats and complaints
    global.fetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockStats })
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockComplaints })
      });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('redirects to login if no user is found in localStorage', () => {
    // Simulate a logged-out user
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    render(<AdminComplaints />);
    
    // Check if the user is redirected to login
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('redirects to the standard officer dashboard if the user lacks super_admin privileges', () => {
    // Simulate an officer accessing the admin panel
    const officerUser = { id: 2, role: 'officer' };
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(officerUser));
    render(<AdminComplaints />);
    
    // Check if the officer is redirected to their dashboard
    expect(mockNavigate).toHaveBeenCalledWith('/officer/dashboard');
  });

  it('shows the loading state initially and then renders the populated complaint table', async () => {
    render(<AdminComplaints />);
    
    expect(screen.getByText('Loading Master List...')).toBeTruthy();

    await waitFor(() => {
      // Check if complaints are rendered in the table
      expect(screen.getByText('#CMP-101')).toBeTruthy();
      expect(screen.getByText('Massive Pipe Leak')).toBeTruthy();
      expect(screen.getByText('#CMP-102')).toBeTruthy();
      expect(screen.getByText('#CMP-103')).toBeTruthy();
    });
  });

  it('filters complaints correctly using the text search bar (by Title or ID)', async () => {
    render(<AdminComplaints />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Massive Pipe Leak')).toBeTruthy();
    });

    const searchInput = screen.getByPlaceholderText('Search Subject or ID...');
    
    // Test searching by title
    fireEvent.change(searchInput, { target: { value: 'Pothole' } });
    expect(screen.queryByText('Massive Pipe Leak')).toBeNull();
    expect(screen.getByText('Deep Pothole')).toBeTruthy();

    // Test searching by ID
    fireEvent.change(searchInput, { target: { value: '101' } });
    expect(screen.getByText('Massive Pipe Leak')).toBeTruthy();
    expect(screen.queryByText('Deep Pothole')).toBeNull();
  });

  it('filters complaints when a specific Category is selected from the dropdown', async () => {
    render(<AdminComplaints />);

    await waitFor(() => {
      expect(screen.getByText('Massive Pipe Leak')).toBeTruthy();
    });

    // Simulate filtering by category
    const categorySelect = screen.getAllByRole('combobox')[0]; 
    fireEvent.change(categorySelect, { target: { value: 'Water Supply Services' } });

    // Check if complaints are filtered correctly
    expect(screen.getByText('Massive Pipe Leak')).toBeTruthy();
    expect(screen.queryByText('Deep Pothole')).toBeNull();
  });

  it('filters complaints when a specific Status is selected from the dropdown', async () => {
    render(<AdminComplaints />);

    await waitFor(() => {
      expect(screen.getByText('Massive Pipe Leak')).toBeTruthy();
    });

    // Simulate filtering by status
    const statusSelect = screen.getAllByRole('combobox')[1]; 
    fireEvent.change(statusSelect, { target: { value: 'RESOLVED' } });

    // Check if only resolved complaints are shown
    expect(screen.getByText('Broken Streetlight')).toBeTruthy();
    expect(screen.queryByText('Massive Pipe Leak')).toBeNull();
  });

  it('clears all active filters when the Clear button is clicked', async () => {
    render(<AdminComplaints />);

    await waitFor(() => {
      expect(screen.getByText('Massive Pipe Leak')).toBeTruthy();
    });

    // Simulate an empty search result
    const searchInput = screen.getByPlaceholderText('Search Subject or ID...');
    fireEvent.change(searchInput, { target: { value: 'Nonexistent' } });
    expect(screen.queryByText('Massive Pipe Leak')).toBeNull();

    // Simulate clicking the clear filter button
    fireEvent.click(screen.getByText('Clear'));

    // Check if all complaints are visible again
    expect(screen.getByText('Massive Pipe Leak')).toBeTruthy();
    expect(screen.getByText('Deep Pothole')).toBeTruthy();
  });

  it('opens and closes the Details modal', async () => {
    render(<AdminComplaints />);

    await waitFor(() => {
      expect(screen.getAllByText('View Details').length).toBe(3);
    });

    // Simulate clicking the View Details button
    fireEvent.click(screen.getAllByText('View Details')[0]);
    expect(screen.getByTestId('details-modal')).toBeTruthy();

    // Simulate closing the modal
    fireEvent.click(screen.getByTestId('close-details'));
    expect(screen.queryByTestId('details-modal')).toBeNull();
  });

  it('opens and closes the Reassign modal', async () => {
    render(<AdminComplaints />);

    await waitFor(() => {
      expect(screen.getAllByText('Reassign').length).toBe(3);
    });

    // Simulate clicking the Reassign button
    fireEvent.click(screen.getAllByText('Reassign')[0]);
    expect(screen.getByTestId('reassign-modal')).toBeTruthy();

    fireEvent.click(screen.getByTestId('close-reassign'));
    expect(screen.queryByTestId('reassign-modal')).toBeNull();
  });

  it('opens and closes the Delete modal', async () => {
    render(<AdminComplaints />);

    await waitFor(() => {
      // Find delete buttons by title
      expect(screen.getAllByTitle('Delete Complaint').length).toBe(3);
    });

    // Simulate clicking the delete button
    fireEvent.click(screen.getAllByTitle('Delete Complaint')[0]);
    expect(screen.getByTestId('delete-modal')).toBeTruthy();

    fireEvent.click(screen.getByTestId('close-delete'));
    expect(screen.queryByTestId('delete-modal')).toBeNull();
  });

});