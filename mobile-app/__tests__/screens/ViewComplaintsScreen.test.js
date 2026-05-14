import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ViewComplaintsScreen from '../../src/screens/ViewComplaintsScreen';

// Mock Dependencies 

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.fn().mockImplementation(({ children }) => children),
}));

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    Ionicons: (props) => <View testID={`icon-${props.name}`} {...props} />,
  };
});

jest.mock('../../src/config', () => ({
  BASE_URL: 'http://mock-server.com',
}));

// Mock API requests
global.fetch = jest.fn();

// Mock API response data
const mockComplaints = [
  { 
    id: 1, 
    title: 'Broken Water Pipe', 
    description: 'Massive leak on Main St.', 
    status: 'PENDING', 
    created_at: '2026-04-20T10:00:00Z', 
    authority_id: null 
  },
  { 
    id: 2, 
    title: 'Noise Complaint', 
    description: 'Loud construction at night.', 
    status: 'RESOLVED', 
    created_at: '2026-04-21T10:00:00Z', 
    authority_id: 5 
  },
  { 
    complaint_id: 3, // Test fallback ID logic
    title: 'Deep Pothole', 
    description: 'Damaging cars on 5th Ave.', 
    status: 'IN PROGRESS', 
    created_at: '2026-04-22T10:00:00Z', 
    authority_id: 2 
  },
];

describe('ViewComplaintsScreen', () => {
  const mockOnNavigateToDetails = jest.fn();
  const testUserId = 99;

  beforeEach(() => {
    // Clear mock data before each test
    jest.clearAllMocks();
  });

  it('fetches complaints on mount and renders them correctly', async () => {
    // Mock successful API response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockComplaints }),
    });

    const { getByText } = render(
      <ViewComplaintsScreen onNavigateToDetails={mockOnNavigateToDetails} userId={testUserId} />
    );

    // Verify API call is made
    expect(global.fetch).toHaveBeenCalledWith(`http://mock-server.com/api/complaints/user/${testUserId}`);

    // Verify complaints are rendered
    await waitFor(() => {
      expect(getByText('Broken Water Pipe')).toBeTruthy();
      expect(getByText('Noise Complaint')).toBeTruthy();
      expect(getByText('Deep Pothole')).toBeTruthy();
      
      // Verify formatted ID
      expect(getByText('#SL-1')).toBeTruthy(); 
    });
  });

  it('displays the empty state when no complaints are returned or the fetch fails', async () => {
    // Mock API error
    global.fetch.mockRejectedValueOnce(new Error('Network failure'));

    const { getByText } = render(<ViewComplaintsScreen onNavigateToDetails={mockOnNavigateToDetails} />);

    // Verify error message
    await waitFor(() => {
      expect(getByText('No reports found.')).toBeTruthy();
    });
  });

  it('filters the list when a status tab is pressed', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockComplaints }),
    });

    const { getByText, queryByText } = render(<ViewComplaintsScreen onNavigateToDetails={mockOnNavigateToDetails} />);

    // Wait for list to load
    await waitFor(() => expect(getByText('Broken Water Pipe')).toBeTruthy());

    // Simulate tapping "Resolved"
    fireEvent.press(getByText('Resolved'));

    // Verify filtered list
    await waitFor(() => {
      expect(getByText('Noise Complaint')).toBeTruthy();
      expect(queryByText('Broken Water Pipe')).toBeNull();
      expect(queryByText('Deep Pothole')).toBeNull();
    });
  });

  it('filters the list based on search query input', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockComplaints }),
    });

    const { getByText, getByPlaceholderText, queryByText } = render(
      <ViewComplaintsScreen onNavigateToDetails={mockOnNavigateToDetails} />
    );

    await waitFor(() => expect(getByText('Deep Pothole')).toBeTruthy());

    const searchInput = getByPlaceholderText('Search by ID or Title...');

    // Test searching by keyword
    fireEvent.changeText(searchInput, 'Pothole');
    await waitFor(() => {
      expect(getByText('Deep Pothole')).toBeTruthy();
      expect(queryByText('Broken Water Pipe')).toBeNull();
    });

    // Test searching by ID
    fireEvent.changeText(searchInput, 'SL-1');
    await waitFor(() => {
      expect(getByText('Broken Water Pipe')).toBeTruthy();
      expect(queryByText('Deep Pothole')).toBeNull();
    });
  });

  it('triggers onNavigateToDetails with the correct ID when "View Details" is pressed', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockComplaints }),
    });

    const { getAllByText, getByText } = render(
      <ViewComplaintsScreen onNavigateToDetails={mockOnNavigateToDetails} />
    );

    await waitFor(() => expect(getByText('Broken Water Pipe')).toBeTruthy());

    // Simulate tapping "View Details"
    const viewDetailsButtons = getAllByText('View Details');
    fireEvent.press(viewDetailsButtons[0]);

    // Verify navigation callback
    expect(mockOnNavigateToDetails).toHaveBeenCalledWith(1);
  });
});