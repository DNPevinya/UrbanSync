import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ViewComplaintsScreen({ onNavigateToDetails, userId }) {
  const [filter, setFilter] = useState('All');
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 👉 Search state is now always active
  const [searchQuery, setSearchQuery] = useState(''); 

  const SERVER_URL = "http://192.168.8.103:5000";

  useEffect(() => {
    fetchMyComplaints();
  }, []);

  const fetchMyComplaints = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/complaints/user/${userId || 1}`);
      const result = await response.json();
      
      // Safety check to ensure we get an array
      if (result.success && Array.isArray(result.data)) {
        setComplaints(result.data);
      } else {
        setComplaints([]);
      }
    } catch (error) {
      console.error("Error fetching complaints:", error);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return '#FF9F43';
      case 'RESOLVED': return '#28C76F';
      case 'IN PROGRESS': return '#0160C9';
      default: return '#FF9F43'; // Default to pending
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown Date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Safe filtering logic
  const safeComplaints = Array.isArray(complaints) ? complaints : [];
  
  const filteredComplaints = safeComplaints.filter(c => {
    const matchesFilter = filter === 'All' || c.status?.toUpperCase() === filter.toUpperCase();
    
    // Check both id and complaint_id depending on your database column names
    const displayId = c.id || c.complaint_id || '';
    const formattedId = `#SL-${displayId}`.toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    
    const matchesSearch = formattedId.includes(searchLower) || (c.title && c.title.toLowerCase().includes(searchLower));

    return matchesFilter && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      
      {/* 👉 Clean Header (No Filter Icon) */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Complaints</Text>
      </View>

      {/* 👉 Permanent Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by ID or Title..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
          {['All', 'Pending', 'In Progress', 'Resolved'].map((tab) => (
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
          <Text style={{ textAlign: 'center', color: '#64748B', marginTop: 50 }}>
            {searchQuery ? "No matching complaints found." : "No complaints found."}
          </Text>
        ) : (
          filteredComplaints.map((item, index) => {
            // 👉 ABSOLUTE FIX FOR THE KEY ERROR: Uses index as an unbreakable fallback
            const displayId = item.id || item.complaint_id || '0000';
            const uniqueKey = displayId !== '0000' ? displayId.toString() : index.toString();

            return (
              <View key={uniqueKey} style={styles.complaintCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.complaintId}>#SL-{displayId}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status?.toUpperCase() || 'PENDING'}</Text>
                  </View>
                </View>
                
                <Text style={styles.complaintTitle}>{item.title || item.category}</Text>
                
                <View style={styles.cardBody}>
                  <Image 
                    source={{ uri: item.image_url ? `${SERVER_URL}${item.image_url}` : 'https://via.placeholder.com/150' }} 
                    style={styles.thumbImage} 
                  />
                  <View style={styles.textContainer}>
                    <Text style={styles.descText} numberOfLines={3}>{item.description}</Text>
                    <View style={styles.dateRow}>
                      <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
                      <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
                    </View>
                  </View>
                </View>

                {item.status?.toUpperCase() === 'IN PROGRESS' && (
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: '60%' }]} />
                  </View>
                )}

                <TouchableOpacity style={styles.viewDetailsBtn} onPress={() => onNavigateToDetails(displayId)}>
                  <Text style={styles.viewDetailsText}>View Details</Text>
                  <Ionicons name="chevron-forward" size={14} color="#0041C7" />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1E293B' },
  
  // 👉 NEW SEARCH BAR STYLES
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 15, paddingHorizontal: 15, height: 45, borderRadius: 12, borderWidth: 1, borderColor: '#3ACBE8' },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, color: '#1E293B' },

  filterBar: { paddingHorizontal: 20, paddingBottom: 15 },
  filterTab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', marginRight: 10, borderWidth: 1, borderColor: '#3ACBE8' }, 
  filterTabActive: { backgroundColor: '#0041C7', borderColor: '#0041C7' }, 
  filterText: { fontSize: 13, color: '#0D85D8', fontWeight: '500' }, 
  filterTextActive: { color: '#fff' },
  
  listContent: { padding: 20, paddingBottom: 60 },
  complaintCard: { backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, borderWidth: 1, borderColor: '#F1F5F9' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  complaintId: { fontSize: 12, fontWeight: 'bold', color: '#0160C9' }, 
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  complaintTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 12 },
  cardBody: { flexDirection: 'row', marginBottom: 15 },
  thumbImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#3ACBE8' },
  textContainer: { flex: 1, marginLeft: 15 },
  descText: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  dateText: { fontSize: 11, color: '#94A3B8', marginLeft: 5 },
  progressContainer: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, marginBottom: 15, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#0D85D8' }, 
  viewDetailsBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(58, 203, 232, 0.1)', padding: 12, borderRadius: 12 }, 
  viewDetailsText: { fontSize: 13, color: '#0041C7', fontWeight: 'bold', marginRight: 5 } 
});