import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SubmitComplaintScreen from '../../src/screens/SubmitComplaintScreen';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

// Force the component to use the expo-location fallback instead of a real API call
process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY = 'PASTE_YOUR_API_KEY_HERE';

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

jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useFocusEffect: jest.fn((callback) => {
      React.useEffect(() => { callback(); }, []);
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
      new_report: 'New Report', back: 'Back',
      cat_label: '1. Category', need_help: 'Need help choosing?',
      issue_label: '2. Issue / Request Type',
      desc_label: '3. Description', desc_placeholder: 'Describe the issue or request in detail...',
      photo_label: '4. Photos (Max 3)', camera: 'Camera', gallery: 'Gallery',
      loc_label: '5. Location', search_loc: 'Search location...', find: 'Find',
      submit_btn: 'Submit Report',
      categories: {}, issues: {}
    }
  }
}));

// Mock MapView with ref support
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  const MockMapView = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      animateToRegion: jest.fn(),
      animateCamera: jest.fn(),
    }));
    return <View testID="map-view" {...props}>{props.children}</View>;
  });

  return {
    __esModule: true,
    default: MockMapView,
    Marker: (props) => <View testID="map-marker" {...props} />,
    PROVIDER_GOOGLE: 'google',
  };
});

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 6.9271, longitude: 79.8612 }
  }),
  reverseGeocodeAsync: jest.fn().mockResolvedValue([{ 
    street: 'Galle Face', city: 'Colombo', region: 'Western' 
  }]),
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

global.FormData = class FormData {
  constructor() { this.data = []; }
  append(key, value) { this.data.push({ key, value }); }
};

// ==========================================
// 2. TEST SUITE
// ==========================================
describe('SubmitComplaintScreen Component', () => {
  const mockOnBack = jest.fn();
  const mockUserId = '123';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    
    // Mock successful API submission
    global.fetch = jest.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true, message: 'Success' })
    }));
  });

  it('renders form elements, map, and auto-fetches location correctly', async () => {
    const { getByText, getByPlaceholderText, getByTestId } = render(
      <SubmitComplaintScreen onBack={mockOnBack} userId={mockUserId} />
    );

    // Because of process.env trick, it will now successfully set Galle Face, Colombo
    await waitFor(() => {
      expect(getByText('New Report')).toBeTruthy();
      expect(getByPlaceholderText('Describe the issue or request in detail...')).toBeTruthy();
      expect(getByTestId('map-view')).toBeTruthy();
      expect(getByText('Galle Face, Colombo')).toBeTruthy();
    });
  });

  it('handles gallery photo selection properly', async () => {
    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://mock-gallery-image.jpg' }]
    });

    const { getByText } = render(
      <SubmitComplaintScreen onBack={mockOnBack} userId={mockUserId} />
    );

    await waitFor(() => expect(getByText('Gallery')).toBeTruthy());

    fireEvent.press(getByText('Gallery'));

    await waitFor(() => {
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
    });
  });

  it('handles camera photo selection and reads EXIF data', async () => {
    ImagePicker.launchCameraAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ 
        uri: 'file://mock-camera-image.jpg',
        exif: { GPSLatitude: 7.0, GPSLongitude: 80.0, GPSLatitudeRef: 'N', GPSLongitudeRef: 'E' }
      }]
    });

    const { getByText } = render(
      <SubmitComplaintScreen onBack={mockOnBack} userId={mockUserId} />
    );

    await waitFor(() => expect(getByText('Camera')).toBeTruthy());

    fireEvent.press(getByText('Camera'));

    await waitFor(() => {
      expect(ImagePicker.launchCameraAsync).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        'Location Detected',
        'Move map pin to photo location?',
        expect.any(Array)
      );
    });
  });

  it('shows validation error if attempting to submit an empty form', async () => {
    const { getByText } = render(
      <SubmitComplaintScreen onBack={mockOnBack} userId={mockUserId} />
    );

    await waitFor(() => expect(getByText('Submit Report')).toBeTruthy());

    fireEvent.press(getByText('Submit Report'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Required',
        'Please provide description and at least one photo.'
      );
    });
  });

  it('successfully submits a complete complaint payload to the backend', async () => {
    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://final-test-image.jpg' }]
    });

    const { getByText, getByPlaceholderText } = render(
      <SubmitComplaintScreen onBack={mockOnBack} userId={mockUserId} />
    );

    await waitFor(() => expect(getByText('Galle Face, Colombo')).toBeTruthy());

    // 1. Fill Text
    fireEvent.changeText(
      getByPlaceholderText('Describe the issue or request in detail...'),
      'Dangerous pothole needs fixing.'
    );

    // 2. Add Photo
    fireEvent.press(getByText('Gallery'));
    await waitFor(() => expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled());

    // 3. Submit
    fireEvent.press(getByText('Submit Report'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        'Report Submitted!',
        expect.any(Array)
      );
    });
  });
});