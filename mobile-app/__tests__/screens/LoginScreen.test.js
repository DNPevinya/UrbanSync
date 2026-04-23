import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../../src/screens/LoginScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';

// --- Mocks ---

// 1. React Native Safe Area Context
jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: jest.fn().mockImplementation(({ children }) => children),
    SafeAreaConsumer: jest.fn().mockImplementation(({ children }) => children(inset)),
    SafeAreaView: jest.fn().mockImplementation(({ children }) => children),
    useSafeAreaInsets: jest.fn().mockReturnValue(inset),
  };
});

// 2. Vector Icons
jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    Ionicons: (props) => <View testID={`icon-${props.name}`} {...props} />,
    MaterialIcons: (props) => <View testID={`icon-${props.name}`} {...props} />,
    MaterialCommunityIcons: (props) => <View testID={`icon-${props.name}`} {...props} />,
  };
});

// 3. Linear Gradient
jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return {
    LinearGradient: (props) => <View testID="linear-gradient" {...props} />
  };
});

// 4. Async Storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(() => Promise.resolve('en')),
  removeItem: jest.fn(),
}));

// 5. Firebase
jest.mock('firebase/auth', () => ({
  PhoneAuthProvider: jest.fn().mockImplementation(() => ({
    verifyPhoneNumber: jest.fn(),
  })),
  signInWithCredential: jest.fn(),
}));

PhoneAuthProvider.credential = jest.fn();

jest.mock('../../src/firebaseConfig', () => ({
  auth: {
    app: {
      options: {}
    }
  }
}));

jest.mock('expo-firebase-recaptcha', () => ({
  FirebaseRecaptchaVerifierModal: (props) => {
    const { View } = require('react-native');
    return <View testID="recaptcha-modal" {...props} />;
  }
}));

// 6. Custom Components
jest.mock('../../src/components/NationalBadge', () => {
  const { View } = require('react-native');
  return () => <View testID="national-badge" />;
});

// 7. Global fetch
global.fetch = jest.fn();

