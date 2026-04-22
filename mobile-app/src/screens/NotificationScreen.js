import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../src/config'; 

const getNotificationStyle = (message) => {
  const text = message.toUpperCase();
  if (text.includes('RESOLVED')) {
    return { type: 'success', icon: 'check-circle', title: 'Complaint Resolved' };
  } else if (text.includes('IN PROGRESS')) {
    return { type: 'info', icon: 'account-hard-hat', title: 'Work In Progress' };
  } else {
    return { type: 'comment', icon: 'bell-outline', title: 'System Update' };
  }
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function NotificationScreen({ onBack }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (!userData) {
        setLoading(false);
        return;
      }
      
      const parsedUser = JSON.parse(userData);
      const userId = parsedUser.id; 
      
      const response = await fetch(`${BASE_URL}/api/auth/notifications/${userId}`);
      const result = await response.json();

      if (result.success) {
        setNotifications(result.data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, []);

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));

    try {
      const userData = await AsyncStorage.getItem('user');
      if (!userData) return;
      const userId = JSON.parse(userData).id;

      await fetch(`${BASE_URL}/api/auth/notifications/read-all/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      
      <View style={styles.topNavBar}>
        <View style={styles.navLeft}>
          <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <View>
            <Text style={styles.greetingText}>ALERTS</Text>
            <Text style={styles.navTitle}>Notifications</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.markReadBtn} onPress={markAllAsRead} activeOpacity={0.7}>
          <Ionicons name="checkmark-done-outline" size={22} color="#0041C7" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0041C7" />
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.listContent} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0041C7']} />
          }
        >
          {notifications.length === 0 ? (
            <View style={styles.endOfList}>
              <Ionicons name="notifications-off-outline" size={40} color="#CBD5E1" style={{ marginBottom: 10 }} />
              <Text style={styles.endOfListText}>You have no new notifications.</Text>
            </View>
          ) : (
            notifications.map((item) => {
              const { type, icon, title } = getNotificationStyle(item.message);
              const isUnread = Number(item.is_read) === 0;
              
              return (
                <TouchableOpacity 
                  key={item.notification_id} 
                  style={[styles.notificationCard, isUnread && styles.unreadCard]} 
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconContainer, styles[type + 'Icon']]}>
                    <MaterialCommunityIcons name={icon} size={26} color={styles[type + 'Color'].color} />
                  </View>
                  <View style={styles.textContainer}>
                    <View style={styles.titleRow}>
                      <Text style={styles.notifTitle}>{title}</Text>
                      {isUnread && <View style={styles.unreadIndicator} />}
                      <Text style={styles.notifTime}>{formatTime(item.created_at)}</Text>
                    </View>
                    <Text style={styles.notifMessage} numberOfLines={2}>
                      {item.message}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
          
          {notifications.length > 0 && (
            <View style={styles.endOfList}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#CBD5E1" />
              <Text style={styles.endOfListText}>You're all caught up!</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topNavBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 15, backgroundColor: '#F8FAFC' },
  navLeft: { flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginRight: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, borderWidth: 1, borderColor: '#E2E8F0' },
  greetingText: { fontSize: 12, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  navTitle: { fontSize: 26, fontWeight: '800', color: '#0041C7' },
  markReadBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0, 65, 199, 0.08)', justifyContent: 'center', alignItems: 'center' },

  listContent: { paddingHorizontal: 25, paddingTop: 10, paddingBottom: 40 },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  
  unreadCard: {
    backgroundColor: '#F0F7FF', 
    borderColor: '#D0E6FF',
    borderWidth: 1,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0041C7',
    marginRight: 'auto',
    marginLeft: 10,
  },

  iconContainer: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  textContainer: { flex: 1, justifyContent: 'center' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  notifTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  notifTime: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  notifMessage: { fontSize: 13, color: '#64748B', lineHeight: 20, fontWeight: '500' },
  
  successIcon: { backgroundColor: 'rgba(40, 199, 111, 0.12)' },
  successColor: { color: '#28C76F' },
  infoIcon: { backgroundColor: 'rgba(1, 96, 201, 0.12)' }, 
  infoColor: { color: '#0160C9' }, 
  commentIcon: { backgroundColor: 'rgba(28, 163, 222, 0.12)' }, 
  commentColor: { color: '#1CA3DE' }, 

  endOfList: { alignItems: 'center', justifyContent: 'center', marginTop: 30, opacity: 0.7 },
  endOfListText: { color: '#94A3B8', fontSize: 13, fontWeight: '600', marginTop: 8 }
});