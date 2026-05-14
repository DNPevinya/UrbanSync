import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import AdminOfficerManagement from '../src/pages/AdminOfficerManagement';

// Mock layout components
vi.mock('../src/components/Sidebar', () => ({ default: () => <div data-testid="sidebar" /> }));
vi.mock('../src/components/Header', () => ({ default: () => <header data-testid="header" /> }));
vi.mock('../src/components/Footer', () => ({ default: () => <footer data-testid="footer" /> }));

// Mock modal components to verify visibility
vi.mock('../src/components/AddOfficerModal', () => ({ 
  default: ({ isOpen }) => isOpen ? <div data-testid="add-modal" /> : null 
}));
vi.mock('../src/components/EditOfficerModal', () => ({ 
  default: ({ isOpen }) => isOpen ? <div data-testid="edit-modal" /> : null 
}));
vi.mock('../src/components/DeleteOfficerModal', () => ({ 
  default: ({ isOpen }) => isOpen ? <div data-testid="delete-modal" /> : null 
}));

// Mock API calls
global.fetch = vi.fn();

describe('AdminOfficerManagement Component', () => {

  // Mock API response data
  const mockOfficers = [
    { user_id: 1, full_name: 'John Doe', email: 'john@example.com', employee_id_code: 'EMP001', authority_id: 10, authority_name: 'Water Board', status: 'Active' },
    { user_id: 2, full_name: 'Jane Smith', email: 'jane@example.com', employee_id_code: 'EMP002', authority_id: 11, authority_name: 'Electricity Board', status: 'Inactive' }
  ];

  const mockAuthorities = [
    { authority_id: 10, name: 'Water Board' },
    { authority_id: 11, name: 'Electricity Board' }
  ];

  beforeEach(() => {
    // Clear mock data before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders correctly and shows the syncing state initially', () => {
    // Simulate a pending API request to test loading state
    global.fetch.mockReturnValue(new Promise(() => {}));
    
    render(<AdminOfficerManagement />);
    
    // Check static UI text
    expect(screen.getByText('Officer Management')).toBeTruthy();
    expect(screen.getByText('Manage department officers, system access levels, and credentials.')).toBeTruthy();
    
    // Check if loading state is displayed initially
    expect(screen.getByText('Syncing database...')).toBeTruthy();
    
    // Check if layout components are rendered
    expect(screen.getByTestId('sidebar')).toBeTruthy();
    expect(screen.getByTestId('header')).toBeTruthy();
    expect(screen.getByTestId('footer')).toBeTruthy();
  });

  it('fetches and displays officers and authorities successfully', async () => {
    // Mock two API responses in the required order
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockOfficers })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockAuthorities })
      });

    render(<AdminOfficerManagement />);

    await waitFor(() => {
      // Check if officers are rendered in the table
      expect(screen.getByText('John Doe')).toBeTruthy();
      expect(screen.getByText('EMP001')).toBeTruthy();
      expect(screen.getByText('Jane Smith')).toBeTruthy();
      expect(screen.getByText('EMP002')).toBeTruthy();

      // Check if authority options are populated in the filter
      expect(screen.getByRole('option', { name: 'Water Board' })).toBeTruthy();
      expect(screen.getByRole('option', { name: 'Electricity Board' })).toBeTruthy();
    });
  });

  it('handles API failure gracefully and shows an empty state', async () => {
    // Simulate an API network error
    global.fetch.mockRejectedValue(new Error("Network Error"));

    render(<AdminOfficerManagement />);

    await waitFor(() => {
      // Check if empty state message is displayed
      expect(screen.getByText('No officers match your filters.')).toBeTruthy();
    });
  });

  it('filters officers dynamically by search term (Name, ID, or Email)', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, data: mockOfficers }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, data: mockAuthorities }) });

    render(<AdminOfficerManagement />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeTruthy();
    });

    const searchInput = screen.getByPlaceholderText('Search by name, ID, or email...');
    
    // Test searching by officer name
    fireEvent.change(searchInput, { target: { value: 'Jane' } });

    // Check if search results are filtered correctly
    expect(screen.queryByText('John Doe')).toBeNull();
    expect(screen.getByText('Jane Smith')).toBeTruthy();
    
    // Test searching by Employee ID
    fireEvent.change(searchInput, { target: { value: 'EMP001' } });
    expect(screen.queryByText('Jane Smith')).toBeNull();
    expect(screen.getByText('John Doe')).toBeTruthy();
  });

  it('filters officers when a department is selected from the dropdown', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, data: mockOfficers }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, data: mockAuthorities }) });

    render(<AdminOfficerManagement />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeTruthy();
    });

    // Simulate filtering by department
    const selects = screen.getAllByRole('combobox');
    const deptSelect = selects[0];

    // Select the Electricity Board department
    fireEvent.change(deptSelect, { target: { value: '11' } }); 

    // Check if officers are filtered correctly
    expect(screen.queryByText('John Doe')).toBeNull();
    expect(screen.getByText('Jane Smith')).toBeTruthy();
  });

  it('filters officers when a status is selected from the dropdown', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, data: mockOfficers }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, data: mockAuthorities }) });

    render(<AdminOfficerManagement />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeTruthy();
    });

    // Simulate filtering by status
    const selects = screen.getAllByRole('combobox');
    const statusSelect = selects[1];

    // Filter by active status
    fireEvent.change(statusSelect, { target: { value: 'Active' } });

    // Check if inactive officers are filtered out
    expect(screen.getByText('John Doe')).toBeTruthy();
    expect(screen.queryByText('Jane Smith')).toBeNull();
  });

  it('opens the Add Officer Modal when clicking the add button', async () => {
    // Mock empty API responses
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) });

    render(<AdminOfficerManagement />);

    // Simulate clicking the Add Officer button
    const addButton = screen.getByText(/Add New Officer/i);
    fireEvent.click(addButton);

    // Check if the Add Officer modal is displayed
    expect(screen.getByTestId('add-modal')).toBeTruthy();
  });

  it('opens the Edit and Delete Modals when clicking action buttons on table rows', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, data: mockOfficers }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, data: mockAuthorities }) });

    render(<AdminOfficerManagement />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeTruthy();
    });

    // Simulate clicking the edit button
    const editButtons = screen.getAllByTitle('Edit Officer');
    fireEvent.click(editButtons[0]);
    expect(screen.getByTestId('edit-modal')).toBeTruthy();
    
    // Simulate clicking the delete button
    const deleteButtons = screen.getAllByTitle('Permanently Delete');
    fireEvent.click(deleteButtons[0]);
    expect(screen.getByTestId('delete-modal')).toBeTruthy();
  });

});