import React from 'react';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import AdminAuthorities from '../src/pages/AdminAuthorities';

// Mock layout components
vi.mock('../src/components/Sidebar', () => ({ default: () => <div data-testid="sidebar" /> }));
vi.mock('../src/components/Header', () => ({ default: () => <header data-testid="header" /> }));
vi.mock('../src/components/Footer', () => ({ default: () => <footer data-testid="footer" /> }));

// Mock modal components to verify they open and close correctly
vi.mock('../src/components/AddAuthorityModal', () => ({ 
  default: ({ isOpen, onClose }) => isOpen ? (
    <div data-testid="add-modal">
      <button onClick={onClose} data-testid="close-add">Close</button>
    </div>
  ) : null 
}));

vi.mock('../src/components/EditAuthorityModal', () => ({ 
  default: ({ isOpen, onClose }) => isOpen ? (
    <div data-testid="edit-modal">
      <button onClick={onClose} data-testid="close-edit">Close</button>
    </div>
  ) : null 
}));

vi.mock('../src/components/DeleteModal', () => ({ 
  default: ({ isOpen, onClose }) => isOpen ? (
    <div data-testid="delete-modal">
      <button onClick={onClose} data-testid="close-delete">Close</button>
    </div>
  ) : null 
}));

// Mock API calls
global.fetch = vi.fn();

// Mock API response data
const mockAuthorities = [
  { authority_id: 1, name: 'Water Board', department: 'Water Supply Services', region: 'Colombo', officer_count: 5 },
  { authority_id: 2, name: 'Traffic Police', department: 'Public Safety', region: 'Kandy', officer_count: 10 },
];
const mockDepartments = [{ id: 1, name: 'Water Supply Services' }, { id: 2, name: 'Public Safety' }];
const mockRegions = [{ id: 1, name: 'Colombo' }, { id: 2, name: 'Kandy' }];

describe('AdminAuthorities Component', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock three API responses in the required order
    global.fetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockAuthorities }) // 1. authorities-list
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockDepartments }) // 2. departments-list
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockRegions })     // 3. regions-list
      });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows loading state initially and then renders authorities table and stats', async () => {
    render(<AdminAuthorities />);
    
    // Check if loading state is displayed initially
    expect(screen.getByText('Loading...')).toBeTruthy();

    await waitFor(() => {
      // Check if KPI statistics are displayed
      expect(screen.getByText('Total Authorities')).toBeTruthy();
      
      // Check if total statistics match the expected values
      const h3Elements = screen.getAllByRole('heading', { level: 3 });
      expect(h3Elements.some(el => el.textContent === '2')).toBe(true);
      expect(h3Elements.some(el => el.textContent === '15')).toBe(true);

      // Check if authority data is displayed in the table
      expect(screen.getByText('Water Board')).toBeTruthy();
      expect(screen.getByText('Water Supply Services')).toBeTruthy();
      expect(screen.getByText('5 Officers')).toBeTruthy();

      expect(screen.getByText('Traffic Police')).toBeTruthy();
      expect(screen.getByText('Kandy')).toBeTruthy();
      expect(screen.getByText('10 Officers')).toBeTruthy();
    });
  });

  it('filters authorities by search term dynamically matching Name or Department', async () => {
    render(<AdminAuthorities />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Water Board')).toBeTruthy();
    });

    const searchInput = screen.getByPlaceholderText('Search authorities...');
    
    // Test searching by authority name
    fireEvent.change(searchInput, { target: { value: 'Traffic' } });

    // Check if search results are filtered correctly
    expect(screen.queryByText('Water Board')).toBeNull();
    expect(screen.getByText('Traffic Police')).toBeTruthy();

    // Test searching by department name
    fireEvent.change(searchInput, { target: { value: 'Water' } });
    
    expect(screen.getByText('Water Board')).toBeTruthy();
    expect(screen.queryByText('Traffic Police')).toBeNull();

    // Test searching with no matching results
    fireEvent.change(searchInput, { target: { value: 'Nonexistent' } });
    expect(screen.queryByText('Water Board')).toBeNull();
    expect(screen.queryByText('Traffic Police')).toBeNull();
    expect(screen.getByText('No authorities match your search.')).toBeTruthy();
  });

  it('opens and closes the Add Authority modal', async () => {
    render(<AdminAuthorities />);

    await waitFor(() => {
      expect(screen.getByText('Water Board')).toBeTruthy();
    });

    // Simulate clicking the Add Authority button
    fireEvent.click(screen.getByText('Add Authority'));
    
    // Check if the Add Authority modal is displayed
    expect(screen.getByTestId('add-modal')).toBeTruthy();

    // Simulate closing the modal
    fireEvent.click(screen.getByTestId('close-add'));
    
    // Check if the modal is hidden
    expect(screen.queryByTestId('add-modal')).toBeNull();
  });

  it('opens and closes the Edit Authority modal', async () => {
    render(<AdminAuthorities />);

    await waitFor(() => {
      // Check if edit buttons are rendered for all authorities
      expect(screen.getAllByTitle('Edit Authority').length).toBe(2);
    });

    // Simulate clicking the first edit button
    fireEvent.click(screen.getAllByTitle('Edit Authority')[0]);
    expect(screen.getByTestId('edit-modal')).toBeTruthy();

    fireEvent.click(screen.getByTestId('close-edit'));
    expect(screen.queryByTestId('edit-modal')).toBeNull();
  });

  it('opens and closes the Delete Authority modal', async () => {
    render(<AdminAuthorities />);

    await waitFor(() => {
      expect(screen.getAllByTitle('Delete Authority').length).toBe(2);
    });

    // Simulate clicking the first delete button
    fireEvent.click(screen.getAllByTitle('Delete Authority')[0]);
    expect(screen.getByTestId('delete-modal')).toBeTruthy();

    fireEvent.click(screen.getByTestId('close-delete'));
    expect(screen.queryByTestId('delete-modal')).toBeNull();
  });

});