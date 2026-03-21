import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen({ 
  userFirstName, 
  userId, 
  onNavigateToSubmit, 
  onNavigateToView, 
  onNavigateToDetails, 
  onNavigateToNotifications 
}) {
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  const SERVER_URL = "http://192.168.8.103:5000";

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/complaints/stats/${userId || 1}`);
      const data = await response.json();
      setStats({
        total: data.total || 0,
        pending: data.pending || 0,
        resolved: data.resolved || 0
      });
    } catch (error) {
      console.error("Dashboard Stats Error:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const activities = [
    { id: 1, title: 'Waste Management', desc: 'Complaint #CMB-4920 resolved.', time: '2H AGO', color: '#28C76F', icon: 'check-circle' },
    { id: 2, title: 'Street Light Repair', desc: 'Assigned to Urban Dept.', time: 'YESTERDAY', color: '#FF9F43', icon: 'dots-horizontal-circle' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greetingText}>Ayubowan {userFirstName},</Text>
          <Text style={styles.headerTitle}>Home Dashboard</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn} onPress={onNavigateToNotifications}>
          <Ionicons name="notifications-outline" size={24} color="#0041C7" />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.subLabel}>MY COMPLAINT SUMMARY</Text>
        <View style={styles.statsRow}>
          {loadingStats ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator color="#0041C7" />
            </View>
          ) : (
            <>
              <StatCard label="TOTAL" value={stats.total} color="#0041C7" />
              <StatCard label="PENDING" value={stats.pending} color="#1CA3DE" />
              <StatCard label="RESOLVED" value={stats.resolved} color="#28C76F" />
            </>
          )}
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity activeOpacity={0.7} onPress={onNavigateToSubmit}>
          <LinearGradient colors={['#0041C7', '#0D85D8']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.primaryAction}>
            <View style={styles.actionIconContainer}><Ionicons name="add-circle-outline" size={24} color="#fff" /></View>
            <Text style={styles.primaryActionText}>Submit New Complaint</Text>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryAction} onPress={onNavigateToView}>
          <View style={[styles.actionIconContainer, { backgroundColor: '#3ACBE820' }]}>
            <Ionicons name="list-outline" size={24} color="#0160C9" />
          </View>
          <Text style={styles.secondaryActionText}>View My Complaints</Text>
          <Ionicons name="chevron-forward" size={20} color="#64748B" />
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={onNavigateToView}><Text style={styles.seeAllLink}>See all</Text></TouchableOpacity>
        </View>
        
        {activities.map((item) => (
          <TouchableOpacity key={item.id} onPress={onNavigateToDetails} activeOpacity={0.7}>
            <ActivityItem {...item} />
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>City Pulse & Services</Text>
        <Text style={styles.mapInfo}>Explore active utility points and local authorities</Text>
        <View style={styles.mapContainer}>
          <MapView 
            style={styles.map} 
            initialRegion={{ latitude: 6.9271, longitude: 79.8612, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
          >
            <Marker 
              coordinate={{ latitude: 6.9271, longitude: 79.8612 }} 
              title="Colombo Municipal Council"
              description="Local Authority Headquarters"
              pinColor="#0041C7" 
            />
          </MapView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const StatCard = ({ label, value, color }) => (
  <View style={styles.statCard}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
  </View>
);

const ActivityItem = ({ title, desc, time, icon, color }) => (
  <View style={styles.activityCard}>
    <View style={[styles.iconCircle, { backgroundColor: color + '15' }]}>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.actTitle}>{title}</Text>
      <Text style={styles.actDesc}>{desc}</Text>
    </View>
    <Text style={styles.actTime}>{time}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 25, paddingTop: 10 },
  greetingText: { fontSize: 13, color: '#64748B' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#0041C7' },
  subLabel: { fontSize: 10, fontWeight: 'bold', color: '#94A3B8', paddingHorizontal: 25, marginTop: 15, letterSpacing: 1 },
  notificationBtn: { width: 45, height: 45, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 3 },
  notificationDot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: '#fff' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  statCard: { width: '31%', backgroundColor: '#fff', padding: 15, borderRadius: 18, elevation: 2 },
  statLabel: { fontSize: 10, fontWeight: 'bold', color: '#94A3B8' },
  statValue: { fontSize: 24, fontWeight: 'bold' },
  loaderContainer: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginTop: 25, marginBottom: 15 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seeAllLink: { color: '#0160C9', fontWeight: 'bold', marginTop: 10 },
  primaryAction: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 18, elevation: 4 },
  secondaryAction: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 18, backgroundColor: '#fff', marginTop: 12, elevation: 2 },
  actionIconContainer: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  primaryActionText: { flex: 1, color: '#fff', fontSize: 16, fontWeight: 'bold' },
  secondaryActionText: { flex: 1, color: '#1E293B', fontSize: 16, fontWeight: '600' },
  activityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 18, marginTop: 12 },
  iconCircle: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  actTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },
  actDesc: { fontSize: 12, color: '#64748B' },
  actTime: { fontSize: 10, color: '#94A3B8', fontWeight: 'bold' },
  mapInfo: { fontSize: 12, color: '#64748B', marginTop: -10, marginBottom: 10 },
  mapContainer: { height: 200, borderRadius: 20, overflow: 'hidden', marginTop: 5, borderWidth: 1, borderColor: '#E2E8F0' },
  map: { width: '100%', height: '100%' },
});