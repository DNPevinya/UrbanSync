import React from 'react';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import OfficerComplaintDetails from '../src/pages/OfficerComplaintDetails';
import { BASE_URL } from '../src/config';

// Mock React Router navigation and search parameters
const mockNavigate = vi.fn();
let mockSearchParams = new URLSearchParams({ id: '123' });

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams],
}));

// Mock layout and modal components
vi.mock('../src/components/Sidebar', () => ({ default: () => <div data-testid="sidebar" /> }));
vi.mock('../src/components/Header', () => ({ default: () => <header data-testid="header" /> }));
vi.mock('../src/components/Footer', () => ({ default: () => <footer data-testid="footer" /> }));
vi.mock('../src/components/RejectComplaintModal', () => ({ 
  default: ({ isOpen, onClose }) => isOpen ? (
    <div data-testid="reject-modal">
      <button onClick={onClose} data-testid="close-reject-modal">Close</button>
    </div>
  ) : null 
}));

// Mock API calls and browser alerts
global.fetch = vi.fn();
global.alert = vi.fn();

// Mock API response data
const mockComplaint = {
  complaint_id: 123,
  status: 'PENDING',
  created_at: '2026-04-23T12:00:00Z',
  title: 'Broken Water Pipe',
  description: 'Massive water leak on Main St.',
  category: 'Water Supply Services',
  user_id: 456,
  location_text: 'Main St, Colombo',
  latitude: 6.9271,
  longitude: 79.8612,
  image_url: '/uploads/img1.jpg,/uploads/img2.jpg',
  admin_notes: 'Urgent attention required.'
};

describe('OfficerComplaintDetails Component', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams({ id: '123' }); 
    
    // Simulate a logged-in Officer
    const officerUser = { id: 2, role: 'officer', authorityName: 'Water Board', fullName: 'John Doe' };
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(officerUser));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the loading state initially', () => {
    // Simulate a pending API request to test loading state
    global.fetch.mockReturnValueOnce(new Promise(() => {}));
    
    render(<OfficerComplaintDetails />);
    expect(screen.getByText('Loading Complaint Details...')).toBeTruthy();
  });

  it('renders the complaint details successfully after fetching', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockComplaint })
    });

    render(<OfficerComplaintDetails />);

    await waitFor(() => {
      // Check if complaint details are displayed
      expect(screen.getByText('Complaint #CMP-123')).toBeTruthy();
      expect(screen.getByText('Broken Water Pipe')).toBeTruthy();
      expect(screen.getByText('Massive water leak on Main St.')).toBeTruthy();
      expect(screen.getByText('Water Supply Services')).toBeTruthy();
      
      // Check if internal admin notes are displayed
      expect(screen.getByText('Urgent attention required.')).toBeTruthy();
      expect(screen.getByText('Main St, Colombo')).toBeTruthy();
      
      // Check if images are rendered correctly
      const images = screen.getAllByRole('img');
      expect(images.length).toBe(2);
      expect(images[0].src).toContain('/uploads/img1.jpg');
    });
  });

  it('displays a fallback message if the API cannot find the complaint', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ success: false, message: 'Not found' })
    });

    render(<OfficerComplaintDetails />);

    await waitFor(() => {
      expect(screen.getByText('Complaint not found.')).toBeTruthy();
    });
  });

  it('shows the Reject & Escalate button when the status is PENDING', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { ...mockComplaint, status: 'PENDING' } })
    });

    render(<OfficerComplaintDetails />);

    await waitFor(() => {
      expect(screen.getByText('Reject & Escalate')).toBeTruthy();
    });
  });

  it('hides the Reject & Escalate button if the complaint is already RESOLVED', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { ...mockComplaint, status: 'RESOLVED' } })
    });

    render(<OfficerComplaintDetails />);

    await waitFor(() => {
      expect(screen.getByText('Complaint #CMP-123')).toBeTruthy();
      expect(screen.queryByText('Reject & Escalate')).toBeNull();
    });
  });

  it('hides the Reject & Escalate button if the complaint is already REJECTED', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { ...mockComplaint, status: 'REJECTED' } })
    });

    render(<OfficerComplaintDetails />);

    await waitFor(() => {
      expect(screen.getByText('Complaint #CMP-123')).toBeTruthy();
      expect(screen.queryByText('Reject & Escalate')).toBeNull();
    });
  });

  it('opens and closes the Reject modal', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockComplaint })
    });

    render(<OfficerComplaintDetails />);

    await waitFor(() => {
      expect(screen.getByText('Reject & Escalate')).toBeTruthy();
    });

    // Simulate clicking the Reject & Escalate button
    fireEvent.click(screen.getByText('Reject & Escalate'));
    expect(screen.getByTestId('reject-modal')).toBeTruthy();

    // Simulate closing the modal
    fireEvent.click(screen.getByTestId('close-reject-modal'));
    expect(screen.queryByTestId('reject-modal')).toBeNull();
  });

  it('successfully updates the complaint status and notifies the user', async () => {
    // Load complaint details
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockComplaint })
    });

    render(<OfficerComplaintDetails />);

    await waitFor(() => {
      expect(screen.getByText('Complaint #CMP-123')).toBeTruthy();
    });

    // Simulate changing the status dropdown
    const statusSelect = screen.getByRole('combobox');
    fireEvent.change(statusSelect, { target: { value: 'IN PROGRESS' } });

    // Mock successful API response for status update
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    // Simulate clicking the Apply Transition button
    const applyButton = screen.getByText('Apply Transition');
    fireEvent.click(applyButton);

    await waitFor(() => {
      // Check if API request contains correct payload
      expect(global.fetch).toHaveBeenCalledWith(`${BASE_URL}/api/complaints/update-status/123`, expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN PROGRESS' })
      }));
      
      // Check if success alert is shown
      expect(global.alert).toHaveBeenCalledWith("Status updated successfully!");
    });
  });

  it('displays an error alert if the status update fails to save to the database', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockComplaint })
    });

    render(<OfficerComplaintDetails />);

    await waitFor(() => {
      expect(screen.getByText('Complaint #CMP-123')).toBeTruthy();
    });

    const statusSelect = screen.getByRole('combobox');
    fireEvent.change(statusSelect, { target: { value: 'RESOLVED' } });

    // Simulate API failure on status update
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    fireEvent.click(screen.getByText('Apply Transition'));

    // Check if error alert is shown
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith("Failed to update status.");
    });
  });

  it('navigates backward in history when the back arrow is clicked', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockComplaint })
    });

    render(<OfficerComplaintDetails />);

    await waitFor(() => {
      expect(screen.getByText('Complaint #CMP-123')).toBeTruthy();
    });

    // Simulate clicking the back button
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);

    // Check if user is navigated backward in history
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});