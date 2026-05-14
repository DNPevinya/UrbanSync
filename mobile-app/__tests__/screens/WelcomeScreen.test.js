import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import WelcomeScreen from '../../src/screens/WelcomeScreen';

// Mock Dependencies

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.fn().mockImplementation(({ children }) => children),
}));

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  // Assign testID based on icon name for testing
  return { 
    Ionicons: (props) => <View testID={`icon-${props.name}`} {...props} />,
    MaterialIcons: (props) => <View testID={`icon-${props.name}`} {...props} /> 
  };
});

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: (props) => <View testID="mock-gradient" {...props} /> };
});

describe('WelcomeScreen', () => {
  const mockOnGetStarted = jest.fn();

  beforeEach(() => {
    // Clear mock data before each test
    jest.clearAllMocks();
  });

  it('renders the branding elements and title correctly', () => {
    const { getByText, getByTestId } = render(<WelcomeScreen onGetStarted={mockOnGetStarted} />);

    // Verify branding text is rendered
    expect(getByText('UrbanSync')).toBeTruthy();
    expect(getByText('Report Public Issues Easily and Transparently')).toBeTruthy();
    expect(getByText('AN INITIATIVE FOR A BETTER SRI LANKA')).toBeTruthy();

    // Verify visual elements are rendered
    expect(getByTestId('mock-gradient')).toBeTruthy();
    expect(getByTestId('icon-shield-checkmark')).toBeTruthy();
  });

  it('triggers the onGetStarted callback when the button is pressed', () => {
    const { getByText } = render(<WelcomeScreen onGetStarted={mockOnGetStarted} />);

    // Simulate tapping the Get Started button
    const getStartedButton = getByText('Get Started');
    fireEvent.press(getStartedButton);

    // Verify navigation callback
    expect(mockOnGetStarted).toHaveBeenCalledTimes(1);
  });
});