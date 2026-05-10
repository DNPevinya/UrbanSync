import React from 'react';
import { StyleSheet, View, Image } from 'react-native';

// 1. UI RENDER
export default function NationalBadge({ size = 'large', style }) {
  const isLarge = size === 'large';

  return (
    <View style={[styles.container, isLarge ? styles.largeContainer : styles.smallContainer, style]}>
      {/* We replaced the <Text> emoji with an <Image> component */}
      <Image 
        source={require('../../assets/images/emblem.png')} // Make sure this path is correct!
        style={isLarge ? styles.largeEmblem : styles.smallEmblem}
        resizeMode="contain"
      />
    </View>
  );
}

// 2. STYLES
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff', // Changed to white so the golden emblem pops
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0', // Softened the border
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  largeContainer: {
    width: 56, // Slightly larger to frame the emblem
    height: 56,
    borderRadius: 28,
  },
  largeEmblem: {
    width: '75%', // Leaves a nice white border around the emblem
    height: '75%',
  },
  smallContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  smallEmblem: {
    width: '75%',
    height: '75%',
  },
});