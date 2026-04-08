import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TermsScreen({ onBack }) {
  return (
    <SafeAreaView style={styles.container} edges={Platform.OS === 'android' ? ['top'] : []}>
      <View style={[styles.topNavBar, Platform.OS === 'ios' && { paddingTop: 20 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#0041C7" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>User Terms</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.updateBadge}>
          <Ionicons name="information-circle" size={16} color="#0160C9" />
          <Text style={styles.lastUpdated}>Last Updated: March 2026</Text>
        </View>

        <TermSection 
          icon="checkmark-circle-outline"
          title="1. Acceptance of Terms" 
          body="By creating an account or using UrbanSync, you agree to be bound by these terms. This platform is intended for legitimate public service feedback only." 
        />

        <TermSection 
          icon="person-outline"
          title="2. User Responsibility" 
          body="Users are responsible for providing accurate information. Submitting false reports or misleading data intentionally may lead to account suspension." 
        />

        <TermSection 
          icon="chatbubble-ellipses-outline"
          title="3. Reporting Conduct" 
          body="Reports must not contain offensive language, harassment, or personal attacks against government officers. Attachments must be relevant to the issue reported." 
        />

        <TermSection 
          icon="server-outline"
          title="4. Service Availability" 
          body="While we strive for 24/7 availability, the Urban Public Services system may undergo maintenance. Resolution times are estimates and not guarantees." 
        />

        <TermSection 
          icon="lock-closed-outline"
          title="5. Account Security" 
          body="You are responsible for maintaining the confidentiality of your password. Notify support immediately if you suspect unauthorized access." 
        />

        <View style={styles.footer}>
          <Ionicons name="business-outline" size={32} color="#CBD5E1" style={{ marginBottom: 10 }} />
          <Text style={styles.footerText}>© 2026 UrbanSync Urban Services Sri Lanka</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const TermSection = ({ title, body, icon }) => (
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