import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import AdminOfficerManagement from '../src/pages/AdminOfficerManagement';

// Stub out layout components so we focus strictly on testing the management logic
vi.mock('../src/components/Sidebar', () => ({ default: () => <div data-testid="sidebar" /> }));
vi.mock('../src/components/Header', () => ({ default: () => <header data-testid="header" /> }));
vi.mock('../src/components/Footer', () => ({ default: () => <footer data-testid="footer" /> }));

// Replace complex modals with simple dummy divs.
// We pass through the `isOpen` prop so we can still test if the parent triggers them correctly.
vi.mock('../src/components/AddOfficerModal', () => ({ 
  default: ({ isOpen }) => isOpen ? <div data-testid="add-modal" /> : null 
}));
vi.mock('../src/components/EditOfficerModal', () => ({ 
  default: ({ isOpen }) => isOpen ? <div data-testid="edit-modal" /> : null 
}));
vi.mock('../src/components/DeleteOfficerModal', () => ({ 
  default: ({ isOpen }) => isOpen ? <div data-testid="delete-modal" /> : null 
}));

// Intercept network requests so we don't accidentally hit the real database
global.fetch = vi.fn();

describe('AdminOfficerManagement Component', () => {

  // Prepare dummy data representing the expected database responses
  const mockOfficers = [
    { user_id: 1, full_name: 'John Doe', email: 'john@example.com', employee_id_code: 'EMP001', authority_id: 10, authority_name: 'Water Board', status: 'Active' },
    { user_id: 2, full_name: 'Jane Smith', email: 'jane@example.com', employee_id_code: 'EMP002', authority_id: 11, authority_name: 'Electricity Board', status: 'Inactive' }
  ];

  const mockAuthorities = [
    { authority_id: 10, name: 'Water Board' },
    { authority_id: 11, name: 'Electricity Board' }
  ];

  beforeEach(() => {
    // Start fresh before every test to prevent mock state bleeding
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders correctly and shows the syncing state initially', () => {
    // Return a never-resolving promise to keep it stuck in the loading state so we can test it
    global.fetch.mockReturnValue(new Promise(() => {}));
    
    render(<AdminOfficerManagement />);
    
    // Check the static UI text
    expect(screen.getByText('Officer Management')).toBeTruthy();
    expect(screen.getByText('Manage department officers, system access levels, and credentials.')).toBeTruthy();
    
    // Verify the loading state catches the user before data arrives
    expect(screen.getByText('Syncing database...')).toBeTruthy();
    
    // Verify our layout stubs made it to the DOM
    expect(screen.getByTestId('sidebar')).toBeTruthy();
    expect(screen.getByTestId('header')).toBeTruthy();
    expect(screen.getByTestId('footer')).toBeTruthy();
  });

  it('fetches and displays officers and authorities successfully', async () => {
    // The component runs a Promise.all to fetch both the officer list and the authorities list simultaneously.
    // We queue up the two responses in the exact order the component expects them.
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
      // Verify the officers populated the table rows
      expect(screen.getByText('John Doe')).toBeTruthy();
      expect(screen.getByText('EMP001')).toBeTruthy();
      expect(screen.getByText('Jane Smith')).toBeTruthy();
      expect(screen.getByText('EMP002')).toBeTruthy();

      // Verify the authorities API response successfully populated the dropdown filter
      expect(screen.getByRole('option', { name: 'Water Board' })).toBeTruthy();
      expect(screen.getByRole('option', { name: 'Electricity Board' })).toBeTruthy();
    });
  });

  it('handles API failure gracefully and shows an empty state', async () => {
    // Force a network crash to test the catch block
    global.fetch.mockRejectedValue(new Error("Network Error"));

    render(<AdminOfficerManagement />);

    await waitFor(() => {
      // Ensure the app doesn't crash and displays a safe fallback message
      expect(screen.getByText('No officers match your filters.')).toBeTruthy();
    });
  });

  it('filters officers dynamically by search term (Name, ID, or Email)', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, data: mockOfficers }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, data: mockAuthorities }) });

    render(<AdminOfficerManagement />);

    // Wait for the table to finish loading
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeTruthy();
    });

    const searchInput = screen.getByPlaceholderText('Search by name, ID, or email...');
    
    // Test name matching
    fireEvent.change(searchInput, { target: { value: 'Jane' } });

    // John should be hidden, Jane should remain
    expect(screen.queryByText('John Doe')).toBeNull();
    expect(screen.getByText('Jane Smith')).toBeTruthy();
    
    // Test Employee ID matching
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

    // Grab the first dropdown (Department)
    const selects = screen.getAllByRole('combobox');
    const deptSelect = selects[0];

    // Select Authority ID 11 (Electricity Board)
    fireEvent.change(deptSelect, { target: { value: '11' } }); 

    // Verify John (Water Board) was filtered out
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

    // Grab the second dropdown (Status)
    const selects = screen.getAllByRole('combobox');
    const statusSelect = selects[1];

    // Filter by Active status
    fireEvent.change(statusSelect, { target: { value: 'Active' } });

    // Verify Jane (Inactive) was filtered out
    expect(screen.getByText('John Doe')).toBeTruthy();
    expect(screen.queryByText('Jane Smith')).toBeNull();
  });

  it('opens the Add Officer Modal when clicking the add button', async () => {
    // Return empty arrays so the table renders cleanly without crashing
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) });

    render(<AdminOfficerManagement />);

    // Tap the button to add a new officer
    const addButton = screen.getByText(/Add New Officer/i);
    fireEvent.click(addButton);

    // Verify our dummy modal appeared on screen
    expect(screen.getByTestId('add-modal')).toBeTruthy();
  });

  it('opens the Edit and Delete Modals when clicking action buttons on table rows', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, data: mockOfficers }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, data: mockAuthorities }) });

    render(<AdminOfficerManagement />);

    // Wait for the table rows to populate
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeTruthy();
    });

    // Tap the Edit button on the first row
    const editButtons = screen.getAllByTitle('Edit Officer');
    fireEvent.click(editButtons[0]);
    expect(screen.getByTestId('edit-modal')).toBeTruthy();
    
    // Tap the Trash icon on the first row
    const deleteButtons = screen.getAllByTitle('Permanently Delete');
    fireEvent.click(deleteButtons[0]);
    expect(screen.getByTestId('delete-modal')).toBeTruthy();
  });

});