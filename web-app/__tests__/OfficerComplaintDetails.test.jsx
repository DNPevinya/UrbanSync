import React from 'react';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import OfficerComplaintDetails from '../src/pages/OfficerComplaintDetails';

// Intercept routing hooks. 
// Note: This specific component grabs the ID from the query string (?id=123) using useSearchParams, 
// rather than a URL parameter (/123) with useParams. We mock it accordingly here.
const mockNavigate = vi.fn();
let mockSearchParams = new URLSearchParams({ id: '123' });

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams],
}));

// Leave out the layout wrappers and the rejection modal. 
// We pass through the onClose prop to the dummy modal so we can test if the parent controls its visibility correctly.
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

// Intercept network requests and native browser alerts so we don't hit real APIs or freeze the test runner
global.fetch = vi.fn();
global.alert = vi.fn();

// A robust dummy complaint to feed the UI
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
    
    // Pretend a standard officer is logged in
    const officerUser = { id: 2, role: 'officer', authorityName: 'Water Board', fullName: 'John Doe' };
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(officerUser));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the loading state initially', () => {
    // Force the fetch promise to hang forever so we can catch the loading UI in action
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
      // Verify core text data rendered
      expect(screen.getByText('Complaint #CMP-123')).toBeTruthy();
      expect(screen.getByText('Broken Water Pipe')).toBeTruthy();
      expect(screen.getByText('Massive water leak on Main St.')).toBeTruthy();
      expect(screen.getByText('Water Supply Services')).toBeTruthy();
      
      // Verify internal admin notes are visible to the officer
      expect(screen.getByText('Urgent attention required.')).toBeTruthy();
      expect(screen.getByText('Main St, Colombo')).toBeTruthy();
      
      // Verify the component correctly split the comma-separated image string into multiple image tags
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

    // Tap the Escalate button
    fireEvent.click(screen.getByText('Reject & Escalate'));
    expect(screen.getByTestId('reject-modal')).toBeTruthy();

    // Close our dummy modal
    fireEvent.click(screen.getByTestId('close-reject-modal'));
    expect(screen.queryByTestId('reject-modal')).toBeNull();
  });

  it('successfully updates the complaint status and notifies the user', async () => {
    // 1. Initial load
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockComplaint }) // Starts as PENDING
    });

    render(<OfficerComplaintDetails />);

    await waitFor(() => {
      expect(screen.getByText('Complaint #CMP-123')).toBeTruthy();
    });

    // 2. Simulate the officer changing the status dropdown
    const statusSelect = screen.getByRole('combobox');
    fireEvent.change(statusSelect, { target: { value: 'IN PROGRESS' } });

    // 3. Prep the mock for the PATCH request that saves the change
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    // 4. Hit save
    const applyButton = screen.getByText('Apply Transition');
    fireEvent.click(applyButton);

    await waitFor(() => {
      // Verify the network request was formatted perfectly
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/complaints/update-status/123', expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN PROGRESS' })
      }));
      
      // Verify the success popup fired
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

    // Force the PATCH request to fail
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    fireEvent.click(screen.getByText('Apply Transition'));

    // Verify the UI catches the error and informs the user
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

    // Grab the back arrow button (which is the first button in the header) and click it
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);

    // Verify it told the router to go back one step
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});