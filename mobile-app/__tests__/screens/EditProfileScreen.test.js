import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import EditProfileScreen from '../../src/screens/EditProfileScreen';

// Mock UI components and external libraries
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.fn().mockImplementation(({ children }) => children),
}));

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  // Assign testID based on icon name for testing
  return { Ionicons: (props) => <View testID={`icon-${props.name}`} {...props} /> };
});

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: (props) => <View testID="mock-gradient" {...props} /> };
});

// Mock image picker permissions and functionality
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
  MediaTypeOptions: { Images: 'Images' },
}));

jest.mock('../../src/config', () => ({
  BASE_URL: 'http://mock-server.com',
}));

// Mock API calls
global.fetch = jest.fn();

describe('EditProfileScreen', () => {
  const mockOnBack = jest.fn();
  const mockOnUpdateSuccess = jest.fn();
  
  // Mock user data for the form
  const mockInitialData = {
    name: 'Jane Doe',
    phone: '771234567',
    email: 'jane@example.com',
    district: 'Colombo',
    division: 'Borella',
    profilePicture: null
  };

  beforeEach(() => {
    // Clear mock data before each test
    jest.clearAllMocks();
    // Mock Alert dialog
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('renders initial data correctly into inputs', () => {
    const { getByDisplayValue, getByText } = render(
      <EditProfileScreen initialData={mockInitialData} onBack={mockOnBack} onUpdateSuccess={mockOnUpdateSuccess} />
    );
    
    // Verify form fields are populated
    expect(getByDisplayValue('Jane Doe')).toBeTruthy();
    expect(getByDisplayValue('771234567')).toBeTruthy();
    expect(getByText('Colombo')).toBeTruthy(); 
  });

  it('alerts if user tries to set new password without entering current password', async () => {
    const { getByPlaceholderText, getByText } = render(
      <EditProfileScreen initialData={mockInitialData} />
    );

    // Fill new password without entering current password
    fireEvent.changeText(getByPlaceholderText('New password (min 8 chars)'), 'newSecurePass123');
    
    // Simulate clicking the Save Changes button
    fireEvent.press(getByText('Save Changes'));

    // Verify error alert is displayed and API call is blocked
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Security Required", 
        "Please enter your current password to set a new one."
      );
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  it('alerts if new passwords do not match', async () => {
    const { getByPlaceholderText, getByText } = render(
      <EditProfileScreen initialData={mockInitialData} />
    );

    // Enter mismatched passwords
    fireEvent.changeText(getByPlaceholderText('Required to change password'), 'oldpass123');
    fireEvent.changeText(getByPlaceholderText('New password (min 8 chars)'), 'newSecurePass123');
    fireEvent.changeText(getByPlaceholderText('Confirm new password'), 'differentPass456');
    
    fireEvent.press(getByText('Save Changes'));

    // Verify mismatch error alert and API call block
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Error", "New passwords do not match!");
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  it('submits valid data successfully and triggers success callbacks', async () => {
    // Mock successful API response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, profilePicture: '/new-pic.jpg' }),
    });

    const { getByDisplayValue, getByText } = render(
      <EditProfileScreen initialData={mockInitialData} onBack={mockOnBack} onUpdateSuccess={mockOnUpdateSuccess} />
    );

    // Update the name field
    const nameInput = getByDisplayValue('Jane Doe');
    fireEvent.changeText(nameInput, 'Jane Smith');

    // Simulate clicking the Save Changes button
    fireEvent.press(getByText('Save Changes'));

    // Check if successful update behavior occurred
    await waitFor(() => {
      // Verify API call was made
      expect(global.fetch).toHaveBeenCalled();
      
      // Verify success alert
      expect(Alert.alert).toHaveBeenCalledWith("Success", "Profile updated successfully!");
      
      // Verify parent callback was executed
      expect(mockOnUpdateSuccess).toHaveBeenCalledWith(
        'Jane Smith', '771234567', 'Colombo', 'Borella', '/new-pic.jpg'
      );
      
      // Verify navigation callback
      expect(mockOnBack).toHaveBeenCalled();
    });
  });
});