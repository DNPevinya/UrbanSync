import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfileScreen({ onBack, initialData = {}, onUpdateSuccess }) {
  // --- State Initialization ---
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

  // --- NEW STATE: Tracks if the image is broken ---
  const [imageFailed, setImageFailed] = useState(false);

  const SERVER_URL = "http://192.168.8.103:5000";

  // --- Data Bridge ---
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

  // --- THE SHIELD: Safe URI Generator ---
  const getProfileImage = () => {
    // 1. If user just picked a new image from gallery, show that immediately!
    if (image) return image; 
    
    // 2. Hard-check for ghost data like the string "null"
    if (!initialData || !initialData.profilePicture || initialData.profilePicture === '' || initialData.profilePicture === 'null') {
      return null; 
    }
    
    // 3. Clean slashes for iOS
    if (Platform.OS === 'ios') {
      return `${SERVER_URL}/${initialData.profilePicture.replace(/\\/g, '/').replace(/^\//, '')}`;
    }
    
    // 4. Default for Android
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
      setDeleteImageFlag(false); // Reset delete flag if new image is picked
      setImageFailed(false); // Reset the error state so the new image shows!
    }
  };

  const handleUpdate = async () => {
    // 1. DYNAMIC VALIDATIONS
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

    // 2. PREPARE FORMDATA
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
    // THE SHIELD: Only Android gets the 'top' edge
    <SafeAreaView style={styles.container} edges={Platform.OS === 'android' ? ['top'] : []}>
      
      {/* THE SHIELD: Only iOS gets extra top padding to fix the gap */}
      <View style={[styles.header, Platform.OS === 'ios' && { paddingTop: 60 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#0160C9" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.imageSection}>
          <View style={styles.imageWrapper}>
            {/* Conditional Rendering: Check if we have a URI, we aren't deleting it, and it hasn't failed */}
            {finalImageUri && !deleteImageFlag && !imageFailed ? (
              <Image 
                source={{ uri: finalImageUri }} 
                style={styles.avatar} 
                onError={() => setImageFailed(true)} // Bulletproof fallback
              />
            ) : (
              <View style={[styles.avatar, styles.initialsContainer]}>
                <Text style={styles.initialsText}>{getInitials(name)}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.cameraBtn} onPress={pickImage}>
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.imageActionRow}>
             <TouchableOpacity onPress={pickImage}>
                <Text style={styles.imageActionText}>Change Photo</Text>
             </TouchableOpacity>
             
             {/* Only show "Remove" if there's actually a valid image showing */}
             {finalImageUri && !deleteImageFlag && !imageFailed && (
               <TouchableOpacity 
                onPress={() => { setImage(null); setDeleteImageFlag(true); setImageFailed(false); }}
                style={{ marginLeft: 20 }}
               >
                  <Text style={[styles.imageActionText, { color: '#EF4444' }]}>Remove</Text>
               </TouchableOpacity>
             )}
          </View>
        </View>

        <EditableField label="FULL NAME" icon="person-outline" value={name} onChange={setName} />
        <EditableField label="PHONE NUMBER" icon="call-outline" value={phone} onChange={setPhone} keyboardType="phone-pad" />
        
        <Text style={styles.label}>DISTRICT</Text>
        <View style={styles.selector}>
          <Text style={styles.selectorText}>{district}</Text>
          <Ionicons name="location-outline" size={20} color="#0D85D8" />
        </View>

        <Text style={styles.label}>DIVISION/AREA</Text>
        <View style={styles.selector}>
          <Text style={styles.selectorText}>{division}</Text>
          <Ionicons name="map-outline" size={20} color="#0D85D8" />
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionHeader}>CHANGE PASSWORD</Text>
        
        <PasswordField 
          label="CURRENT PASSWORD" 
          value={oldPassword} 
          onChange={setOldPassword} 
          visible={showPass.old} 
          placeholder="Only required to change password"
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
        />

        <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.updateBtnText}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const EditableField = ({ label, icon, value, onChange, keyboardType }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputContainer}>
      <Ionicons name={icon} size={20} color="#1CA3DE" style={styles.inputIcon} />
      <TextInput style={styles.input} value={value} onChangeText={onChange} keyboardType={keyboardType} color="#000" />
    </View>
  </View>
);

const PasswordField = ({ label, value, onChange, visible, placeholder, onToggle }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputContainer}>
      <Ionicons name="lock-closed-outline" size={20} color="#1CA3DE" style={styles.inputIcon} />
      <TextInput 
        style={styles.input} 
        value={value} 
        onChangeText={onChange} 
        secureTextEntry={!visible} 
        placeholder={placeholder} 
        placeholderTextColor="#94A3B8" 
        color="#000"
      />
      <TouchableOpacity onPress={onToggle}>
        <Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={20} color="#64748B" />
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backBtn: { flexDirection: 'row', alignItems: 'center', width: 60 },
  backText: { color: '#0160C9', fontSize: 16, marginLeft: 5 },
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#0041C7' },
  content: { padding: 25 },
  imageSection: { alignItems: 'center', marginBottom: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F1F5F9' },
  initialsContainer: { backgroundColor: '#3ACBE820', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#3ACBE8' },
  initialsText: { fontSize: 32, fontWeight: 'bold', color: '#0160C9' },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#0D85D8', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  imageActionRow: { flexDirection: 'row', marginTop: 15 },
  imageActionText: { fontSize: 13, color: '#0D85D8', fontWeight: '600' },
  label: { fontSize: 11, fontWeight: 'bold', color: '#0D85D8', marginBottom: 8, marginTop: 15 },
  sectionHeader: { fontSize: 13, fontWeight: 'bold', color: '#0041C7', marginTop: 20, marginBottom: 5 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#3ACBE8', paddingHorizontal: 15, height: 50 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15 },
  selector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 15, height: 50 },
  selectorText: { fontSize: 15, color: '#000' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 20 },
  updateBtn: { backgroundColor: '#0041C7', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 30, marginBottom: 40 },
  updateBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});