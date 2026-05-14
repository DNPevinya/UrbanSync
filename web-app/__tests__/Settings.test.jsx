import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Settings from '../src/pages/Settings';
import { BASE_URL } from '../src/config';

vi.mock('../src/components/Sidebar', () => ({ default: () => <div data-testid="sidebar" /> }));
vi.mock('../src/components/Header', () => ({ default: () => <header data-testid="header" /> }));
vi.mock('../src/components/Footer', () => ({ default: () => <footer data-testid="footer" /> }));

// Mock API calls
global.fetch = vi.fn();

// Mock user session data
const mockUser = {
  fullName: 'Jane Doe',
  email: 'jane.doe@urbansync.com',
  authorityName: 'Central Traffic Division',
  role: 'officer'
};

describe('Settings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Simulate a logged-in user session
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(mockUser));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('parses localStorage and renders the read-only profile data correctly', async () => {
    render(<Settings />);

    // Wait for component to load data
    await waitFor(() => {
      // Check if read-only inputs display user data
      expect(screen.getByDisplayValue('Jane Doe')).toBeTruthy();
      expect(screen.getByDisplayValue('jane.doe@urbansync.com')).toBeTruthy();
      expect(screen.getByDisplayValue('Central Traffic Division')).toBeTruthy();
    });
  });

  it('toggles password visibility when the eye icon is clicked', () => {
    render(<Settings />);

    const currentPasswordInput = screen.getByPlaceholderText('••••••••');
    
    // Verify input type is password initially
    expect(currentPasswordInput.type).toBe('password');

    // Select visibility toggle button
    const buttons = screen.getAllByRole('button');
    const firstEyeIcon = buttons[0];

    // Simulate clicking the toggle
    fireEvent.click(firstEyeIcon);

    // Verify input type changed to text
    expect(currentPasswordInput.type).toBe('text');
  });

  it('displays a mismatch error if the new password and confirmation password do not match', async () => {
    render(<Settings />);

    // Enter mismatched passwords
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'oldpass123' } });
    fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), { target: { value: 'newSecurePass!' } });
    fireEvent.change(screen.getByPlaceholderText('Repeat new password'), { target: { value: 'differentPass!' } });

    // Simulate form submission
    fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));

    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Mismatch Error/i)).toBeTruthy();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  it('keeps the submit button disabled until the new password meets the 8-character minimum', () => {
    render(<Settings />);

    const submitButton = screen.getByRole('button', { name: /Update Password/i });
    
    // Verify button is disabled initially
    expect(submitButton.disabled).toBe(true);

    // Test a password with less than 8 characters
    fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), { target: { value: '12345' } });
    expect(submitButton.disabled).toBe(true);

    // Test a valid password
    fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), { target: { value: '12345678' } });
    
    // Verify button is enabled
    expect(submitButton.disabled).toBe(false);
  });

  it('submits a correctly formatted payload to the API when valid passwords are provided', async () => {
    // Simulate successful API response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Password updated successfully.' }),
    });

    render(<Settings />);

    // Enter valid passwords
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'oldpass123' } });
    fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), { target: { value: 'newSecurePass!' } });
    fireEvent.change(screen.getByPlaceholderText('Repeat new password'), { target: { value: 'newSecurePass!' } });

    // Simulate form submission
    fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));

    // Check if API request payload is correct
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`${BASE_URL}/api/auth/update-password`, expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'jane.doe@urbansync.com', 
          currentPassword: 'oldpass123',
          newPassword: 'newSecurePass!'
        })
      }));
      
      // Check if success message is displayed
      expect(screen.getByText('Password updated successfully.')).toBeTruthy();
    });
  });
});
