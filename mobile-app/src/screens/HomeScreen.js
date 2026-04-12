import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native'; // NEW IMPORT
import { BASE_URL } from '../../src/config';

export default function HomeScreen({ 
  userFirstName, 
  userId, 
  onNavigateToSubmit, 
  onNavigateToView, 
  onNavigateToDetails, 
  onNavigateToNotifications 
}) {
  const [stats, setStats] = useState({ total: 0, inProgress: 0, resolved: 0 });
  const [recentActivities, setRecentActivities] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [loading, setLoading] = useState(true);

  const SERVER_URL = BASE_URL;

  // REPLACED useEffect WITH useFocusEffect
  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [userId])
  );

  const fetchDashboardData = async () => {
    try {
      // 1. FETCH COMPLAINTS
      const complaintsRes = await fetch(`${SERVER_URL}/api/complaints/user/${userId || 1}`);
      const complaintsResult = await complaintsRes.json();
      
      if (complaintsResult.success && Array.isArray(complaintsResult.data)) {
        const complaints = complaintsResult.data;

        const total = complaints.length;
        const inProgress = complaints.filter(c => c.status?.toUpperCase() === 'IN PROGRESS').length;
        const resolved = complaints.filter(c => c.status?.toUpperCase() === 'RESOLVED').length;
        setStats({ total, inProgress, resolved });

        const sortedComplaints = [...complaints].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const topRecent = sortedComplaints.slice(0, 3).map(c => {
          const status = c.status?.toUpperCase();
          let color = '#FF9F43'; 
          let icon = 'clock-outline';
          let desc = 'Report submitted and awaiting review.';

          if (status === 'IN PROGRESS') {
            color = '#0041C7'; 
            icon = 'tools';
            desc = 'Engineers are actively working on this.';
          } else if (status === 'RESOLVED') {
            color = '#28C76F'; 
            icon = 'check-decagram-outline';
            desc = 'Issue has been successfully resolved.';
          } else if (status === 'CANCELLED') {
            color = '#94A3B8'; 
            icon = 'close-circle-outline';
            desc = 'This complaint was withdrawn.';
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

      // 2. FETCH NOTIFICATIONS
      const notifRes = await fetch(`${SERVER_URL}/api/auth/notifications/${userId || 1}`);
      const notifData = await notifRes.json();
      if (notifData.success) {
        // FIXED TYPE CHECK: Converts "0" or 0 to a safe number
        const unreadExists = notifData.data.some(n => Number(n.is_read) === 0);
        setHasUnread(unreadExists);
      }

    } catch (error) {
      console.error("Dashboard Data Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topNavBar}>
        <View>
          <Text style={styles.greetingText}>Ayubowan, {userFirstName || 'Citizen'}</Text>
          <Text style={styles.navTitle}>UrbanSync</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn} onPress={onNavigateToNotifications} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={24} color="#1E293B" />
          {hasUnread && <View style={styles.notificationDot} />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Activity Summary</Text>
        </View>
        
        <View style={styles.statsRow}>
          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator color="#0041C7" size="large" />
            </View>
          ) : (
            <>
              <StatCard label="TOTAL REPORTS" value={stats.total} color="#1E293B" icon="file-document-outline" />
              <StatCard label="ACTIVE WORK" value={stats.inProgress} color="#0041C7" icon="tools" />
              <StatCard label="RESOLVED" value={stats.resolved} color="#28C76F" icon="check-decagram-outline" />
            </>
          )}
        </View>

        <View style={styles.servicesContainer}>
          <Text style={styles.servicesLabel}>OUR SERVICES</Text>
          <Text style={styles.helpHeading}>How can we help today?</Text>
          <Text style={styles.helpSubheading}>Submit new civic requests or track your existing reports.</Text>

          <TouchableOpacity activeOpacity={0.9} style={styles.blueCard} onPress={onNavigateToSubmit}>
            <MaterialCommunityIcons name="bullhorn" size={120} color="#ffffff" style={styles.watermarkIcon} />
            <View style={styles.blueIconCircle}>
              <MaterialCommunityIcons name="bullhorn-outline" size={20} color="#ffffff" />
            </View>
            <Text style={styles.blueCardTitle}>Report an Issue / Request Service</Text>
            <Text style={styles.blueCardDesc}>File civic complaints or request infrastructure maintenance.</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} style={styles.whiteCard} onPress={onNavigateToView}>
            <View style={styles.whiteIconSquare}>
              <MaterialCommunityIcons name="file-document-outline" size={26} color="#0041C7" />
            </View>
            <View style={styles.whiteCardTextContainer}>
              <Text style={styles.whiteCardTitle}>Track My Requests</Text>
              <Text style={styles.whiteCardDesc}>Check the status and updates of your previous submissions.</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={[styles.sectionHeader, { marginTop: 10 }]}>
            <Text style={styles.sectionTitle}>Recent Updates</Text>
            <TouchableOpacity onPress={onNavigateToView} activeOpacity={0.6}>
              <Text style={styles.seeAllLink}>See all</Text>
            </TouchableOpacity>
        </View>
        
        {loading ? (
          <ActivityIndicator color="#0041C7" style={{ marginTop: 20 }} />
        ) : recentActivities.length === 0 ? (
          <Text style={styles.emptyText}>No recent activity found.</Text>
        ) : (
          recentActivities.map((item) => (
            <TouchableOpacity key={item.id} onPress={() => onNavigateToDetails(item.id)} activeOpacity={0.7}>
              <ActivityItem {...item} />
            </TouchableOpacity>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topNavBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingTop: 15, paddingBottom: 10, backgroundColor: '#F8FAFC' },
  greetingText: { fontSize: 13, color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  navTitle: { fontSize: 26, fontWeight: '800', color: '#0041C7' },
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
  emptyText: { color: '#94A3B8', marginTop: 20, fontSize: 14, fontWeight: '500', textAlign: 'center' }
});