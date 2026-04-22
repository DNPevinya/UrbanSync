import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HelpScreen({ onBack, onNavigateToFAQ }) {
  return (
    <SafeAreaView style={styles.container} edges={Platform.OS === 'android' ? ['top'] : []}>   
      <View style={[styles.topNavBar, Platform.OS === 'ios' && { paddingTop: 20 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#0041C7" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>How to Use</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>Follow these simple steps to report and track public service issues in your area.</Text>

        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(1, 96, 201, 0.12)' }]}>
              <Ionicons name="add-circle" size={24} color="#0160C9" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>1. Submit a Complaint</Text>
            </View>
          </View>
          <Text style={styles.stepDesc}>
            Navigate to the Home Dashboard and tap 'Submit New Complaint'. Select the relevant urban issue category, provide a detailed description, and attach photographic evidence to help authorities assess the situation quickly.
          </Text>
        </View>

        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 159, 67, 0.12)' }]}>
              <Ionicons name="location" size={24} color="#FF9F43" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>2. Automatic Tagging</Text>
            </View>
          </View>
          <Text style={styles.stepDesc}>
            UrbanSync uses your device's GPS to automatically pinpoint the exact location of the issue. This ensures your report is instantly routed to the correct department.
          </Text>
        </View>

        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(40, 199, 111, 0.12)' }]}>
              <MaterialCommunityIcons name="timeline-clock" size={24} color="#28C76F" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>3. Track Progress</Text>
            </View>
          </View>
          <Text style={styles.stepDesc}>
            Monitor your complaint's lifecycle in real-time through the 'My Complaints' tab. Watch the status dynamically update from 'Pending' to 'In Progress' as engineers are assigned, until it is 'Resolved'.
          </Text>
        </View>

        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(28, 163, 222, 0.12)' }]}>
              <Ionicons name="chatbubbles" size={24} color="#1CA3DE" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>4. Chat with Authority</Text>
            </View>
          </View>
          <Text style={styles.stepDesc}>
            Engage directly with assigned officers using the built-in chat. Provide additional details, answer queries from the field team, and receive direct updates until the issue is fixed.
          </Text>
        </View>

        <View style={styles.footerInfo}>
          <Text style={styles.footerNote}>Need more help?</Text>
          <Text style={styles.footerSub}>
            Check our <Text style={{ color: '#0041C7', fontWeight: 'bold' }} onPress={onNavigateToFAQ}>FAQ</Text> section.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  
  topNavBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#F8FAFC' },
  backBtn: { flexDirection: 'row', alignItems: 'center', width: 70 },
  backText: { color: '#0041C7', fontSize: 16, fontWeight: '600', marginLeft: 4 },
  navTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  
  content: { padding: 25 },
  intro: { fontSize: 15, color: '#64748B', lineHeight: 22, marginBottom: 25, fontWeight: '500' },
  
  stepCard: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 20, 
    borderWidth: 1.5, 
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 6
  },
  stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  iconCircle: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  stepTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
  stepDesc: { fontSize: 14, color: '#64748B', lineHeight: 22, fontWeight: '500' },
  
  footerInfo: { marginTop: 25, alignItems: 'center', paddingBottom: 50 },
  footerNote: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  footerSub: { fontSize: 14, color: '#94A3B8', marginTop: 6, fontWeight: '600' }
});