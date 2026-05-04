import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient'; 

import i18n from '../../src/translations'; 
import { BASE_URL } from '../../src/config';
import ChatbotModal from '../components/ChatbotModal';
import NationalBadge from '../components/NationalBadge';
import { apiFetch } from '../utils/apiClient';

export default function HomeScreen({ userFirstName, userId, onNavigateToSubmit, onNavigateToView, onNavigateToDetails, onNavigateToNotifications }) {
  // 1. STATE & HOOKS
  const [stats, setStats] = useState({ total: 0, inProgress: 0, resolved: 0 });
  const [recentActivities, setRecentActivities] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentLang, setCurrentLang] = useState('en');
  const [showChatbot, setShowChatbot] = useState(false);

  const SERVER_URL = BASE_URL;

  // 2. API HANDLERS
  const fetchDashboardData = async () => {
    try {
      const complaintsRes = await apiFetch(`${SERVER_URL}/api/complaints/user/${userId}`);
      const complaintsResult = await complaintsRes.json();
      
      if (complaintsResult.success && Array.isArray(complaintsResult.data)) {
        const complaints = complaintsResult.data;
        setStats({
          total: complaints.length,
          inProgress: complaints.filter(c => c.status?.toUpperCase() === 'IN PROGRESS').length,
          resolved: complaints.filter(c => c.status?.toUpperCase() === 'RESOLVED').length
        });

        const sortedComplaints = [...complaints].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const topRecent = sortedComplaints.slice(0, 3).map(c => {
          const status = c.status?.toUpperCase();
          let color = '#FF9F43'; 
          let icon = 'clock-outline';
          let desc = i18n.t('desc_pending', { defaultValue: 'Report submitted and awaiting review.' });

          if (status === 'IN PROGRESS') {
            color = '#0041C7'; 
            icon = 'tools';
            desc = i18n.t('desc_progress', { defaultValue: 'Engineers are actively working on this.' });
          } else if (status === 'RESOLVED') {
            color = '#28C76F'; 
            icon = 'check-decagram-outline';
            desc = i18n.t('desc_resolved', { defaultValue: 'Issue has been successfully resolved.' });
          } else if (status === 'CANCELLED') {
            color = '#94A3B8'; 
            icon = 'close-circle-outline';
            desc = i18n.t('desc_cancelled', { defaultValue: 'This complaint was withdrawn.' });
          }

          return {
            id: c.complaint_id || c.id,
            title: c.title || c.category,
            desc: desc,
            time: new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            color: color,
            icon: icon
          };
        });
        setRecentActivities(topRecent);
      }

      const notifRes = await apiFetch(`${SERVER_URL}/api/auth/notifications/${userId}`);
      const notifData = await notifRes.json();
      if (notifData.success) {
        setHasUnread(notifData.data.some(n => Number(n.is_read) === 0));
      }
    } catch (error) {
      console.error("Dashboard Data Error:", error);
    } finally {
      setLoading(false);
    }
  };


  // 3. LIFECYCLE & UTILITIES
  useFocusEffect(
    useCallback(() => {
      const loadLang = async () => {
        const savedLang = await AsyncStorage.getItem('userLanguage');
        if (savedLang) {
          setCurrentLang(savedLang);
          i18n.locale = savedLang; 
        }
      };
      loadLang();
      fetchDashboardData();
    }, [userId])
  );


  // 4. UI RENDER
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topNavBar}>
        <View>
          <Text style={styles.greetingText}>{i18n.t('greeting', { defaultValue: 'Hello,' })} {userFirstName || i18n.t('citizen_fallback', { defaultValue: 'Citizen' })}</Text>
          <Text style={styles.navTitle}>UrbanSync</Text>
        </View>

        <View style={styles.headerRightActionGroup}>
          <TouchableOpacity style={styles.notificationBtn} onPress={onNavigateToNotifications} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={24} color="#1E293B" />
            {hasUnread && <View style={styles.notificationDot} />}
          </TouchableOpacity>
          <NationalBadge size="small" style={{ marginLeft: 12 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{i18n.t('summary')}</Text>
        </View>
        
        <View style={styles.statsRow}>
          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator color="#0041C7" size="large" />
            </View>
          ) : (
            <>
              <StatCard label={i18n.t('total')} value={stats.total} color="#1E293B" icon="file-document-outline" />
              <StatCard label={i18n.t('active')} value={stats.inProgress} color="#0041C7" icon="tools" />
              <StatCard label={i18n.t('resolved')} value={stats.resolved} color="#28C76F" icon="check-decagram-outline" />
            </>
          )}
        </View>

        <View style={styles.servicesContainer}>
          <Text style={styles.servicesLabel}>{i18n.t('services')}</Text>
          <Text style={styles.helpHeading}>{i18n.t('help_today')}</Text>
          <Text style={styles.helpSubheading}>{i18n.t('help_sub')}</Text>

          <TouchableOpacity activeOpacity={0.9} style={styles.blueCard} onPress={onNavigateToSubmit}>
            <MaterialCommunityIcons name="bullhorn" size={120} color="#ffffff" style={styles.watermarkIcon} />
            <View style={styles.blueIconCircle}>
              <MaterialCommunityIcons name="bullhorn-outline" size={20} color="#ffffff" />
            </View>
            <Text style={styles.blueCardTitle}>{i18n.t('report_issue')}</Text>
            <Text style={styles.blueCardDesc}>{i18n.t('report_sub')}</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} style={styles.whiteCard} onPress={onNavigateToView}>
            <View style={styles.whiteIconSquare}>
              <MaterialCommunityIcons name="file-document-outline" size={26} color="#0041C7" />
            </View>
            <View style={styles.whiteCardTextContainer}>
              <Text style={styles.whiteCardTitle}>{i18n.t('track_req')}</Text>
              <Text style={styles.whiteCardDesc}>{i18n.t('track_sub')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={[styles.sectionHeader, { marginTop: 10 }]}>
            <Text style={styles.sectionTitle}>{i18n.t('recent')}</Text>
            <TouchableOpacity onPress={onNavigateToView} activeOpacity={0.6}>
              <Text style={styles.seeAllLink}>{i18n.t('see_all')}</Text>
            </TouchableOpacity>
        </View>
        
        {loading ? (
          <ActivityIndicator color="#0041C7" style={{ marginTop: 20 }} />
        ) : recentActivities.length === 0 ? (
          <Text style={styles.emptyText}>{i18n.t('no_activity')}</Text>
        ) : (
          recentActivities.map((item) => (
            <TouchableOpacity key={item.id} onPress={() => onNavigateToDetails(item.id)} activeOpacity={0.7}>
              <ActivityItem {...item} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <TouchableOpacity 
        style={styles.floatingBtn} 
        onPress={() => setShowChatbot(true)}
        activeOpacity={0.8}
      >
        <LinearGradient colors={['#0041C7', '#0D85D8']} style={styles.floatingGradient}>
          <Ionicons name="chatbubbles" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      <ChatbotModal visible={showChatbot} onClose={() => setShowChatbot(false)} />
    </SafeAreaView>
  );
}

// 5. HELPER COMPONENTS
const StatCard = ({ label, value, color, icon }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconWrapper, { backgroundColor: color + '15' }]}>
      <MaterialCommunityIcons name={icon} size={20} color={color} />
    </View>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const ActivityItem = ({ title, desc, time, icon, color }) => (
  <View style={styles.activityCard}>
    <View style={[styles.iconCircle, { backgroundColor: color + '15' }]}>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
    </View>
    <View style={{ flex: 1, paddingRight: 10 }}>
      <Text style={styles.actTitle}>{title}</Text>
      <Text style={styles.actDesc} numberOfLines={1}>{desc}</Text>
    </View>
    <Text style={styles.actTime}>{time}</Text>
  </View>
);

// 6. STYLES
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topNavBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingTop: 15, paddingBottom: 10, backgroundColor: '#F8FAFC' },
  greetingText: { fontSize: 13, color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  navTitle: { fontSize: 26, fontWeight: '800', color: '#0041C7' },
  headerRightActionGroup: { flexDirection: 'row', alignItems: 'center' },
  notificationBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, borderWidth: 1, borderColor: '#E2E8F0' },
  notificationDot: { position: 'absolute', top: 12, right: 14, width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#fff' },
  scrollContent: { paddingHorizontal: 25, paddingBottom: 40 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 15 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginTop: 25, letterSpacing: -0.5 },
  seeAllLink: { color: '#0041C7', fontWeight: '700', fontSize: 14, marginBottom: 2 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  statCard: { width: '31%', backgroundColor: '#fff', paddingVertical: 18, paddingHorizontal: 10, borderRadius: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 5, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  statIconWrapper: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', marginTop: 4, letterSpacing: 0.5, textAlign: 'center' },
  statValue: { fontSize: 26, fontWeight: '900', lineHeight: 30 },
  loaderContainer: { flex: 1, padding: 30, justifyContent: 'center', alignItems: 'center' },
  servicesContainer: { marginTop: 35, marginBottom: 5 },
  servicesLabel: { fontSize: 11, fontWeight: '800', color: '#0041C7', letterSpacing: 1.5, marginBottom: 8, textTransform: 'uppercase' },
  helpHeading: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 6 },
  helpSubheading: { fontSize: 13, color: '#64748B', fontWeight: '500', marginBottom: 20, lineHeight: 18 },
  blueCard: { backgroundColor: '#004AE0', borderRadius: 20, padding: 22, overflow: 'hidden', elevation: 6, shadowColor: '#004AE0', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 8, marginBottom: 15 },
  watermarkIcon: { position: 'absolute', right: -20, top: 30, opacity: 0.1, transform: [{ rotate: '-15deg' }] },
  blueIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  blueCardTitle: { fontSize: 18, fontWeight: '800', color: '#ffffff', marginBottom: 6, width: '85%' },
  blueCardDesc: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '500', lineHeight: 18, width: '90%' },
  whiteCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 5, borderWidth: 1, borderColor: '#F1F5F9' },
  whiteIconSquare: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  whiteCardTextContainer: { flex: 1, paddingRight: 10 },
  whiteCardTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 3 },
  whiteCardDesc: { fontSize: 12, color: '#64748B', fontWeight: '500', lineHeight: 16 },
  activityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 20, marginTop: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 3, borderWidth: 1, borderColor: '#F8FAFC' },
  iconCircle: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  actTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 3 },
  actDesc: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  actTime: { fontSize: 11, color: '#94A3B8', fontWeight: '800', letterSpacing: 0.5 },
  emptyText: { color: '#94A3B8', marginTop: 20, fontSize: 14, fontWeight: '500', textAlign: 'center' },
  floatingBtn: { position: 'absolute', bottom: 30, right: 25, width: 65, height: 65, borderRadius: 32.5, elevation: 8, shadowColor: '#0041C7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  floatingGradient: { width: '100%', height: '100%', borderRadius: 32.5, justifyContent: 'center', alignItems: 'center' }
});