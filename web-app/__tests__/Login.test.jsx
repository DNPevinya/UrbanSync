import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'; 
import { useNavigate } from 'react-router-dom';
import Login from '../src/pages/Login'; 

// Mock React Router navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: { setItem: vi.fn() },
});

// Mock API calls
global.fetch = vi.fn();

describe('Web Dashboard Login Component', () => {

  beforeEach(() => {
    // Clear mock data before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up rendered components after each test
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

    // Check if input values are updated
    expect(emailInput.value).toBe('admin@urbansync.com');
    expect(passwordInput.value).toBe('secure123');
  });

  it('successfully logs in a Super Admin and navigates to the admin dashboard', async () => {
    // Simulate successful Super Admin login
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        message: "Login successful!",
        user: { id: 1, email: 'admin@urbansync.com', role: 'super_admin' }
      })
    });

    render(<Login />);
    
    // Simulate filling the login form
    fireEvent.change(screen.getByPlaceholderText('Official Email Address'), { target: { value: 'admin@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'pass123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      // Check if user session is saved
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'urbanSyncUser', 
        JSON.stringify({ id: 1, email: 'admin@urbansync.com', role: 'super_admin' })
      );
      // Check if Super Admin is redirected to the admin dashboard
      expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
    });
  });

  it('successfully logs in an Officer and navigates to the officer dashboard', async () => {
    // Simulate successful Officer login
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

    // Check if Officer is redirected to the officer dashboard
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/officer/dashboard');
    });
  });

  it('blocks citizens from logging into the admin web portal', async () => {
    // Simulate a Citizen login attempt
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

    // Check if Citizen login is rejected with a warning message
    await waitFor(() => {
      expect(screen.getByText("Authorized personnel only. Please use the mobile app.")).toBeTruthy();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('displays an error message if credentials are wrong', async () => {
    // Simulate a failed login attempt
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: "Invalid email or password." })
    });

    render(<Login />);
    
    // Simulate entering incorrect credentials
    fireEvent.change(screen.getByPlaceholderText('Official Email Address'), { target: { value: 'wrong@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrongpassword' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText("Invalid email or password.")).toBeTruthy();
    });
  });

});