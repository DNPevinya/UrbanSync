import React, { useState } from 'react'; 
import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen({ 
  userName,
  userEmail, 
  initialData, 
  onNavigateToEdit, 
  onNavigateToHelp, 
  onNavigateToFAQ, 
  onNavigateToTerms, 
  onNavigateToPrivacy, 
  onLogout 
}) {
  const SERVER_URL = "http://192.168.8.103:5000";

  const [imageFailed, setImageFailed] = useState(false);

  const getInitials = (fullName) => {
    if (!fullName || fullName === 'Citizen') return "??";
    const names = fullName.trim().split(/\s+/);
    if (names.length > 1) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  // --- THE SHIELD: Safe URI Generator WITH CACHE BUSTING ---
  const getProfileImage = () => {
    if (!initialData || !initialData.profilePicture || initialData.profilePicture === '' || initialData.profilePicture === 'null') {
      return null; 
    }
    
    // 👉 THE FIX: This forces React Native to fetch the NEW image instead of the cached one!
    const cacheBuster = `?t=${new Date().getTime()}`;

    if (Platform.OS === 'ios') {
      return `${SERVER_URL}/${initialData.profilePicture.replace(/\\/g, '/').replace(/^\//, '')}${cacheBuster}`;
    }
    return `${SERVER_URL}${initialData.profilePicture}${cacheBuster}`;
  };

  const finalImageUri = getProfileImage();

  return (
    <SafeAreaView style={styles.container} edges={Platform.OS === 'android' ? ['top'] : []}>
      
      <View style={[styles.header, Platform.OS === 'ios' && { paddingTop: 60 }]}>
        <Text style={styles.headerTitle}>Profile & Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          
          <View style={styles.avatarWrapper}>
            {finalImageUri && !imageFailed ? (
              <Image 
                source={{ uri: finalImageUri }} 
                style={styles.avatarImage} 
                onError={() => setImageFailed(true)}
              />
            ) : (
              <View style={styles.initialsContainer}>
                <Text style={styles.initialsText}>{getInitials(userName)}</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.userName}>{userName || 'Citizen'}</Text>
          <Text style={styles.userDetails}>{userEmail || 'email@example.com'}</Text>
        </View>

        <Text style={styles.sectionLabel}>ACCOUNT MANAGEMENT</Text>
        <MenuOption icon="person-outline" label="Edit Profile" onPress={onNavigateToEdit} />

        <Text style={styles.sectionLabel}>SUPPORT & LEGAL</Text>
        <MenuOption icon="help-circle-outline" label="Help & Instructions" onPress={onNavigateToHelp} />
        <MenuOption icon="chatbubbles-outline" label="FAQ" onPress={onNavigateToFAQ} />
        
        <MenuOption icon="document-text-outline" label="User Terms" onPress={onNavigateToTerms} />
        <MenuOption icon="shield-checkmark-outline" label="Privacy Policy" onPress={onNavigateToPrivacy} />

        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>Urban Public Services Management System</Text>
          <Text style={styles.versionText}>VERSION 1.0 • SRI LANKA GOV</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const MenuOption = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuIconContainer}>
      <Ionicons name={icon} size={22} color="#0160C9" /> 
    </View>
    <Text style={styles.menuLabel}>{label}</Text>
    <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20, alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0041C7' },
  scrollContent: { padding: 20 },
  profileHeader: { alignItems: 'center', marginBottom: 30 },
  avatarWrapper: { width: 100, height: 100, borderRadius: 50, marginBottom: 15, overflow: 'hidden', borderWidth: 2, borderColor: '#3ACBE8', backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: '100%', height: '100%' },
  initialsContainer: { width: '100%', height: '100%', backgroundColor: '#3ACBE820', justifyContent: 'center', alignItems: 'center' },
  initialsText: { fontSize: 32, fontWeight: 'bold', color: '#0160C9' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#000000' },
  userDetails: { fontSize: 14, color: '#1CA3DE' },
  sectionLabel: { fontSize: 11, fontWeight: 'bold', color: '#0D85D8', letterSpacing: 1, marginBottom: 15, marginTop: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  menuIconContainer: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(58, 203, 232, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuLabel: { flex: 1, fontSize: 16, color: '#000000', fontWeight: '500' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', padding: 16, borderRadius: 16, marginTop: 20 },
  logoutText: { marginLeft: 10, color: '#EF4444', fontWeight: 'bold', fontSize: 16 },
  footerInfo: { marginTop: 40, alignItems: 'center' },
  footerText: { fontSize: 12, color: '#94A3B8', marginBottom: 4 },
  versionText: { fontSize: 10, color: '#CBD5E1', fontWeight: 'bold' }
});