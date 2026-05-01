import React, { useState, useCallback } from 'react'; 
import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../../src/translations'; 
import { BASE_URL } from '../../src/config';

import NationalBadge from '../components/NationalBadge';

export default function ProfileScreen({ userName, userEmail, initialData, onNavigateToEdit, onNavigateToHelp, onNavigateToFAQ, onNavigateToTerms, onNavigateToPrivacy, onLogout }) {
  // 1. STATE & HOOKS
  const SERVER_URL = BASE_URL;
  const [imageFailed, setImageFailed] = useState(false);

  const [currentLang, setCurrentLang] = useState('en');

  // 2. LIFECYCLE & UTILITIES
  useFocusEffect(
    useCallback(() => {
      const loadLang = async () => {
        const savedLang = await AsyncStorage.getItem('userLanguage');
        if (savedLang) setCurrentLang(savedLang);
      };
      loadLang();
    }, [])
  );

  const changeLanguage = async (lang) => {
    setCurrentLang(lang);
    await AsyncStorage.setItem('userLanguage', lang);
  };

  const t = translations[currentLang]; 

  // 3. HELPER FUNCTIONS
  const getInitials = (fullName) => {
    if (!fullName || fullName === 'Citizen') return "??";
    const names = fullName.trim().split(/\s+/);
    if (names.length > 1) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  const getProfileImage = () => {
    if (!initialData || !initialData.profilePicture || initialData.profilePicture === '' || initialData.profilePicture === 'null') {
      return null; 
    }
    const cacheBuster = `?t=${new Date().getTime()}`;
    if (initialData.profilePicture.startsWith('http')) {
       return `${initialData.profilePicture}${cacheBuster}`;
    }
    if (Platform.OS === 'ios') {
      return `${SERVER_URL}/${initialData.profilePicture.replace(/\\/g, '/').replace(/^\//, '')}${cacheBuster}`;
    }
    return `${SERVER_URL}${initialData.profilePicture}${cacheBuster}`;
  };

  const finalImageUri = getProfileImage();

  // 4. UI RENDER
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topNavBar}>
        <View>
          <Text style={styles.greetingText}>{t.settings}</Text>
          <Text style={styles.navTitle}>{t.my_profile}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <NationalBadge size="small" />
          <TouchableOpacity style={[styles.editBtn, { marginLeft: 12 }]} onPress={onNavigateToEdit} activeOpacity={0.7}>
            <Ionicons name="pencil" size={20} color="#0041C7" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarWrapper}>
            {finalImageUri && !imageFailed ? (
              <Image source={{ uri: finalImageUri }} style={styles.avatarImage} onError={() => setImageFailed(true)} />
            ) : (
              <View style={styles.initialsContainer}>
                <Text style={styles.initialsText}>{getInitials(userName)}</Text>
              </View>
            )}
          </View>
          <View style={styles.profileTextInfo}>
            <Text style={styles.userName} numberOfLines={1}>{userName || 'Citizen'}</Text>
            <Text style={styles.userDetails} numberOfLines={1}>{userEmail || 'email@example.com'}</Text>
            
            {initialData?.nic && (
               <View style={styles.nicBadge}>
                 <Ionicons name="card-outline" size={12} color="#64748B" />
                 <Text style={styles.nicText}>{initialData.nic}</Text>
               </View>
            )}

            {initialData?.district && (
               <View style={styles.locationBadge}>
                 <Ionicons name="location-outline" size={12} color="#0160C9" />
                 <Text style={styles.locationText}>{initialData.district}</Text>
               </View>
            )}
          </View>
        </View>

        <Text style={styles.sectionLabel}>{t.change_lang}</Text>
        <View style={styles.langToggleContainer}>
            {['en', 'si', 'ta'].map((lang) => (
              <TouchableOpacity 
                key={lang} 
                onPress={() => changeLanguage(lang)} 
                style={[styles.langBtn, currentLang === lang && styles.langBtnActive]}
              >
                <Text style={[styles.langBtnText, currentLang === lang && styles.langBtnTextActive]}>
                  {lang === 'en' ? 'English' : lang === 'si' ? 'සිංහල' : 'தமிழ்'}
                </Text>
              </TouchableOpacity>
            ))}
        </View>
        
        <Text style={styles.sectionLabel}>{t.account_mgmt}</Text>
        <MenuOption icon="person-outline" label={t.edit_profile} onPress={onNavigateToEdit} />

        <Text style={styles.sectionLabel}>{t.support_legal}</Text>
        <MenuOption icon="help-circle-outline" label={t.help} onPress={onNavigateToHelp} />
        <MenuOption icon="chatbubbles-outline" label={t.faq} onPress={onNavigateToFAQ} />
        <MenuOption icon="document-text-outline" label={t.terms} onPress={onNavigateToTerms} />
        <MenuOption icon="shield-checkmark-outline" label={t.privacy} onPress={onNavigateToPrivacy} />

        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.logoutText}>{t.signout}</Text>
        </TouchableOpacity>

        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>UrbanSync Urban Services</Text>
          <Text style={styles.versionText}>VERSION 1.0</Text>
        </View>
        
      </ScrollView>
    </SafeAreaView>
  );
}

