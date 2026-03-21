import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Modal } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ComplaintDetailsScreen({ onBack, onNavigateToChat, complaintId }) {
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isImageModalVisible, setImageModalVisible] = useState(false);

  const SERVER_URL = "http://192.168.8.103:5000";

  useEffect(() => {
    if (complaintId) fetchComplaintDetails();
  }, [complaintId]);

  const fetchComplaintDetails = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/complaints/${complaintId}`);
      const result = await response.json();
      if (result.success) setComplaint(result.data);
    } catch (error) {
      console.error("Error fetching details:", error);
    } finally {
      setLoading(false);
    }
  };

  // 👉 RESTORED: Your original, awesome 3-dot menu features!
  const handleOptionsClick = () => {
    Alert.alert(
      "Complaint Options",
      "What would you like to do?",
      [
        { text: "Cancel Complaint", onPress: () => Alert.alert("Cancelled", "Complaint has been withdrawn."), style: "destructive" },
        { text: "Report a Delay", onPress: () => Alert.alert("Reported", "A delay report has been sent to the authority.") },
        { text: "Close", style: "cancel" }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0041C7" />
      </SafeAreaView>
    );
  }

  if (!complaint) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={{ color: '#64748B' }}>Complaint not found.</Text>
        <TouchableOpacity onPress={onBack} style={{ marginTop: 20 }}>
          <Text style={{ color: '#0041C7' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const displayId = complaint.id || complaint.complaint_id || '0000';
  const status = complaint.status ? complaint.status.toUpperCase() : 'PENDING';
  const assignedAuthority = complaint.assigned_authority ? complaint.assigned_authority : null;
  
  // 👉 NEW: Dynamically extracts the district from your reverse-geocoded text!
  // If location_text is "Galle Road, Colombo", it grabs "Colombo" and makes it "COLOMBO DISTRICT"
  const locationText = complaint.location_text || "Unknown Location";
  const locationParts = locationText.split(',');
  const headerDistrict = locationParts.length > 1 
    ? locationParts[locationParts.length - 1].trim().toUpperCase() + " DISTRICT" 
    : "UNKNOWN DISTRICT";

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Unknown Date';
    const date = new Date(dateString);
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getStatusColor = (stat) => {
    switch (stat) {
      case 'PENDING': return '#FF9F43';
      case 'RESOLVED': return '#28C76F';
      case 'IN PROGRESS': return '#0160C9';
      default: return '#FF9F43';
    }
  };

  const statusColor = getStatusColor(status);
  const imageUrl = complaint.image_url ? `${SERVER_URL}${complaint.image_url}` : 'https://via.placeholder.com/400x200';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Modal visible={isImageModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalBackground}>
          <TouchableOpacity style={styles.closeModalBtn} onPress={() => setImageModalVisible(false)}>
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          <Image source={{ uri: imageUrl }} style={styles.fullScreenImage} resizeMode="contain" />
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerIcon}>
          <Ionicons name="chevron-back" size={24} color="#0041C7" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Complaint #SL-{displayId}</Text>
          {/* 👉 DYNAMIC HEADER DISTRICT HERE */}
          <Text style={styles.headerSubtitle}>{headerDistrict}</Text>
        </View>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
        </View>
        <Text style={styles.title}>{complaint.title || complaint.category}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color="#64748B" />
          <Text style={styles.locationText}>{locationText}</Text>
        </View>

        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.mainImage} />
          <TouchableOpacity style={styles.viewPhotoBtn} onPress={() => setImageModalVisible(true)}>
            <Ionicons name="search" size={12} color="#fff" />
            <Text style={styles.viewPhotoText}>VIEW PHOTO</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>DESCRIPTION</Text>
        <Text style={styles.descText}>{complaint.description}</Text>

        <View style={styles.authorityCard}>
          <View style={[styles.authorityIconBox, { backgroundColor: assignedAuthority ? '#0041C7' : '#94A3B8' }]}>
            <MaterialCommunityIcons name="office-building" size={20} color="#fff" />
          </View>
          <View>
            <Text style={[styles.authorityLabel, { color: assignedAuthority ? '#0041C7' : '#64748B' }]}>ASSIGNED AUTHORITY</Text>
            <Text style={[styles.authorityName, { color: assignedAuthority ? '#1E293B' : '#94A3B8' }]}>
              {assignedAuthority ? assignedAuthority : "Pending Assignment"}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>STATUS TIMELINE</Text>
        <View style={styles.timelineContainer}>
          
          <View style={styles.timelineRow}>
            <View style={styles.timelineLine} />
            <View style={[styles.timelineDot, { backgroundColor: '#0041C7' }]}>
              <Ionicons name="checkmark" size={12} color="#fff" />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitleActive}>Complaint Submitted</Text>
              <Text style={styles.timelineDate}>{formatDateTime(complaint.created_at)}</Text>
            </View>
          </View>

          <View style={styles.timelineRow}>
            <View style={[styles.timelineLine, { backgroundColor: assignedAuthority ? '#0041C7' : '#E2E8F0' }]} />
            <View style={[styles.timelineDot, { backgroundColor: assignedAuthority ? '#0041C7' : '#E2E8F0' }]}>
              {assignedAuthority ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
            </View>
            <View style={styles.timelineContent}>
              <Text style={[styles.timelineTitleActive, { color: assignedAuthority ? '#1E293B' : '#94A3B8' }]}>
                {assignedAuthority ? `Assigned to ${assignedAuthority}` : "Awaiting Assignment"}
              </Text>
              <Text style={styles.timelineDate}>
                {assignedAuthority ? (complaint.updated_at ? formatDateTime(complaint.updated_at) : "Recently Assigned") : "Pending"}
              </Text>
            </View>
          </View>

          <View style={styles.timelineRow}>
            <View style={[styles.timelineLine, { backgroundColor: status === 'RESOLVED' ? '#0041C7' : '#E2E8F0' }]} />
            <View style={[styles.timelineDot, { backgroundColor: status === 'IN PROGRESS' || status === 'RESOLVED' ? '#0041C7' : '#E2E8F0' }]}>
              {status === 'IN PROGRESS' || status === 'RESOLVED' ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
            </View>
            <View style={styles.timelineContent}>
              <Text style={[styles.timelineTitleActive, { color: status === 'IN PROGRESS' || status === 'RESOLVED' ? '#0041C7' : '#94A3B8' }]}>Work In Progress</Text>
              <Text style={styles.timelineDate}>
                {status === 'IN PROGRESS' || status === 'RESOLVED' ? "Authority is resolving issue" : "Pending start"}
              </Text>
            </View>
          </View>

          <View style={styles.timelineRow}>
            <View style={[styles.timelineDot, { backgroundColor: status === 'RESOLVED' ? '#28C76F' : '#E2E8F0' }]}>
               {status === 'RESOLVED' ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
            </View>
            <View style={styles.timelineContent}>
              <Text style={[styles.timelineTitleActive, { color: status === 'RESOLVED' ? '#1E293B' : '#94A3B8' }]}>Resolved</Text>
              <Text style={styles.timelineDate}>
                {status === 'RESOLVED' ? "Issue has been closed" : "Pending completion"}
              </Text>
            </View>
          </View>

        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.chatButton} onPress={onNavigateToChat}>
          <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
          <Text style={styles.chatButtonText}>Chat with Authority</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionsButton} onPress={handleOptionsClick}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#0041C7" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },
  modalBackground: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)', justifyContent: 'center', alignItems: 'center' },
  closeModalBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 },
  fullScreenImage: { width: '100%', height: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerIcon: { padding: 5 },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  headerSubtitle: { fontSize: 10, color: '#0D85D8', fontWeight: 'bold', letterSpacing: 1, marginTop: 2 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 10 },
  statusText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1E293B', marginBottom: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  locationText: { fontSize: 13, color: '#64748B', marginLeft: 5 },
  imageContainer: { width: '100%', height: 200, borderRadius: 16, overflow: 'hidden', marginBottom: 25, position: 'relative', backgroundColor: '#F1F5F9' },
  mainImage: { width: '100%', height: '100%' },
  viewPhotoBtn: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0, 65, 199, 0.8)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  viewPhotoText: { color: '#fff', fontSize: 10, fontWeight: 'bold', marginLeft: 5 },
  sectionLabel: { fontSize: 12, fontWeight: 'bold', color: '#0041C7', letterSpacing: 1, marginBottom: 10, marginTop: 10 },
  descText: { fontSize: 15, color: '#334155', lineHeight: 22, marginBottom: 25 },
  authorityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 15, borderRadius: 16, marginBottom: 30, borderWidth: 1, borderColor: '#E2E8F0' },
  authorityIconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  authorityLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  authorityName: { fontSize: 15, fontWeight: 'bold', marginTop: 2 },
  timelineContainer: { marginTop: 10, paddingLeft: 10 },
  timelineRow: { flexDirection: 'row', marginBottom: 25, position: 'relative' },
  timelineLine: { position: 'absolute', left: 11, top: 24, bottom: -25, width: 2 },
  timelineDot: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  timelineContent: { flex: 1, marginLeft: 15, paddingTop: 2 },
  timelineTitleActive: { fontSize: 15, fontWeight: 'bold' },
  timelineDate: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 15, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F1F5F9', alignItems: 'center', paddingBottom: 25 },
  chatButton: { flex: 1, flexDirection: 'row', backgroundColor: '#0041C7', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  chatButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginLeft: 8 },
  optionsButton: { width: 50, height: 50, backgroundColor: '#F1F5F9', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }
});