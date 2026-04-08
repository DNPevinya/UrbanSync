import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacyScreen({ onBack }) {
  return (
    <SafeAreaView style={styles.container} edges={Platform.OS === 'android' ? ['top'] : []}>
      
      <View style={[styles.topNavBar, Platform.OS === 'ios' && { paddingTop: 20 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#0041C7" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Privacy Policy</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.updateBadge}>
          <Ionicons name="information-circle" size={16} color="#0160C9" />
          <Text style={styles.lastUpdated}>Last Updated: March 2026</Text>
        </View>

        <PolicySection 
          icon="document-text-outline"
          title="1. Data Collection" 
          body="We collect your name, phone number, and location data specifically to facilitate the reporting and tracking of public service complaints." 
        />

        <PolicySection 
          icon="location-outline"
          title="2. GPS & Location" 
          body="Your GPS coordinates are only captured at the moment of complaint submission to ensure the issue is routed to the correct Municipal Council." 
        />

        <PolicySection 
          icon="share-social-outline"
          title="3. Information Sharing" 
          body="Your data is shared exclusively with relevant government authorities and assigned field officers. We never sell your data to third parties." 
        />

        <PolicySection 
          icon="shield-checkmark-outline"
          title="4. Data Security" 
          body="All communication between your device and our servers is encrypted using Industry Standard SSL/TLS protocols." 
        />

        <View style={styles.footer}>
          <Ionicons name="shield-half-outline" size={32} color="#CBD5E1" style={{ marginBottom: 10 }} />
          <Text style={styles.footerText}>By using UrbanSync, you agree to these terms.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const PolicySection = ({ title, body, icon }) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={20} color="#0160C9" />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <Text style={styles.sectionBody}>{body}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  

  topNavBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#F8FAFC' },
  backBtn: { flexDirection: 'row', alignItems: 'center', width: 70 },
  backText: { color: '#0041C7', fontSize: 16, fontWeight: '600', marginLeft: 4 },
  navTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  
  content: { padding: 25 },
  
  updateBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(1, 96, 201, 0.08)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 25 },
  lastUpdated: { fontSize: 12, color: '#0160C9', fontWeight: '700', marginLeft: 6 },
  

  sectionCard: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 20, 
    borderWidth: 1.5, 
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 5
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(1, 96, 201, 0.08)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  sectionBody: { fontSize: 14, color: '#64748B', lineHeight: 22, fontWeight: '500' },
  
  footer: { marginTop: 10, paddingBottom: 40, paddingTop: 20, alignItems: 'center' },
  footerText: { fontSize: 13, color: '#94A3B8', textAlign: 'center', fontWeight: '600', fontStyle: 'italic' }
});