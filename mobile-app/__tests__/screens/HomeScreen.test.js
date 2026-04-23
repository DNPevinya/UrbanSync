import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '../../src/screens/HomeScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// 1. MOCKS
// ==========================================
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.fn().mockImplementation(({ children }) => children),
}));

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    Ionicons: (props) => <View testID={`icon-${props.name}`} {...props} />,
    MaterialCommunityIcons: (props) => <View testID={`icon-${props.name}`} {...props} />,
  };
});

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: (props) => <View testID="linear-gradient" {...props} /> };
});

// THE FIX: Defer execution so it doesn't crash before fetchDashboardData is defined
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

jest.mock('../../src/components/ChatbotModal', () => {
  const { View, Text } = require('react-native');
  return (props) => <View testID="chatbot-modal"><Text>{props.visible ? 'Chatbot Open' : 'Chatbot Closed'}</Text></View>;
});

jest.mock('../../src/components/NationalBadge', () => {
  const { View } = require('react-native');
  return () => <View testID="national-badge" />;
});

// ==========================================
// 2. TEST SUITE
// ==========================================
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
    jest.clearAllMocks();
    
    // Smart Dual-Mock: Handles both complaints AND notifications properly
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
      return Promise.resolve({ json: () => Promise.resolve({}) });
    });
  });

  it('renders correctly and displays initial greeting and labels', async () => {
    const { getByText } = render(<HomeScreen {...mockProps} />);
    // Wait for async fetch completes before the test ends
    await waitFor(() => expect(getByText('3')).toBeTruthy());
    expect(getByText('Ayubowan, John')).toBeTruthy();
    expect(getByText('UrbanSync')).toBeTruthy();
  });

  it('fetches and displays dashboard statistics and recent activities', async () => {
    const { getByText } = render(<HomeScreen {...mockProps} />);
    
    await waitFor(() => {
      expect(getByText('3')).toBeTruthy(); // Total
      expect(getByText('2')).toBeTruthy(); // In Progress
      expect(getByText('1')).toBeTruthy(); // Resolved
      expect(getByText('Road')).toBeTruthy(); // Recent Activity Title
    });
  });

  it('fetches notification data correctly', async () => {
    // Override just for this test to show unread notifications
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
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
  });

  it('triggers navigation callbacks for services and actions', async () => {
    const { getByText } = render(<HomeScreen {...mockProps} />);
    await waitFor(() => expect(getByText('3')).toBeTruthy());

    fireEvent.press(getByText('Report an Issue / Request Service'));
    expect(mockProps.onNavigateToSubmit).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Track My Requests'));
    expect(mockProps.onNavigateToView).toHaveBeenCalledTimes(1);
  });

  it('opens and closes the chatbot modal', async () => {
    const { getByTestId, getByText } = render(<HomeScreen {...mockProps} />);
    await waitFor(() => expect(getByText('3')).toBeTruthy());

    expect(getByText('Chatbot Closed')).toBeTruthy();

    const fab = getByTestId('linear-gradient');
    fireEvent.press(fab);
    
    await waitFor(() => expect(getByText('Chatbot Open')).toBeTruthy());
  });

  it('navigates to details when an activity item is pressed', async () => {
    const { getByText } = render(<HomeScreen {...mockProps} />);
    await waitFor(() => expect(getByText('Road')).toBeTruthy());

    fireEvent.press(getByText('Road'));
    expect(mockProps.onNavigateToDetails).toHaveBeenCalledWith('1');
  });
});