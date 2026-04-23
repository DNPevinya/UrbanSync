import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'; 
import { useNavigate } from 'react-router-dom';
import Login from '../src/pages/Login'; 

// Intercept routing so we can verify if the login directs users to the correct dashboard
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// left out localStorage so we can verify session saving without breaking the test environment
Object.defineProperty(window, 'localStorage', {
  value: { setItem: vi.fn() },
});

// Intercept network requests so we don't hit the real auth backend
global.fetch = vi.fn();

describe('Web Dashboard Login Component', () => {

  beforeEach(() => {
    // Start fresh before every test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Wipe the DOM clean after every test so inputs and error messages don't run over into the next one
    cleanup();
  });

  it('renders the login form elements correctly', () => {
    render(<Login />);
    
    expect(screen.getByText('Hello Again!')).toBeTruthy();
    expect(screen.getByPlaceholderText('Official Email Address')).toBeTruthy();
    expect(screen.getByPlaceholderText('Password')).toBeTruthy();
  });

  it('allows the user to type in the email and password fields', () => {
    render(<Login />);
    
    const emailInput = screen.getByPlaceholderText('Official Email Address');
    const passwordInput = screen.getByPlaceholderText('Password');

    fireEvent.change(emailInput, { target: { value: 'admin@urbansync.com' } });
    fireEvent.change(passwordInput, { target: { value: 'secure123' } });

    // Verify the component state updated to reflect the typed values
    expect(emailInput.value).toBe('admin@urbansync.com');
    expect(passwordInput.value).toBe('secure123');
  });

  it('successfully logs in a Super Admin and navigates to the admin dashboard', async () => {
    // Pretend the server authenticated the super admin successfully
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        message: "Login successful!",
        user: { id: 1, email: 'admin@urbansync.com', role: 'super_admin' }
      })
    });

    render(<Login />);
    
    // Fill out the form
    fireEvent.change(screen.getByPlaceholderText('Official Email Address'), { target: { value: 'admin@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'pass123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      // Verify it saved the session token/user data
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'urbanSyncUser', 
        JSON.stringify({ id: 1, email: 'admin@urbansync.com', role: 'super_admin' })
      );
      // Verify it routed them to the master admin panel
      expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
    });
  });

  it('successfully logs in an Officer and navigates to the officer dashboard', async () => {
    // Pretend the server authenticated a standard department officer
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        user: { id: 2, role: 'officer', authorityName: 'Water Board' }
      })
    });

    render(<Login />);
    
    fireEvent.change(screen.getByPlaceholderText('Official Email Address'), { target: { value: 'officer@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'pass123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    // Verify they were routed to their restricted workspace
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/officer/dashboard');
    });
  });

  it('blocks citizens from logging into the admin web portal', async () => {
    // Pretend a regular mobile app user tried to log in here
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        user: { id: 3, role: 'citizen' }
      })
    });

    render(<Login />);
    
    fireEvent.change(screen.getByPlaceholderText('Official Email Address'), { target: { value: 'citizen@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'pass123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    // Verify the app actively rejected their login and displayed a warning
    await waitFor(() => {
      expect(screen.getByText("Authorized personnel only. Please use the mobile app.")).toBeTruthy();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('displays an error message if credentials are wrong', async () => {
    // Force the API to reject the login attempt
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: "Invalid email or password." })
    });

    render(<Login />);
    
    // We must type in fake credentials so the browser's built-in HTML 'required' validation passes and fires the API call
    fireEvent.change(screen.getByPlaceholderText('Official Email Address'), { target: { value: 'wrong@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrongpassword' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    // Verify the server's error message made it to the screen
    await waitFor(() => {
      expect(screen.getByText("Invalid email or password.")).toBeTruthy();
    });
  });

});