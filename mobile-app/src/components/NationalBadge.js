import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function NationalBadge({ size = 'large', style }) {
  const isLarge = size === 'large';

  return (
    <View style={[styles.container, isLarge ? styles.largeContainer : styles.smallContainer, style]}>
      <Text style={isLarge ? styles.largeFlag : styles.smallFlag}>🇱🇰</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    elevation: 2,
    shadowColor: '#0041C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  largeContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  largeFlag: {
    fontSize: 26,
    marginLeft: 2,
  },
  smallContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  smallFlag: {
    fontSize: 18,
    marginLeft: 1,
  },
});