// --- Test Suite ---
describe('LoginScreen Component', () => {
  const mockOnLoginSuccess = jest.fn();
  const mockOnCreateAccount = jest.fn();
  const mockOnNavigateToForgot = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly and displays initial input elements and links', () => {
    const { getByPlaceholderText, getByText, getByTestId } = render(
      <LoginScreen
        onLoginSuccess={mockOnLoginSuccess}
        onCreateAccount={mockOnCreateAccount}
        onNavigateToForgot={mockOnNavigateToForgot}
      />
    );

    // Verify main inputs are present
    expect(getByPlaceholderText('e.g. citizen@example.com')).toBeTruthy();
    expect(getByPlaceholderText('Enter your password')).toBeTruthy();

    // Verify buttons and links are present based on translation 'en'
    expect(getByText('Sign In')).toBeTruthy();
    expect(getByText('Create an Account')).toBeTruthy();
    expect(getByText('Forgot Password?')).toBeTruthy();
    
    // Verify custom components are rendered
    expect(getByTestId('national-badge')).toBeTruthy();
    expect(getByTestId('recaptcha-modal')).toBeTruthy();
  });

  it('shows validation errors when submitting with empty fields', async () => {
    const { getByText } = render(
      <LoginScreen
        onLoginSuccess={mockOnLoginSuccess}
        onCreateAccount={mockOnCreateAccount}
        onNavigateToForgot={mockOnNavigateToForgot}
      />
    );

    const loginButton = getByText('Sign In');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(getByText('Email or phone is required.')).toBeTruthy();
      expect(getByText('Password is required.')).toBeTruthy();
    });
  });

  it('shows validation error for invalid email format', async () => {
    const { getByText, getByPlaceholderText } = render(
      <LoginScreen
        onLoginSuccess={mockOnLoginSuccess}
        onCreateAccount={mockOnCreateAccount}
        onNavigateToForgot={mockOnNavigateToForgot}
      />
    );

    const emailInput = getByPlaceholderText('e.g. citizen@example.com');
    fireEvent.changeText(emailInput, 'invalidemail');

    const loginButton = getByText('Sign In');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(getByText('Please enter a valid email format.')).toBeTruthy();
      expect(getByText('Password is required.')).toBeTruthy();
    });
  });

  it('handles successful standard login flow', async () => {
    // Mock successful backend response
    const mockUser = {
      id: '123',
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      district: 'Colombo',
      division: 'Colombo 1',
      profilePicture: null
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'SUCCESS', user: mockUser }),
    });

    const { getByText, getByPlaceholderText } = render(
      <LoginScreen
        onLoginSuccess={mockOnLoginSuccess}
        onCreateAccount={mockOnCreateAccount}
        onNavigateToForgot={mockOnNavigateToForgot}
      />
    );

    fireEvent.changeText(getByPlaceholderText('e.g. citizen@example.com'), 'john@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/auth/login'), expect.any(Object));
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
      expect(mockOnLoginSuccess).toHaveBeenCalledWith(
        mockUser.id, mockUser.fullName, mockUser.email, 
        mockUser.phone, mockUser.district, mockUser.division, 
        mockUser.profilePicture
      );
    });
  });

  it('handles server errors gracefully and displays error message', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Invalid email or password.' }),
    });

    const { getByText, getByPlaceholderText } = render(
      <LoginScreen
        onLoginSuccess={mockOnLoginSuccess}
        onCreateAccount={mockOnCreateAccount}
        onNavigateToForgot={mockOnNavigateToForgot}
      />
    );

    fireEvent.changeText(getByPlaceholderText('e.g. citizen@example.com'), 'wrong@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'wrongpass');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(getByText('Invalid email or password.')).toBeTruthy();
    });
  });

  it('handles 2FA REQUIRED response and enters OTP verification mode', async () => {
    // Mock 2FA API response
    const mockPendingUser = { id: '456', fullName: 'Jane Doe', email: 'jane@example.com' };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: '2FA_REQUIRED', phone: '+94771234567', userProfile: mockPendingUser }),
    });

    // Mock Firebase verification
    const mockVerifyPhoneNumber = jest.fn().mockResolvedValue('verification-id-123');
    PhoneAuthProvider.mockImplementation(() => ({
      verifyPhoneNumber: mockVerifyPhoneNumber,
    }));

    const { getByText, getByPlaceholderText, queryByText } = render(
      <LoginScreen
        onLoginSuccess={mockOnLoginSuccess}
        onCreateAccount={mockOnCreateAccount}
        onNavigateToForgot={mockOnNavigateToForgot}
      />
    );

    fireEvent.changeText(getByPlaceholderText('e.g. citizen@example.com'), 'jane@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      // Verify OTP mode is active by checking translations
      expect(getByText('Verify & Login')).toBeTruthy(); // OTP mode verify button
      expect(getByPlaceholderText('------')).toBeTruthy(); // OTP input
      expect(queryByText('Sign In')).toBeNull(); // Original Sign In button is removed
      
      expect(mockVerifyPhoneNumber).toHaveBeenCalledWith('+94771234567', expect.anything());
    });
  });

  it('validates and submits OTP successfully to complete login', async () => {
    const mockPendingUser = { id: '456', fullName: 'Jane Doe', email: 'jane@example.com' };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: '2FA_REQUIRED', phone: '+94771234567', userProfile: mockPendingUser }),
    });

    const mockVerifyPhoneNumber = jest.fn().mockResolvedValue('verification-id-123');
    PhoneAuthProvider.mockImplementation(() => ({
      verifyPhoneNumber: mockVerifyPhoneNumber,
    }));

    // Mock Firebase OTP submission
    const mockCredential = { providerId: 'phone' };
    PhoneAuthProvider.credential.mockReturnValue(mockCredential);
    signInWithCredential.mockResolvedValueOnce({ user: { uid: 'firebase-uid' } });

    const { getByText, getByPlaceholderText } = render(
      <LoginScreen
        onLoginSuccess={mockOnLoginSuccess}
        onCreateAccount={mockOnCreateAccount}
        onNavigateToForgot={mockOnNavigateToForgot}
      />
    );

    // Trigger OTP mode
    fireEvent.changeText(getByPlaceholderText('e.g. citizen@example.com'), 'jane@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => expect(getByPlaceholderText('------')).toBeTruthy());

    // Try to submit incomplete OTP
    fireEvent.press(getByText('Verify & Login'));
    await waitFor(() => expect(getByText('Please enter a valid 6-digit code.')).toBeTruthy());

    // Submit correct length OTP
    fireEvent.changeText(getByPlaceholderText('------'), '123456');
    fireEvent.press(getByText('Verify & Login'));

    await waitFor(() => {
      expect(PhoneAuthProvider.credential).toHaveBeenCalledWith('verification-id-123', '123456');
      expect(signInWithCredential).toHaveBeenCalledWith(expect.anything(), mockCredential);
      expect(mockOnLoginSuccess).toHaveBeenCalledWith(
        mockPendingUser.id, mockPendingUser.fullName, mockPendingUser.email, 
        mockPendingUser.phone, mockPendingUser.district, mockPendingUser.division, 
        null
      );
    });
  });

  it('handles OTP verification failure', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: '2FA_REQUIRED', phone: '+94771234567', userProfile: {} }),
    });

    const mockVerifyPhoneNumber = jest.fn().mockResolvedValue('verification-id-123');
    PhoneAuthProvider.mockImplementation(() => ({
      verifyPhoneNumber: mockVerifyPhoneNumber,
    }));

    // Mock Firebase OTP failure
    PhoneAuthProvider.credential.mockReturnValue({});
    signInWithCredential.mockRejectedValueOnce(new Error('invalid-code'));

    const { getByText, getByPlaceholderText } = render(
      <LoginScreen
        onLoginSuccess={mockOnLoginSuccess}
        onCreateAccount={mockOnCreateAccount}
        onNavigateToForgot={mockOnNavigateToForgot}
      />
    );

    fireEvent.changeText(getByPlaceholderText('e.g. citizen@example.com'), 'jane@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => expect(getByPlaceholderText('------')).toBeTruthy());

    fireEvent.changeText(getByPlaceholderText('------'), '999999');
    fireEvent.press(getByText('Verify & Login'));

    await waitFor(() => {
      expect(getByText('Invalid OTP code. Please try again.')).toBeTruthy();
    });
  });

  it('triggers navigation callbacks for Create Account and Forgot Password', () => {
    const { getByText } = render(
      <LoginScreen
        onLoginSuccess={mockOnLoginSuccess}
        onCreateAccount={mockOnCreateAccount}
        onNavigateToForgot={mockOnNavigateToForgot}
      />
    );

    fireEvent.press(getByText('Create an Account'));
    expect(mockOnCreateAccount).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Forgot Password?'));
    expect(mockOnNavigateToForgot).toHaveBeenCalledTimes(1);
  });
});
