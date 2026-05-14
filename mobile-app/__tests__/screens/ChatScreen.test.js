import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ChatScreen from '../../src/screens/ChatScreen';


// Mock Dependencies

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.fn().mockImplementation(({ children }) => children),
}));

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  // Assign testID based on icon name for testing
  return { Ionicons: (props) => <View testID={`icon-${props.name}`} {...props} /> };
});

describe('ChatScreen', () => {
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks(); // Clear mock data before each test
  });

  it('renders the initial automated messages right away', () => {
    const { getByText } = render(<ChatScreen onBack={mockOnBack} complaintId="SL-123" />);

    // Check if header title is correct
    expect(getByText('Tracking SL-123')).toBeTruthy();

    // Check if bot welcome messages are rendered
    expect(getByText('Ayubowan! We have received your report regarding the pothole.')).toBeTruthy();
    expect(getByText('A technical team is scheduled for inspection tomorrow morning.')).toBeTruthy();
  });

  it('lets the user type and send a new message', async () => {
    const { getByPlaceholderText, getByText, getByTestId } = render(<ChatScreen onBack={mockOnBack} />);

    const inputField = getByPlaceholderText('Write your message...');

    // Wait for input field to render
    await waitFor(() => expect(inputField).toBeTruthy());

    // Simulate typing in the input field
    fireEvent.changeText(inputField, 'Thank you for the update.');
    expect(inputField.props.value).toBe('Thank you for the update.');

    // Simulate clicking the send button
    const sendIcon = getByTestId('icon-send');
    fireEvent.press(sendIcon);

    // Check if the new message is displayed
    await waitFor(() => {
      expect(getByText('Thank you for the update.')).toBeTruthy();
      expect(getByText('Just now')).toBeTruthy();
    });
  });

  it('blocks the user from sending empty ghosts messages', () => {
    const { getByTestId, queryAllByText } = render(<ChatScreen onBack={mockOnBack} />);

    // Get initial count of messages
    const initialCount = queryAllByText('Just now').length;

    // Simulate clicking send with an empty input
    const sendIcon = getByTestId('icon-send');
    fireEvent.press(sendIcon);

    // Check if message count remains the same
    expect(queryAllByText('Just now').length).toBe(initialCount);
  });

  it('fires the back navigation prop when the back arrow is tapped', () => {
    const { getByTestId } = render(<ChatScreen onBack={mockOnBack} />);

    // Simulate tapping the back arrow
    const backIcon = getByTestId('icon-chevron-back');
    fireEvent.press(backIcon);

    // Check if navigation callback is fired
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });
});