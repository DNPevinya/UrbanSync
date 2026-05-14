import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ForgotPasswordScreen from '../../src/screens/ForgotPasswordScreen';

// Mock Dependencies
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.fn().mockImplementation(({ children }) => children),
}));

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return { Ionicons: (props) => <View testID={`icon-${props.name}`} {...props} /> };
});

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: (props) => <View testID="mock-gradient" {...props} /> };
});

jest.mock('../../src/config', () => ({
  BASE_URL: 'http://mock-server.com',
}));

// Mock Firebase reCAPTCHA
jest.mock('expo-firebase-recaptcha', () => {
  const { View } = require('react-native');
  return { FirebaseRecaptchaVerifierModal: () => <View testID="mock-recaptcha" /> };
});

// Mock Firebase Auth
jest.mock('firebase/auth', () => {
  return {
    PhoneAuthProvider: jest.fn().mockImplementation(() => ({
      verifyPhoneNumber: jest.fn().mockResolvedValue('mock-verification-id'),
    })),
    signInWithCredential: jest.fn().mockResolvedValue({ user: { uid: '123' } }),
  };
});

// Mock PhoneAuthProvider credential method
require('firebase/auth').PhoneAuthProvider.credential = jest.fn().mockReturnValue('mock-credential');

// Mock Firebase config
jest.mock('../../src/firebaseConfig', () => ({
  auth: { app: { options: {} } }
}));

// Mock network requests and alerts
global.fetch = jest.fn();
global.alert = jest.fn();

describe('ForgotPasswordScreen', () => {
  const mockOnBack = jest.fn();
  const mockOnResetSuccess = jest.fn();

  beforeEach(() => {
    // Clear mock data before each test
    jest.clearAllMocks();
  });

  it('allows the user to enter their email and successfully moves to the OTP step', async () => {
    // Mock successful API response with phone number
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ phone: '+94771234567' }),
    });

    const { getByPlaceholderText, getByText, queryByText } = render(
      <ForgotPasswordScreen onBack={mockOnBack} onResetSuccess={mockOnResetSuccess} />
    );

    // Verify initial screen content
    expect(getByText('Reset Password')).toBeTruthy();

    // Simulate entering an email
    const emailInput = getByPlaceholderText('Enter your email');
    fireEvent.changeText(emailInput, 'user@urbansync.com');

    // Simulate clicking the Continue button
    fireEvent.press(getByText('Continue'));

    // Check for network request and UI update
    await waitFor(() => {
      // Verify API call was made
      expect(global.fetch).toHaveBeenCalledWith('http://mock-server.com/api/auth/forgot-password-init', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'user@urbansync.com' }),
      }));
      
      // Verify UI transition to OTP step
      expect(queryByText('Enter OTP')).toBeTruthy();
    });
  });

  it('stops the user and shows an alert if they try to proceed with a blank email', () => {
    const { getByText } = render(
      <ForgotPasswordScreen onBack={mockOnBack} onResetSuccess={mockOnResetSuccess} />
    );

    // Attempt to continue with blank email
    fireEvent.press(getByText('Continue'));

    // Verify error alert and API call block
    expect(global.alert).toHaveBeenCalledWith("Please enter your email.");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('triggers the back navigation callback when the back arrow is tapped', () => {
    const { getByTestId } = render(<ForgotPasswordScreen onBack={mockOnBack} />);

    // Simulate tapping the back arrow
    const backIcon = getByTestId('icon-chevron-back');
    fireEvent.press(backIcon.parent);

    // Verify navigation callback
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });
});