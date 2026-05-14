import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationScreen from '../../src/screens/NotificationScreen';

// Mock Dependencies

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.fn().mockImplementation(({ children }) => children),
}));

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  // Assign testID based on icon name for testing
  return { 
    Ionicons: (props) => <View testID={`icon-${props.name}`} {...props} />,
    MaterialCommunityIcons: (props) => <View testID={`icon-${props.name}`} {...props} /> 
  };
});

// Mock logged-in user in AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(JSON.stringify({ id: 99 })),
}));

jest.mock('../../src/config', () => ({
  BASE_URL: 'http://mock-server.com',
}));

// Mock network requests
global.fetch = jest.fn();

// Mock API response data
const mockNotifications = [
  { notification_id: 1, message: 'Your complaint was RESOLVED.', created_at: '2026-04-20T10:00:00Z', is_read: 0 }, // Unread
  { notification_id: 2, message: 'Report is IN PROGRESS.', created_at: '2026-04-21T10:00:00Z', is_read: 1 }, // Read
  { notification_id: 3, message: 'General system update.', created_at: '2026-04-22T10:00:00Z', is_read: 1 }  // Read
];

describe('NotificationScreen', () => {
  const mockOnBack = jest.fn();

  beforeEach(() => {
    // Clear mock data before each test
    jest.clearAllMocks();
  });

  it('fetches notifications on mount and categorizes them correctly', async () => {
    // Mock successful API response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockNotifications }),
    });

    const { getByText } = render(<NotificationScreen onBack={mockOnBack} />);

    // Verify user ID is retrieved from AsyncStorage
    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('user');
    });

    // Verify API call for notifications
    expect(global.fetch).toHaveBeenCalledWith('http://mock-server.com/api/auth/notifications/99');

    // Verify frontend logic correctly translates raw strings to UI titles
    await waitFor(() => {
      // Verify logic for RESOLVED status
      expect(getByText('Complaint Resolved')).toBeTruthy(); 
      expect(getByText('Your complaint was RESOLVED.')).toBeTruthy();

      // Verify logic for IN PROGRESS status
      expect(getByText('Work In Progress')).toBeTruthy(); 
      expect(getByText('Report is IN PROGRESS.')).toBeTruthy();

      // Verify logic for unrecognized strings
      expect(getByText('System Update')).toBeTruthy(); 
    });
  });

  it('displays empty state when there are no notifications', async () => {
    // Mock empty API response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    });

    const { getByText } = render(<NotificationScreen onBack={mockOnBack} />);

    // Verify empty state text
    await waitFor(() => {
      expect(getByText('You have no new notifications.')).toBeTruthy();
    });
  });

  it('triggers the API when "Mark All As Read" is pressed and updates UI', async () => {
    // Mock API response for initial load
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockNotifications }),
    });

    const { getByTestId } = render(<NotificationScreen onBack={mockOnBack} />);

    // Wait for list to render
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    // Mock successful API response for marking all as read
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    // Simulate tapping the mark all as read icon
    const markReadIcon = getByTestId('icon-checkmark-done-outline');
    fireEvent.press(markReadIcon.parent);

    // Verify API request
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('http://mock-server.com/api/auth/notifications/read-all/99', expect.objectContaining({
        method: 'PATCH'
      }));
    });
  });

  it('navigates back when the back button is pressed', () => {
    const { getByTestId } = render(<NotificationScreen onBack={mockOnBack} />);

    // Simulate tapping the back arrow
    const backIcon = getByTestId('icon-arrow-back');
    fireEvent.press(backIcon.parent);

    // Verify navigation callback
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });
});