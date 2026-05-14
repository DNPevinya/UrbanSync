import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ComplaintDetailsScreen from '../../src/screens/ComplaintDetailsScreen';


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

// Mock WebView component
jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return {
    WebView: (props) => <View testID="mock-webview" {...props} />,
  };
});

jest.mock('../../src/config', () => ({
  BASE_URL: 'http://mock-server.com',
}));

// Mock API calls
global.fetch = jest.fn();

describe('ComplaintDetailsScreen', () => {
  const mockOnBack = jest.fn();
  const mockComplaintId = '12345';

  // Mock API response data
  const mockComplaintData = {
    id: mockComplaintId,
    title: 'Huge Pothole on Main St',
    category: 'Roads',
    description: 'There is a massive pothole causing traffic near the junction.',
    status: 'IN PROGRESS',
    location_text: 'Main St, Colombo',
    latitude: 6.9271,
    longitude: 79.8612,
    authority_name: 'Road Development Authority',
    created_at: '2023-10-01T10:00:00Z',
    image_url: '/uploads/img1.jpg,/uploads/img2.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks(); // Clear mock data before each test
    // Mock Alert dialog
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('shows a loading spinner before the API responds', () => {
    // Simulate a pending API request to test loading state
    global.fetch.mockReturnValue(new Promise(() => {}));

    const { getByText } = render(
      <ComplaintDetailsScreen onBack={mockOnBack} complaintId={mockComplaintId} />
    );

    expect(getByText('Loading Details...')).toBeTruthy();
  });

  it('shows an error screen with a back button if the complaint is deleted or fails to load', async () => {
    // Mock empty API response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: false, data: null }),
    });

    const { getByText } = render(
      <ComplaintDetailsScreen onBack={mockOnBack} complaintId={mockComplaintId} />
    );

    // Wait for error message to render
    await waitFor(() => {
      expect(getByText('Complaint not found.')).toBeTruthy();
    });

    // Verify back button functionality
    fireEvent.press(getByText('Go Back'));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('loads the complaint data and renders the text, images, and map correctly', async () => {
    // Mock successful API response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockComplaintData }),
    });

    const { getByText, getByTestId } = render(
      <ComplaintDetailsScreen onBack={mockOnBack} complaintId={mockComplaintId} />
    );

    await waitFor(() => {
      // Check if complaint details are displayed
      expect(getByText('Huge Pothole on Main St')).toBeTruthy();
      expect(getByText('There is a massive pothole causing traffic near the junction.')).toBeTruthy();
      expect(getByText('Main St, Colombo')).toBeTruthy();
      expect(getByText('#SL-12345')).toBeTruthy();
      expect(getByText('IN PROGRESS')).toBeTruthy();
      
      // Check if status information is displayed
      expect(getByText('Road Development Authority')).toBeTruthy();
      expect(getByText('Work In Progress')).toBeTruthy();

      // Check if WebView is rendered
      expect(getByTestId('mock-webview')).toBeTruthy();
    });
  });

  it('allows the user to tap an image to view it full-screen', async () => {
    // Mock successful API response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockComplaintData }),
    });

    const { getByText, getAllByTestId, getByTestId } = render(
      <ComplaintDetailsScreen onBack={mockOnBack} complaintId={mockComplaintId} />
    );

    await waitFor(() => expect(getByText('Huge Pothole on Main St')).toBeTruthy());

    // Find the image expansion icon
    const expandIcons = getAllByTestId('icon-expand');
    expect(expandIcons.length).toBeGreaterThan(0);

    // Simulate tapping the expansion icon
    fireEvent.press(expandIcons[0]);

    // Check if close button is visible
    const closeBtn = getByTestId('icon-close-circle');
    expect(closeBtn).toBeTruthy();

    // Simulate clicking the close button
    fireEvent.press(closeBtn);
  });

  it('handles the complex "Cancel Complaint" flow and hits the PATCH endpoint', async () => {
    // Mock API responses for initial load and cancellation
    global.fetch
      .mockResolvedValueOnce({ // Mock initial load
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockComplaintData }),
      })
      .mockResolvedValueOnce({ // Mock cancel request
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    const { getByText } = render(
      <ComplaintDetailsScreen onBack={mockOnBack} complaintId={mockComplaintId} />
    );

    // Wait for Cancel Complaint button
    await waitFor(() => expect(getByText('Cancel Complaint')).toBeTruthy());

    // Simulate clicking the Cancel Complaint button
    const cancelBtn = getByText('Cancel Complaint');
    fireEvent.press(cancelBtn);

    // Check if confirmation alert is displayed
    expect(Alert.alert).toHaveBeenCalledWith(
      'Cancel Complaint',
      'Are you sure you want to withdraw this complaint? This cannot be undone.',
      expect.any(Array)
    );

    // Simulate clicking the Yes button in the alert
    const confirmButton = Alert.alert.mock.calls[0][2].find(b => b.style === 'destructive');
    confirmButton.onPress();

    // Check consequences of cancellation
    await waitFor(() => {
      // Check if API request is made with correct payload
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/complaints/update-status/${mockComplaintId}`),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'CANCELLED' })
        })
      );
      
      // Check if success message is displayed and navigation occurs
      expect(Alert.alert).toHaveBeenCalledWith('Withdrawn', 'Your complaint has been cancelled.');
      expect(mockOnBack).toHaveBeenCalled();
    });
  });
});