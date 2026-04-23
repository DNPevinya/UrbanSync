import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Settings from '../src/pages/Settings';

vi.mock('../src/components/Sidebar', () => ({ default: () => <div data-testid="sidebar" /> }));
vi.mock('../src/components/Header', () => ({ default: () => <header data-testid="header" /> }));
vi.mock('../src/components/Footer', () => ({ default: () => <footer data-testid="footer" /> }));

// Intercept network requests so we don't accidentally hit the real auth API
global.fetch = vi.fn();

// Dummy user data representing an active officer session
const mockUser = {
  fullName: 'Jane Doe',
  email: 'jane.doe@urbansync.com',
  authorityName: 'Central Traffic Division',
  role: 'officer'
};

describe('Settings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Inject our dummy user into local storage so the component can read it on mount
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(mockUser));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('parses localStorage and renders the read-only profile data correctly', async () => {
    render(<Settings />);

    // Wait for the component to mount and read the mocked localStorage
    await waitFor(() => {
      // Because the profile fields are locked (readOnly), we can't test them like standard inputs.
      // Instead, we verify that their display values perfectly match the injected local storage data.
      expect(screen.getByDisplayValue('Jane Doe')).toBeTruthy();
      expect(screen.getByDisplayValue('jane.doe@urbansync.com')).toBeTruthy();
      expect(screen.getByDisplayValue('Central Traffic Division')).toBeTruthy();
    });
  });

  it('toggles password visibility when the eye icon is clicked', () => {
    render(<Settings />);

    const currentPasswordInput = screen.getByPlaceholderText('••••••••');
    
    // Initially, the input should securely mask the text
    expect(currentPasswordInput.type).toBe('password');

    // The component has several icon buttons. We grab the first one, which corresponds 
    // to the visibility toggle for the "Current Password" field.
    const buttons = screen.getAllByRole('button');
    const firstEyeIcon = buttons[0];

    // Simulate a user tapping the eye icon
    fireEvent.click(firstEyeIcon);

    // Verify the component updated the HTML type to reveal the text
    expect(currentPasswordInput.type).toBe('text');
  });

  it('displays a mismatch error if the new password and confirmation password do not match', async () => {
    render(<Settings />);

    // Fill out the form with mismatched new passwords
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'oldpass123' } });
    fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), { target: { value: 'newSecurePass!' } });
    fireEvent.change(screen.getByPlaceholderText('Repeat new password'), { target: { value: 'differentPass!' } });

    // Attempt to submit
    fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));

    // Verify the validation logic caught the error and blocked the API request
    await waitFor(() => {
      expect(screen.getByText(/Mismatch Error/i)).toBeTruthy();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  it('keeps the submit button disabled until the new password meets the 8-character minimum', () => {
    render(<Settings />);

    const submitButton = screen.getByRole('button', { name: /Update Password/i });
    
    // The button should be disabled by default since the field is empty
    expect(submitButton.disabled).toBe(true);

    // Type a short, invalid password
    fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), { target: { value: '12345' } });
    expect(submitButton.disabled).toBe(true);

    // Type a password that hits the exact 8-character threshold
    fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), { target: { value: '12345678' } });
    
    // The button should now unlock
    expect(submitButton.disabled).toBe(false);
  });

  it('submits a correctly formatted payload to the API when valid passwords are provided', async () => {
    // Pretend the server successfully processed the password change
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Password updated successfully.' }),
    });

    render(<Settings />);

    // Fill out the form correctly
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'oldpass123' } });
    fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), { target: { value: 'newSecurePass!' } });
    fireEvent.change(screen.getByPlaceholderText('Repeat new password'), { target: { value: 'newSecurePass!' } });

    // Hit save
    fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));

    // Verify the exact payload sent to the backend includes the email pulled from the local session
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/auth/update-password', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'jane.doe@urbansync.com', 
          currentPassword: 'oldpass123',
          newPassword: 'newSecurePass!'
        })
      }));
      
      // Verify the success message made it back to the UI
      expect(screen.getByText('Password updated successfully.')).toBeTruthy();
    });
  });
});