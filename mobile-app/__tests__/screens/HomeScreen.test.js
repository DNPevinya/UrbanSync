import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '../../src/screens/HomeScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock Dependencies

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.fn().mockImplementation(({ children }) => children),
}));

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  // Assign testID based on icon name for testing
  return {
    Ionicons: (props) => <View testID={`icon-${props.name}`} {...props} />,
    MaterialCommunityIcons: (props) => <View testID={`icon-${props.name}`} {...props} />,
  };
});

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  // Mock LinearGradient component
  return { LinearGradient: (props) => <View testID="linear-gradient" {...props} /> };
});

// Mock useFocusEffect to run callback in useEffect
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useFocusEffect: jest.fn((callback) => {
      React.useEffect(() => {
        callback();
      }, []);
    }),
  };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve('en')),
}));

jest.mock('../../src/config', () => ({
  BASE_URL: 'http://mock-server.com',
}));

// Mock translations
jest.mock('../../src/translations', () => ({
  translations: {
    en: {
      greeting: 'Ayubowan,', summary: 'My Activity Summary', total: 'TOTAL REPORTS',
      active: 'ACTIVE WORK', resolved: 'RESOLVED', services: 'OUR SERVICES',
      help_today: 'How can we help today?', help_sub: 'Submit new civic requests or track your existing reports.',
      report_issue: 'Report an Issue / Request Service', report_sub: 'File civic complaints or request infrastructure maintenance.',
      track_req: 'Track My Requests', track_sub: 'Check the status and updates of your previous submissions.',
      recent: 'Recent Updates', see_all: 'See all', no_activity: 'No recent activity found.'
    }
  }
}));

// Mock Chatbot modal component
jest.mock('../../src/components/ChatbotModal', () => {
  const { View, Text } = require('react-native');
  return (props) => <View testID="chatbot-modal"><Text>{props.visible ? 'Chatbot Open' : 'Chatbot Closed'}</Text></View>;
});

jest.mock('../../src/components/NationalBadge', () => {
  const { View } = require('react-native');
  return () => <View testID="national-badge" />;
});

describe('HomeScreen Component', () => {
  const mockProps = {
    userFirstName: 'John',
    userId: '123',
    onNavigateToSubmit: jest.fn(),
    onNavigateToView: jest.fn(),
    onNavigateToDetails: jest.fn(),
    onNavigateToNotifications: jest.fn(),
  };

  beforeEach(() => {
    // Clear mock data before each test
    jest.clearAllMocks();
    
    // Mock multiple API responses based on URL
    global.fetch = jest.fn((url) => {
      if (url.includes('/api/complaints/user/')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: [
              { id: '1', status: 'IN PROGRESS', created_at: '2026-04-20', title: 'Road', category: 'Road' },
              { id: '2', status: 'RESOLVED', created_at: '2026-04-19', title: 'Streetlight', category: 'Electrical' },
              { id: '3', status: 'IN PROGRESS', created_at: '2026-04-18', title: 'Water Leak', category: 'Water' }
            ]
          })
        });
      }
      if (url.includes('/api/auth/notifications/')) {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] })
        });
      }
      // Fallback for unmatched URLs
      return Promise.resolve({ json: () => Promise.resolve({}) });
    });
  });

  it('renders the personalized greeting and branding on load', async () => {
    const { getByText } = render(<HomeScreen {...mockProps} />);
    
    // Wait for data to load
    await waitFor(() => expect(getByText('3')).toBeTruthy());
    
    expect(getByText('Ayubowan, John')).toBeTruthy();
    expect(getByText('UrbanSync')).toBeTruthy();
  });

  it('calculates and displays the correct summary statistics based on the API data', async () => {
    const { getByText } = render(<HomeScreen {...mockProps} />);
    
    await waitFor(() => {
      // Verify calculated statistics
      expect(getByText('3')).toBeTruthy(); 
      expect(getByText('2')).toBeTruthy(); 
      expect(getByText('1')).toBeTruthy(); 
      
      // Verify recent activity data is rendered
      expect(getByText('Road')).toBeTruthy(); 
    });
  });

  it('successfully fires the notification fetch request alongside the complaint fetch', async () => {
    // Mock specific notification endpoint for this test
    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/complaints/user/')) {
        return Promise.resolve({ json: () => Promise.resolve({ success: true, data: [] }) });
      }
      if (url.includes('/api/auth/notifications/')) {
        return Promise.resolve({ json: () => Promise.resolve({ success: true, data: [{ is_read: 0 }] }) });
      }
      return Promise.resolve({ json: () => Promise.resolve({}) });
    });

    render(<HomeScreen {...mockProps} />);
    
    // Check if both network requests were made
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
  });

  it('navigates to the correct screens when the primary action buttons are tapped', async () => {
    const { getByText } = render(<HomeScreen {...mockProps} />);
    await waitFor(() => expect(getByText('3')).toBeTruthy());

    // Simulate tapping Report an Issue
    fireEvent.press(getByText('Report an Issue / Request Service'));
    expect(mockProps.onNavigateToSubmit).toHaveBeenCalledTimes(1);

    // Simulate tapping Track My Requests
    fireEvent.press(getByText('Track My Requests'));
    expect(mockProps.onNavigateToView).toHaveBeenCalledTimes(1);
  });

  it('toggles the AI Chatbot modal when the floating action button is tapped', async () => {
    const { getByTestId, getByText } = render(<HomeScreen {...mockProps} />);
    await waitFor(() => expect(getByText('3')).toBeTruthy());

    // Verify Chatbot modal is initially closed
    expect(getByText('Chatbot Closed')).toBeTruthy();

    // Simulate tapping the FAB
    const fab = getByTestId('linear-gradient');
    fireEvent.press(fab);
    
    // Verify Chatbot modal is open
    await waitFor(() => expect(getByText('Chatbot Open')).toBeTruthy());
  });

  it('navigates to the details view with the correct ID when a recent activity item is tapped', async () => {
    const { getByText } = render(<HomeScreen {...mockProps} />);
    
    // Wait for recent activity data
    await waitFor(() => expect(getByText('Road')).toBeTruthy());

    // Simulate tapping a recent activity item
    fireEvent.press(getByText('Road'));
    
    // Verify navigation callback with correct ID
    expect(mockProps.onNavigateToDetails).toHaveBeenCalledWith('1');
  });
});