import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

export const apiFetch = async (url, options = {}) => {
  const token = await AsyncStorage.getItem('urbanSyncToken');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  // Global kickout logic for expired/invalid tokens
  if (response.status === 401 || response.status === 403) {
    await AsyncStorage.removeItem('urbanSyncToken');
    await AsyncStorage.removeItem('user');
    DeviceEventEmitter.emit('authError');
  }

  return response;
};
