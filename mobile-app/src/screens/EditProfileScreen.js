import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { BASE_URL } from '../../src/config';

export default function EditProfileScreen({ onBack, initialData = {}, onUpdateSuccess }) {
  const [name, setName] = useState(initialData?.name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [district, setDistrict] = useState(initialData?.district || 'Select District');
  const [division, setDivision] = useState(initialData?.division || 'Select Division');
  
  const [image, setImage] = useState(null); 
  const [deleteImageFlag, setDeleteImageFlag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oldPassword, setOldPassword] = useState(''); 
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState({ old: false, new: false, confirm: false });
  const [imageFailed, setImageFailed] = useState(false);

  const SERVER_URL = BASE_URL;

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setPhone(initialData.phone || '');
      setDistrict(initialData.district || 'Select District');
      setDivision(initialData.division || 'Select Division');
    }
  }, [initialData]);

  const getInitials = (fullName) => {
    if (!fullName || fullName === 'Citizen') return "??";
    const names = fullName.trim().split(/\s+/);
    if (names.length > 1) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  const getProfileImage = () => {
    if (image) return image; 
    if (!initialData || !initialData.profilePicture || initialData.profilePicture === '' || initialData.profilePicture === 'null') {
      return null; 
    }
    if (Platform.OS === 'ios') {
      return `${SERVER_URL}/${initialData.profilePicture.replace(/\\/g, '/').replace(/^\//, '')}`;
    }
    return `${SERVER_URL}${initialData.profilePicture}`;
  };

  const finalImageUri = getProfileImage();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Gallery access is needed to change your photo.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setDeleteImageFlag(false); 
      setImageFailed(false); 
    }
  };

  const handleUpdate = async () => {
    if (oldPassword && !newPassword) {
      Alert.alert("Incomplete", "You entered your current password. Please enter a new password if you wish to change it.");
      return;
    }

    if (newPassword && !oldPassword) {
      Alert.alert("Security Required", "Please enter your current password to set a new one.");
      return;
    }

    if (newPassword) {
      if (newPassword.length < 8) {
        Alert.alert("Validation", "New password must be at least 8 characters long.");
        return;
      }
      if (newPassword !== confirmPassword) {
        Alert.alert("Error", "New passwords do not match!");
        return;
      }
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('email', initialData.email);
    formData.append('fullName', name);
    formData.append('phone', phone);
    formData.append('district', district);
    formData.append('division', division);
    formData.append('currentPassword', oldPassword);
    formData.append('newPassword', newPassword);
    formData.append('deleteImage', deleteImageFlag ? 'true' : 'false');

    if (image && !deleteImageFlag) {
      const filename = image.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      formData.append('profileImage', {
        uri: image,
        name: filename,
        type: type,
      });
    }

    try {
      const response = await fetch(`${SERVER_URL}/api/auth/update-profile`, {
        method: 'PUT',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Profile updated successfully!");
        
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');

        if (onUpdateSuccess) {
          onUpdateSuccess(name, phone, district, division, data.profilePicture);
        }
        onBack();
      } else {
        Alert.alert("Error", data.message || "Failed to update profile.");
      }
    } catch (error) {
      Alert.alert("Connection Error", "Check your server status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={Platform.OS === 'android' ? ['top'] : []}>
      
      <View style={[styles.header, Platform.OS === 'ios' && { paddingTop: 20 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#0041C7" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 70 }} /> 
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          <View style={styles.imageSection}>
            <View style={styles.imageWrapper}>
              {finalImageUri && !deleteImageFlag && !imageFailed ? (
                <Image 
                  source={{ uri: finalImageUri }} 
                  style={styles.avatar} 
                  onError={() => setImageFailed(true)} 
                />
              ) : (
                <View style={[styles.avatar, styles.initialsContainer]}>
                  <Text style={styles.initialsText}>{getInitials(name)}</Text>
                </View>
              )}
              <TouchableOpacity style={styles.cameraBtn} onPress={pickImage} activeOpacity={0.8}>
                <Ionicons name="camera" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.imageActionRow}>
               <TouchableOpacity onPress={pickImage} style={styles.imageActionBtn}>
                  <Text style={styles.imageActionText}>Change Photo</Text>
               </TouchableOpacity>
               
               {finalImageUri && !deleteImageFlag && !imageFailed && (
                 <TouchableOpacity 
                  onPress={() => { setImage(null); setDeleteImageFlag(true); setImageFailed(false); }}
                  style={[styles.imageActionBtn, { backgroundColor: '#FEF2F2', marginLeft: 15 }]}
                 >
                    <Text style={[styles.imageActionText, { color: '#EF4444' }]}>Remove</Text>
                 </TouchableOpacity>
               )}
            </View>
          </View>

          <View style={styles.formCard}>
            <EditableField label="FULL NAME" icon="person-outline" value={name} onChange={setName} />
            <EditableField label="PHONE NUMBER" icon="call-outline" value={phone} onChange={setPhone} keyboardType="phone-pad" />
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>DISTRICT</Text>
              <View style={styles.selector}>
                <Ionicons name="location-outline" size={20} color="#0160C9" style={styles.inputIcon} />
                <Text style={styles.selectorText}>{district}</Text>
                <Ionicons name="lock-closed" size={16} color="#CBD5E1" />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>DIVISION/AREA</Text>
              <View style={styles.selector}>
                <Ionicons name="map-outline" size={20} color="#0160C9" style={styles.inputIcon} />
                <Text style={styles.selectorText}>{division}</Text>
                <Ionicons name="lock-closed" size={16} color="#CBD5E1" />
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeader}>SECURITY & PASSWORD</Text>
          <View style={styles.formCard}>
            <PasswordField 
              label="CURRENT PASSWORD" 
              value={oldPassword} 
              onChange={setOldPassword} 
              visible={showPass.old} 
              placeholder="Required to change password"
              onToggle={() => setShowPass({...showPass, old: !showPass.old})} 
            />
            <PasswordField 
              label="NEW PASSWORD" 
              value={newPassword} 
              onChange={setNewPassword} 
              visible={showPass.new} 
              placeholder="New password (min 8 chars)"
              onToggle={() => setShowPass({...showPass, new: !showPass.new})} 
            />
            <PasswordField 
              label="CONFIRM NEW PASSWORD" 
              value={confirmPassword} 
              onChange={setConfirmPassword} 
              visible={showPass.confirm} 
              placeholder="Confirm new password"
              onToggle={() => setShowPass({...showPass, confirm: !showPass.confirm})} 
              isLast={true}
            />
          </View>

          <TouchableOpacity onPress={handleUpdate} disabled={loading} activeOpacity={0.8}>
            <LinearGradient colors={['#0041C7', '#0D85D8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.updateBtn, loading && { opacity: 0.7 }]}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.updateBtnText}>Save Changes</Text>}
            </LinearGradient>
          </TouchableOpacity>
          
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const EditableField = ({ label, icon, value, onChange, keyboardType }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputContainer}>
      <Ionicons name={icon} size={20} color="#0160C9" style={styles.inputIcon} />
      <TextInput style={styles.input} value={value} onChangeText={onChange} keyboardType={keyboardType} color="#1E293B" />
    </View>
  </View>
);

const PasswordField = ({ label, value, onChange, visible, placeholder, onToggle, isLast }) => (
  <View style={[styles.inputGroup, isLast && { marginBottom: 0 }]}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputContainer}>
      <Ionicons name="shield-checkmark-outline" size={20} color="#0160C9" style={styles.inputIcon} />
      <TextInput 
        style={styles.input} 
        value={value} 
        onChangeText={onChange} 
        secureTextEntry={!visible} 
        placeholder={placeholder} 
        placeholderTextColor="#94A3B8" 
        color="#1E293B"
      />
      <TouchableOpacity onPress={onToggle} style={{ padding: 5 }}>
        <Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={20} color="#64748B" />
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#F8FAFC' },
  backBtn: { flexDirection: 'row', alignItems: 'center', width: 70 },
  backText: { color: '#0041C7', fontSize: 16, fontWeight: '600', marginLeft: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  
  content: { padding: 25, paddingBottom: 50 },
  
  imageSection: { alignItems: 'center', marginBottom: 30 },
  imageWrapper: { width: 110, height: 110, borderRadius: 55, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, backgroundColor: '#fff' },
  avatar: { width: '100%', height: '100%', borderRadius: 55, backgroundColor: '#F1F5F9', borderWidth: 3, borderColor: '#fff' },
  initialsContainer: { backgroundColor: 'rgba(1, 96, 201, 0.1)', justifyContent: 'center', alignItems: 'center' },
  initialsText: { fontSize: 36, fontWeight: '800', color: '#0041C7' },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#0041C7', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff', elevation: 2 },
  imageActionRow: { flexDirection: 'row', marginTop: 20 },
  imageActionBtn: { backgroundColor: 'rgba(1, 96, 201, 0.08)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  imageActionText: { fontSize: 13, color: '#0041C7', fontWeight: '700' },
  
  formCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 25, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 5, borderWidth: 1, borderColor: '#F1F5F9' },
  sectionHeader: { fontSize: 13, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, marginLeft: 5, marginBottom: 10 },
  
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '800', color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 15, height: 55 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15, fontWeight: '500' },
  
  selector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 15, height: 55 },
  selectorText: { flex: 1, fontSize: 15, color: '#64748B', fontWeight: '500' },
  
  updateBtn: { height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 10, elevation: 4, shadowColor: '#0041C7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  updateBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 }
});