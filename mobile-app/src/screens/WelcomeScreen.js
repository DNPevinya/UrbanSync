import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function WelcomeScreen({ onGetStarted }) {
  return (
    <LinearGradient colors={['#0041C7', '#0D85D8']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >       
          <View style={styles.topSection}>
            <View style={styles.iconCircle}>
              <Image 
                source={require('../../assets/images/smartlogo.png')} 
                style={styles.logoImage}
                resizeMode="cover" 
              />
            </View>
            <Text style={styles.title}>UrbanSync</Text>
            <Text style={styles.description}>
              Report Public Issues Easily and Transparently
            </Text>
          </View>

          <View style={styles.bottomSection}>
            <View style={styles.glassInfoBox}>
              <View style={styles.iconWrapper}>
                <Ionicons name="shield-checkmark" size={24} color="#3ACBE8" />
              </View>
              <Text style={styles.glassInfoText}>
                Your feedback helps build a better Sri Lanka. Direct connection to government authorities.
              </Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={onGetStarted} activeOpacity={0.8}>
              <Text style={styles.buttonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={22} color="#0160C9" />
            </TouchableOpacity>

            <Text style={styles.footerText}>AN INITIATIVE FOR A BETTER SRI LANKA</Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingVertical: 40,
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  iconCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#ffffff', 
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden', 
  },
  logoImage: {
    width: '140%',
    height: '140%',
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 16,
    color: '#E2E8F0',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
    fontWeight: '500',
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 20,
    marginTop: 40,
  },
  glassInfoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)', 
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 35, 
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)', 
  },
  iconWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 12,
    marginRight: 15,
  },
  glassInfoText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#ffffff',
    width: '100%',
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: '#0160C9',
    fontSize: 19,
    fontWeight: 'bold',
    marginRight: 12,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 11, 
    letterSpacing: 2,
    marginTop: 35,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});