import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProfileScreen from '../../src/screens/ProfileScreen';

// Mock Dependencies

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.fn().mockImplementation(({ children }) => children),
}));

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  // Assign testID based on icon name for testing
  return { Ionicons: (props) => <View testID={`icon-${props.name}`} {...props} /> };
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue('en'),
  setItem: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  // Mock useFocusEffect
  useFocusEffect: jest.fn((callback) => callback()),
}));

jest.mock('../../src/components/NationalBadge', () => {
  const { View } = require('react-native');
  return () => <View testID="mock-national-badge" />;
});

jest.mock('../../src/config', () => ({
  BASE_URL: 'http://mock-server.com',
}));

describe('ProfileScreen', () => {
  // Mock props data
  const mockProps = {
    userName: 'Jane Doe',
    userEmail: 'jane@example.com',
    initialData: { district: 'Colombo' },
    onNavigateToEdit: jest.fn(),
    onNavigateToHelp: jest.fn(),
    onNavigateToFAQ: jest.fn(),
    onNavigateToTerms: jest.fn(),
    onNavigateToPrivacy: jest.fn(),
    onLogout: jest.fn(),
  };

  beforeEach(() => {
    // Clear mock data before each test
    jest.clearAllMocks();
  });

  it('renders user information and initials correctly', async () => {
    const { getByText } = render(<ProfileScreen {...mockProps} />);
    
    // Verify basic user information is rendered
    await waitFor(() => {
      expect(getByText('Jane Doe')).toBeTruthy();
      expect(getByText('jane@example.com')).toBeTruthy();
      expect(getByText('Colombo')).toBeTruthy();
      
      // Verify initials are generated correctly
      expect(getByText('JD')).toBeTruthy(); 
    });
  });

  it('loads saved language from AsyncStorage and allows toggling', async () => {
    const { getByText } = render(<ProfileScreen {...mockProps} />);
    
    // Verify language is retrieved from AsyncStorage
    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('userLanguage');
    });

    // Simulate tapping the Sinhala language button
    const sinhalaBtn = getByText('සිංහල');
    fireEvent.press(sinhalaBtn);

    // Verify new language is saved to AsyncStorage
    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('userLanguage', 'si');
    });
  });

  it('triggers navigation callbacks when menu options are clicked', () => {
    const { getByText } = render(<ProfileScreen {...mockProps} />);
    
    // Verify navigation to Edit Profile Details
    fireEvent.press(getByText(/Edit Profile Details/i));
    expect(mockProps.onNavigateToEdit).toHaveBeenCalled();

    // Verify navigation to Help & Instructions
    fireEvent.press(getByText(/Help & Instructions/i));
    expect(mockProps.onNavigateToHelp).toHaveBeenCalled();

    // Verify logout action
    fireEvent.press(getByText(/Sign Out/i));
    expect(mockProps.onLogout).toHaveBeenCalled();
  });
});