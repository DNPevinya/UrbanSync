import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoadingScreen({ onFinish }) {
  // --- Animation Setup ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000, // 1 second fade in
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5, // Adds a bounce
        useNativeDriver: true,
      })
    ]).start();

    // Move to the next screen after 2.5 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 2500); 

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient colors={['#0041C7', '#0D85D8']} style={styles.container}>
      
      <Animated.View style={[
        styles.logoContainer, 
        { 
          opacity: fadeAnim, 
          transform: [{ scale: scaleAnim }] 
        }
      ]}>
        
        <View style={styles.iconCircle}>
          <Image 
            source={require('../../assets/images/smartlogo.png')} 
            style={styles.logoImage}
            resizeMode="cover"
          />
        </View>
        
        <Text style={styles.logoText}>UrbanSync</Text>
      </Animated.View>
      
      <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ffffff" style={{ marginBottom: 15 }} />
        <Text style={styles.loadingText}>Initializing System...</Text>
      </Animated.View>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70, 
    backgroundColor: '#ffffff', 
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8, 
    overflow: 'hidden',
  },
  logoImage: {
    width: '75%', 
    height: '75%',
  },
  logoText: {
    color: '#fff',
    fontSize: 34,
    fontWeight: 'bold',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
    letterSpacing: 2,
    opacity: 0.9,
    fontWeight: '600',
  },
});