import React from 'react';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import AdminAuthorities from '../src/pages/AdminAuthorities';

// Stub out the standard layout components so the DOM isn't cluttered with sidebars and footers
vi.mock('../src/components/Sidebar', () => ({ default: () => <div data-testid="sidebar" /> }));
vi.mock('../src/components/Header', () => ({ default: () => <header data-testid="header" /> }));
vi.mock('../src/components/Footer', () => ({ default: () => <footer data-testid="footer" /> }));

// Replace the complex modal components with simple dummy divs.
// We pass through the `isOpen` and `onClose` props so we can still test if the parent opens and closes them correctly.
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

// Intercept network requests
global.fetch = vi.fn();

// Prepare some dummy data that perfectly matches what the backend would normally return
const mockAuthorities = [
  { authority_id: 1, name: 'Water Board', department: 'Water Supply Services', region: 'Colombo', officer_count: 5 },
  { authority_id: 2, name: 'Traffic Police', department: 'Public Safety', region: 'Kandy', officer_count: 10 },
];
const mockDepartments = [{ id: 1, name: 'Water Supply Services' }, { id: 2, name: 'Public Safety' }];
const mockRegions = [{ id: 1, name: 'Colombo' }, { id: 2, name: 'Kandy' }];

describe('AdminAuthorities Component', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    
    // The component fires three simultaneous fetch requests using Promise.all on mount.
    // We have to queue up exactly three mock responses in the exact order they are called.
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
    
    // Verify the loading screen catches the user before data arrives
    expect(screen.getByText('Loading...')).toBeTruthy();

    await waitFor(() => {
      // Verify the top KPI cards populated correctly
      expect(screen.getByText('Total Authorities')).toBeTruthy();
      
      // Since the numbers 2 and 15 might be simple text nodes without distinct labels, 
      // we grab all the h3 tags and ensure our stats are in there. (5 + 10 officers = 15 total)
      const h3Elements = screen.getAllByRole('heading', { level: 3 });
      expect(h3Elements.some(el => el.textContent === '2')).toBe(true);
      expect(h3Elements.some(el => el.textContent === '15')).toBe(true);

      // Verify the table mapped our dummy data to rows
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

    // Wait for the table to finish its initial load
    await waitFor(() => {
      expect(screen.getByText('Water Board')).toBeTruthy();
    });

    const searchInput = screen.getByPlaceholderText('Search authorities...');
    
    // Test filtering by name
    fireEvent.change(searchInput, { target: { value: 'Traffic' } });

    // Ensure Water Board vanished and Traffic Police stayed
    expect(screen.queryByText('Water Board')).toBeNull();
    expect(screen.getByText('Traffic Police')).toBeTruthy();

    // Test filtering by department
    fireEvent.change(searchInput, { target: { value: 'Water' } });
    
    expect(screen.getByText('Water Board')).toBeTruthy();
    expect(screen.queryByText('Traffic Police')).toBeNull();

    // Test typing garbage that matches nothing
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

    // Tap the button to open the modal
    fireEvent.click(screen.getByText('Add Authority'));
    
    // Verify our dummy modal appeared on screen
    expect(screen.getByTestId('add-modal')).toBeTruthy();

    // Tap the dummy close button inside the modal
    fireEvent.click(screen.getByTestId('close-add'));
    
    // Verify it communicated with the parent state to close itself
    expect(screen.queryByTestId('add-modal')).toBeNull();
  });

  it('opens and closes the Edit Authority modal', async () => {
    render(<AdminAuthorities />);

    await waitFor(() => {
      // There should be one edit button for each authority in our dummy list
      expect(screen.getAllByTitle('Edit Authority').length).toBe(2);
    });

    // Click the edit button for the first row
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

    // Click the delete button for the first row
    fireEvent.click(screen.getAllByTitle('Delete Authority')[0]);
    expect(screen.getByTestId('delete-modal')).toBeTruthy();

    fireEvent.click(screen.getByTestId('close-delete'));
    expect(screen.queryByTestId('delete-modal')).toBeNull();
  });

});