// 5. HELPER COMPONENTS
const MenuOption = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.menuIconContainer}>
      <Ionicons name={icon} size={22} color="#0041C7" /> 
    </View>
    <Text style={styles.menuLabel}>{label}</Text>
    <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
  </TouchableOpacity>
);

// 6. STYLES
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topNavBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingTop: 15, paddingBottom: 15, backgroundColor: '#F8FAFC' },
  greetingText: { fontSize: 12, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  navTitle: { fontSize: 26, fontWeight: '800', color: '#0041C7' },
  editBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0, 65, 199, 0.08)', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 25, paddingBottom: 40 },
  
  langToggleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  langBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', marginHorizontal: 4, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2 },
  langBtnActive: { backgroundColor: '#0041C7', borderColor: '#0041C7' },
  langBtnText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  langBtnTextActive: { color: '#fff' },

  profileHeaderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 24, marginTop: 10, marginBottom: 30, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 6, borderWidth: 1, borderColor: '#F1F5F9' },
  avatarWrapper: { width: 85, height: 85, borderRadius: 42.5, overflow: 'hidden', borderWidth: 3, borderColor: '#F1F5F9', backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 20 },
  avatarImage: { width: '100%', height: '100%' },
  initialsContainer: { width: '100%', height: '100%', backgroundColor: 'rgba(1, 96, 201, 0.1)', justifyContent: 'center', alignItems: 'center' },
  initialsText: { fontSize: 28, fontWeight: '800', color: '#0041C7' },
  profileTextInfo: { flex: 1, justifyContent: 'center' },
  userName: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  userDetails: { fontSize: 13, color: '#64748B', fontWeight: '500', marginBottom: 6 },
  nicBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 0, paddingVertical: 2, marginBottom: 6 },
  nicText: { fontSize: 12, color: '#64748B', fontWeight: '600', marginLeft: 4 },
  locationBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(1, 96, 201, 0.08)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  locationText: { fontSize: 11, color: '#0160C9', fontWeight: '700', marginLeft: 4 },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, marginBottom: 12, marginTop: 10, marginLeft: 5 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 20, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 3, borderWidth: 1, borderColor: '#F8FAFC' },
  menuIconContainer: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(0, 65, 199, 0.06)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuLabel: { flex: 1, fontSize: 15, color: '#1E293B', fontWeight: '700' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', padding: 18, borderRadius: 20, marginTop: 25, borderWidth: 1, borderColor: '#FECACA' },
  logoutText: { marginLeft: 10, color: '#EF4444', fontWeight: '800', fontSize: 16 },
  footerInfo: { marginTop: 40, alignItems: 'center', opacity: 0.6 },
  footerText: { fontSize: 13, color: '#64748B', marginBottom: 4, fontWeight: '600' },
  versionText: { fontSize: 10, color: '#94A3B8', fontWeight: '800', letterSpacing: 1 }
});