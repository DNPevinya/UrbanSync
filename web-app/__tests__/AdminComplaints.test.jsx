import React from 'react';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import AdminComplaints from '../src/pages/AdminComplaints';

// Intercept the router so we can test if the component kicks unauthorized users out
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Stub out the standard layout components so the DOM isn't cluttered
vi.mock('../src/components/Sidebar', () => ({ default: () => <div data-testid="sidebar" /> }));
vi.mock('../src/components/Header', () => ({ default: () => <header data-testid="header" /> }));
vi.mock('../src/components/Footer', () => ({ default: () => <footer data-testid="footer" /> }));

// Replace the complex modal components with simple dummy divs.
// We pass through the `isOpen` and `onClose` props to test if the parent controls them correctly.
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

// Intercept network requests
global.fetch = vi.fn();

// Dummy data matching the shape of the expected backend response
const mockStats = { total: 100, pending: 10, active: 40, resolved: 50 };
const mockComplaints = [
  { complaint_id: 101, title: 'Massive Pipe Leak', category: 'Water Supply Services', status: 'PENDING', authority_name: null, created_at: '2023-10-01' },
  { complaint_id: 102, title: 'Broken Streetlight', category: 'Public Safety & Law Enforcement', status: 'RESOLVED', authority_name: 'Police', created_at: '2023-10-02' },
  { complaint_id: 103, title: 'Deep Pothole', category: 'Urban Infrastructure & Municipal Services', status: 'IN PROGRESS', authority_name: 'City Council', created_at: '2023-10-03' },
];

describe('AdminComplaints Component', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    
    // By default, pretend a Super Admin is logged in so the component renders normally
    const adminUser = { id: 1, role: 'super_admin' };
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(adminUser));

    // The component fetches stats and then the complaint list on mount
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
    // Override our default setup to simulate a logged-out state
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    render(<AdminComplaints />);
    
    // Verify the component protected the route
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('redirects to the standard officer dashboard if the user lacks super_admin privileges', () => {
    // Override setup to simulate a standard officer trying to access the master admin panel
    const officerUser = { id: 2, role: 'officer' };
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(officerUser));
    render(<AdminComplaints />);
    
    // Verify they were kicked back to their appropriate dashboard
    expect(mockNavigate).toHaveBeenCalledWith('/officer/dashboard');
  });

  it('shows the loading state initially and then renders the populated complaint table', async () => {
    render(<AdminComplaints />);
    
    expect(screen.getByText('Loading Master List...')).toBeTruthy();

    await waitFor(() => {
      // Check if all our dummy complaints made it into the table
      expect(screen.getByText('#CMP-101')).toBeTruthy();
      expect(screen.getByText('Massive Pipe Leak')).toBeTruthy();
      expect(screen.getByText('#CMP-102')).toBeTruthy();
      expect(screen.getByText('#CMP-103')).toBeTruthy();
    });
  });

  it('filters complaints correctly using the text search bar (by Title or ID)', async () => {
    render(<AdminComplaints />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Massive Pipe Leak')).toBeTruthy();
    });

    const searchInput = screen.getByPlaceholderText('Search Subject or ID...');
    
    // Test title matching
    fireEvent.change(searchInput, { target: { value: 'Pothole' } });
    expect(screen.queryByText('Massive Pipe Leak')).toBeNull();
    expect(screen.getByText('Deep Pothole')).toBeTruthy();

    // Test ID matching
    fireEvent.change(searchInput, { target: { value: '101' } });
    expect(screen.getByText('Massive Pipe Leak')).toBeTruthy();
    expect(screen.queryByText('Deep Pothole')).toBeNull();
  });

  it('filters complaints when a specific Category is selected from the dropdown', async () => {
    render(<AdminComplaints />);

    await waitFor(() => {
      expect(screen.getByText('Massive Pipe Leak')).toBeTruthy();
    });

    // Grab the first dropdown (Category) and simulate selecting the Water department
    const categorySelect = screen.getAllByRole('combobox')[0]; 
    fireEvent.change(categorySelect, { target: { value: 'Water Supply Services' } });

    // Ensure it hid the pothole complaint
    expect(screen.getByText('Massive Pipe Leak')).toBeTruthy();
    expect(screen.queryByText('Deep Pothole')).toBeNull();
  });

  it('filters complaints when a specific Status is selected from the dropdown', async () => {
    render(<AdminComplaints />);

    await waitFor(() => {
      expect(screen.getByText('Massive Pipe Leak')).toBeTruthy();
    });

    // Grab the second dropdown (Status) and select RESOLVED
    const statusSelect = screen.getAllByRole('combobox')[1]; 
    fireEvent.change(statusSelect, { target: { value: 'RESOLVED' } });

    // Only the Broken Streetlight should remain
    expect(screen.getByText('Broken Streetlight')).toBeTruthy();
    expect(screen.queryByText('Massive Pipe Leak')).toBeNull();
  });

  it('clears all active filters when the Clear button is clicked', async () => {
    render(<AdminComplaints />);

    await waitFor(() => {
      expect(screen.getByText('Massive Pipe Leak')).toBeTruthy();
    });

    // Intentionally break the list by searching for garbage
    const searchInput = screen.getByPlaceholderText('Search Subject or ID...');
    fireEvent.change(searchInput, { target: { value: 'Nonexistent' } });
    expect(screen.queryByText('Massive Pipe Leak')).toBeNull();

    // Hit the clear button
    fireEvent.click(screen.getByText('Clear'));

    // Verify the original list was restored
    expect(screen.getByText('Massive Pipe Leak')).toBeTruthy();
    expect(screen.getByText('Deep Pothole')).toBeTruthy();
  });

  it('opens and closes the Details modal', async () => {
    render(<AdminComplaints />);

    await waitFor(() => {
      expect(screen.getAllByText('View Details').length).toBe(3);
    });

    // Tap the View Details button on the first row
    fireEvent.click(screen.getAllByText('View Details')[0]);
    expect(screen.getByTestId('details-modal')).toBeTruthy();

    // Close the dummy modal
    fireEvent.click(screen.getByTestId('close-details'));
    expect(screen.queryByTestId('details-modal')).toBeNull();
  });

  it('opens and closes the Reassign modal', async () => {
    render(<AdminComplaints />);

    await waitFor(() => {
      expect(screen.getAllByText('Reassign').length).toBe(3);
    });

    // Tap the Reassign button on the first row
    fireEvent.click(screen.getAllByText('Reassign')[0]);
    expect(screen.getByTestId('reassign-modal')).toBeTruthy();

    fireEvent.click(screen.getByTestId('close-reassign'));
    expect(screen.queryByTestId('reassign-modal')).toBeNull();
  });

  it('opens and closes the Delete modal', async () => {
    render(<AdminComplaints />);

    await waitFor(() => {
      // The delete button is an icon without text, so we target its accessibility title
      expect(screen.getAllByTitle('Delete Complaint').length).toBe(3);
    });

    // Tap the Trash icon on the first row
    fireEvent.click(screen.getAllByTitle('Delete Complaint')[0]);
    expect(screen.getByTestId('delete-modal')).toBeTruthy();

    fireEvent.click(screen.getByTestId('close-delete'));
    expect(screen.queryByTestId('delete-modal')).toBeNull();
  });

});