import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BASE_URL } from '../../src/config';
import { apiFetch } from '../utils/apiClient';

export default function ViewComplaintsScreen({ onNavigateToDetails, userId }) {
  // 1. STATE & HOOKS
  const [filter, setFilter] = useState('All');
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(''); 

  const SERVER_URL = BASE_URL;

  // 2. LIFECYCLE & UTILITIES
  useEffect(() => {
    fetchMyComplaints();
  }, []);

  // 3. API HANDLERS
  const fetchMyComplaints = async () => {
    try {
      const response = await apiFetch(`${SERVER_URL}/api/complaints/user/${userId || 1}`);
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setComplaints(result.data);
      } else {
        setComplaints([]);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const getStepLevelInfo = (status, authorityId) => {
    const s = status?.toUpperCase();
    if (s === 'REJECTED') return { level: 0, color: '#DC2626', width: '0%' };
    if (s === 'CANCELLED') return { level: 0, color: '#EF4444', width: '0%' }; 
    if (s === 'RESOLVED') return { level: 4, color: '#28C76F', width: '100%' };
    if (s === 'IN PROGRESS') return { level: 3, color: '#0041C7', width: '72%' };
    if (authorityId) return { level: 2, color: '#00B5D8', width: '40%' };
    return { level: 1, color: '#FFB400', width: '10%' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown Date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredComplaints = (Array.isArray(complaints) ? complaints : []).filter(c => {
    const matchesFilter = filter === 'All' || c.status?.toUpperCase() === filter.toUpperCase();
    const displayId = c.id || c.complaint_id || '';
    const formattedId = `#SL-${displayId}`.toLowerCase();
    const matchesSearch = formattedId.includes(searchQuery.toLowerCase()) || 
                          (c.title && c.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // 4. UI RENDER
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      
      <View style={styles.topNavBar}>
        <View>
          <Text style={styles.greetingText}>OVERVIEW</Text>
          <Text style={styles.navTitle}>My Reports</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by ID or Title..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
          {['All', 'Pending', 'In Progress', 'Resolved', 'Rejected', 'Cancelled'].map((tab) => (
            <TouchableOpacity 
              key={tab} 
              onPress={() => setFilter(tab)} 
              style={[styles.filterTab, filter === tab && styles.filterTabActive]}
            >
              <Text style={[styles.filterText, filter === tab && styles.filterTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color="#0041C7" style={{ marginTop: 50 }} />
        ) : filteredComplaints.length === 0 ? (
          <View style={styles.emptyContainer}>
             <Ionicons name="document-text-outline" size={60} color="#CBD5E1" />
             <Text style={styles.emptyText}>
               {searchQuery ? "No matching reports found." : "No reports found."}
             </Text>
          </View>
        ) : (
          filteredComplaints.map((item) => {
            const displayId = item.id || item.complaint_id || '0000';
            const firstImage = item.image_url ? item.image_url.split(',')[0] : null;
            const stepInfo = getStepLevelInfo(item.status, item.authority_id);

            return (
              <View key={displayId} style={styles.complaintCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.complaintId}>#SL-{displayId}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: stepInfo.color + '15' }]}>
                    <Text style={[styles.statusText, { color: stepInfo.color }]}>{item.status?.toUpperCase()}</Text>
                  </View>
                </View>
                
                <Text style={styles.complaintTitle} numberOfLines={1}>{item.title || item.category}</Text>
                
                <View style={styles.cardBody}>
                  <Image 
                    source={{ uri: firstImage ? `${SERVER_URL}${firstImage}` : 'https://via.placeholder.com/150' }} 
                    style={styles.thumbImage} 
                  />
                  <View style={styles.textContainer}>
                    <Text style={styles.descText} numberOfLines={2}>{item.description}</Text>
                    <View style={styles.dateRow}>
                      <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
                      <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
                    </View>
                  </View>
                </View>

                {item.status?.toUpperCase() !== 'CANCELLED' && item.status?.toUpperCase() !== 'REJECTED' && (
                  <View style={styles.trackerWrapper}>
                    <View style={styles.progressBarBackground}>
                      <View style={[styles.progressBarFill, { width: stepInfo.width, backgroundColor: stepInfo.color }]} />
                    </View>
                    <View style={styles.labelRow}>
                      <Text style={[styles.stepLabel, stepInfo.level >= 1 && {color: '#FFB400'}]}>Reported</Text>
                      <Text style={[styles.stepLabel, stepInfo.level >= 2 && {color: '#00B5D8'}]}>Processing</Text>
                      <Text style={[styles.stepLabel, stepInfo.level >= 3 && {color: '#0041C7'}]}>Active</Text>
                      <Text style={[styles.stepLabel, stepInfo.level >= 4 && {color: '#28C76F'}]}>Fixed</Text>
                    </View>
                  </View>
                )}

                <TouchableOpacity style={styles.viewDetailsBtn} activeOpacity={0.7} onPress={() => onNavigateToDetails(displayId)}>
                  <Text style={styles.viewDetailsText}>View Details</Text>
                  <Ionicons name="chevron-forward" size={16} color="#0041C7" />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// 5. STYLES
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topNavBar: { paddingHorizontal: 25, paddingTop: 15, paddingBottom: 15 },
  greetingText: { fontSize: 12, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  navTitle: { fontSize: 26, fontWeight: '800', color: '#0041C7' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 25, marginBottom: 20, paddingHorizontal: 15, height: 55, borderRadius: 16, borderWidth: 1.5, borderColor: '#E2E8F0' },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, color: '#1E293B' },
  filterBar: { paddingHorizontal: 25, paddingBottom: 15 },
  filterTab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#fff', marginRight: 12, borderWidth: 1, borderColor: '#E2E8F0' }, 
  filterTabActive: { backgroundColor: '#0041C7', borderColor: '#0041C7' }, 
  filterText: { fontSize: 14, color: '#64748B', fontWeight: '600' }, 
  filterTextActive: { color: '#fff', fontWeight: '700' },
  listContent: { paddingHorizontal: 25, paddingBottom: 60 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 15, fontSize: 16, fontWeight: '500' },
  
  complaintCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, borderWidth: 1, borderColor: '#F1F5F9' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  complaintId: { fontSize: 13, fontWeight: '900', color: '#0041C7' }, 
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '800' },
  complaintTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B', marginBottom: 15 },
  
  cardBody: { flexDirection: 'row', marginBottom: 20 },
  thumbImage: { width: 80, height: 80, borderRadius: 18, backgroundColor: '#F8FAFC' },
  textContainer: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  descText: { fontSize: 14, color: '#64748B', lineHeight: 20, marginBottom: 8 },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  dateText: { fontSize: 12, color: '#94A3B8', marginLeft: 6, fontWeight: '700' },
  
  trackerWrapper: { marginBottom: 25 },
  progressBarBackground: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, marginBottom: 10, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stepLabel: { fontSize: 9, fontWeight: '800', color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  viewDetailsBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', paddingVertical: 14, borderRadius: 16, borderWidth: 1.5, borderColor: '#E2E8F0' }, 
  viewDetailsText: { fontSize: 14, color: '#0041C7', fontWeight: '900', marginRight: 6 } 
});