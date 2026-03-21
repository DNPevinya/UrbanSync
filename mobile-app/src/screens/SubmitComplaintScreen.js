import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

export default function SubmitComplaintScreen({ onBack, userId }) {
  const [selectedCategory, setSelectedCategory] = useState('Urban Infrastructure & Municipal Services');
  const [selectedType, setSelectedType] = useState('Garbage Collection Delay');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [region, setRegion] = useState({ latitude: 6.9271, longitude: 79.8612, latitudeDelta: 0.005, longitudeDelta: 0.005 });
  const [markerCoord, setMarkerCoord] = useState({ latitude: 6.9271, longitude: 79.8612 });
  const [locationName, setLocationName] = useState('Locating...');

  const SERVER_URL = "http://192.168.8.103:5000";

  const complaintData = {
    'Urban Infrastructure & Municipal Services': ['Garbage Collection Delay', 'Illegal Waste Dumping', 'Street Cleaning Issue', 'Drainage Blockage / Flooding', 'Broken Road / Pothole', 'Damaged Footpath', 'Traffic Signal Malfunction', 'Public Park Maintenance Issue', 'Public Space Maintenance Issue'],
    'Public Health & Sanitation': ['Dengue Mosquito Breeding Site', 'Food Hygiene Complaint', 'Unsanitary Business Premises', 'Public Sanitation Issue', 'Waste Causing Health Hazard'],
    'Public Safety & Law Enforcement': ['Noise Complaint', 'Parking Violation', 'Vandalism', 'Suspicious Activity', 'Public Disorder'],
    'Water Supply Services': ['Water Supply Interruption', 'Low Water Pressure', 'Pipe Leak', 'Water Contamination', 'Sewer Line Blockage'],
    'Environmental Protection': ['Illegal Tree Cutting', 'Air Pollution', 'Water Body Pollution (River/Canal)', 'Industrial Waste Disposal', 'Environmental Damage Complaint'],
    'Urban Planning & Development': ['Unauthorized Construction', 'Building Code Violation', 'Land Use Violation', 'Unsafe Construction Site'],
    'Electricity Services': ['Power Outage', 'Streetlight Breakdown', 'Fallen Electrical Line', 'Unsafe Electrical Connection', 'Transformer Issue'],
    'Public Transport Infrastructure': ['Bus Stop Maintenance Issue', 'Unsafe Bus Operation', 'Route Mismanagement', 'Public Transport Safety Concern'],
    'Local Administrative Issues': ['Resident Verification Issue', 'Local Documentation Concern', 'Community-Level Dispute (Non-Criminal)']
  };

  const categories = [
    { id: '1', label: 'Urban Infrastructure & Municipal Services', icon: 'office-building' },
    { id: '2', label: 'Public Health & Sanitation', icon: 'hospital-marker' },
    { id: '3', label: 'Public Safety & Law Enforcement', icon: 'shield-check' },
    { id: '4', label: 'Water Supply Services', icon: 'water' },
    { id: '5', label: 'Environmental Protection', icon: 'tree' },
    { id: '6', label: 'Urban Planning & Development', icon: 'home-city' },
    { id: '7', label: 'Electricity Services', icon: 'flash' },
    { id: '8', label: 'Public Transport Infrastructure', icon: 'bus' },
    { id: '9', label: 'Local Administrative Issues', icon: 'account-group' },
  ];

  const fetchAddress = async (coords) => {
    try {
      let address = await Location.reverseGeocodeAsync(coords);
      if (address.length > 0) {
        const addr = address[0];
        const district = addr.subregion || addr.city || addr.region || 'Unknown District';
        const street = addr.street || addr.name || 'Unknown Location';
        setLocationName(`${street}, ${district}`);
      } else {
        setLocationName('Location found (Unnamed road)');
      }
    } catch (error) {
      setLocationName('Unable to fetch address');
    }
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationName("Permission Denied");
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      const newCoords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setMarkerCoord(newCoords);
      setRegion({ latitude: newCoords.latitude, longitude: newCoords.longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 });
      await fetchAddress(newCoords);
    })();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert("Denied", "We need gallery access.");
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.7,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!description) return Alert.alert("Error", "Please add a description.");
    setLoading(true);

    const formData = new FormData();
    formData.append('user_id', userId || '1');
    formData.append('category', selectedCategory);
    formData.append('title', selectedType);
    formData.append('description', description);
    formData.append('location_text', locationName);
    formData.append('latitude', markerCoord.latitude);
    formData.append('longitude', markerCoord.longitude);

    if (image) {
      const filename = image.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      formData.append('profileImage', { uri: image, name: filename, type: match ? `image/${match[1]}` : `image` });
    }

    try {
      const response = await fetch(`${SERVER_URL}/api/complaints/submit`, {
        method: 'POST', body: formData, headers: { 'Accept': 'application/json', 'Content-Type': 'multipart/form-data' },
      });
      const data = await response.json();
      if (response.ok) Alert.alert("Success", "Complaint Submitted!", [{ text: "Done", onPress: onBack }]);
      else Alert.alert("Error", data.message || "Failed to submit.");
    } catch (e) {
      Alert.alert("Error", "Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#0160C9" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Complaint</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>SELECT CATEGORY</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((cat) => (
            <TouchableOpacity 
              key={cat.id} 
              style={[styles.categoryCard, selectedCategory === cat.label ? styles.categoryCardActive : null]}
              onPress={() => { setSelectedCategory(cat.label); setSelectedType(complaintData[cat.label][0]); setShowTypeDropdown(false); }}
            >
              <MaterialCommunityIcons name={cat.icon} size={28} color={selectedCategory === cat.label ? '#fff' : '#0D85D8'} />
              <Text style={[styles.categoryLabel, selectedCategory === cat.label ? styles.categoryLabelActive : null]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>COMPLAINT TYPE</Text>
        <TouchableOpacity style={styles.pickerContainer} onPress={() => setShowTypeDropdown(!showTypeDropdown)}>
          <Text style={styles.pickerText}>{selectedType}</Text>
          <Ionicons name={showTypeDropdown ? "chevron-up" : "chevron-down"} size={20} color="#0D85D8" />
        </TouchableOpacity>

        {showTypeDropdown ? (
          <View style={styles.dropdownList}>
            {complaintData[selectedCategory].map((type, index) => (
              <TouchableOpacity key={index} style={styles.dropdownItem} onPress={() => { setSelectedType(type); setShowTypeDropdown(false); }}>
                <Text style={styles.dropdownItemText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <Text style={styles.label}>DESCRIPTION</Text>
        <TextInput 
          style={styles.textArea} 
          placeholder="Describe the issue in detail..." 
          placeholderTextColor="#94A3B8"
          multiline value={description} onChangeText={setDescription}
        />

        <Text style={styles.label}>ADD PHOTO</Text>
        <View style={styles.photoRow}>
          <TouchableOpacity style={styles.addPhotoBox} onPress={pickImage}>
            {image ? <Image source={{ uri: image }} style={styles.imageThumb} /> : (
              <View style={{alignItems:'center'}}>
                <Ionicons name="camera-outline" size={30} color="#1CA3DE" />
                <Text style={styles.addPhotoLabel}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>LOCATION (DRAG PIN TO ADJUST)</Text>
        <View style={styles.locationDisplayRow}>
          <Ionicons name="location" size={14} color="#0041C7" />
          <Text style={styles.locationDisplayName}>{locationName}</Text>
        </View>
        
        <View style={styles.miniMapContainer}>
          <MapView style={styles.miniMap} region={region} onRegionChangeComplete={setRegion}>
            <Marker 
              draggable 
              coordinate={markerCoord} 
              onDragEnd={async (e) => {
                const newCoords = e.nativeEvent.coordinate;
                setMarkerCoord(newCoords);
                setLocationName("Updating address...");
                await fetchAddress(newCoords);
              }} 
              pinColor="#0041C7" 
            />
          </MapView>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit Complaint</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  backText: { color: '#0160C9', fontSize: 16, marginLeft: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0041C7' },
  scrollContent: { padding: 20 },
  label: { fontSize: 11, fontWeight: 'bold', color: '#0D85D8', marginTop: 20, marginBottom: 10, letterSpacing: 0.5 },
  categoryScroll: { flexDirection: 'row', paddingBottom: 5 },
  categoryCard: { width: 105, height: 95, borderRadius: 15, backgroundColor: '#fff', borderWidth: 1, borderColor: '#3ACBE8', justifyContent: 'center', alignItems: 'center', marginRight: 12, elevation: 2 },
  categoryCardActive: { backgroundColor: '#0041C7', borderColor: '#0041C7' },
  categoryLabel: { fontSize: 9, marginTop: 8, color: '#1E293B', textAlign: 'center' },
  categoryLabelActive: { color: '#fff', fontWeight: 'bold' },
  pickerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#3ACBE8' },
  pickerText: { fontSize: 15, color: '#1E293B' },
  dropdownList: { backgroundColor: '#fff', marginTop: 5, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', elevation: 3 },
  dropdownItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  dropdownItemText: { fontSize: 14, color: '#334155' },
  textArea: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 15, fontSize: 15, color: '#1E293B', height: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: '#3ACBE8' },
  photoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  addPhotoBox: { width: 90, height: 90, borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#3ACBE8', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  imageThumb: { width: '100%', height: '100%' },
  addPhotoLabel: { fontSize: 10, color: '#1CA3DE', marginTop: 5 },
  locationDisplayRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  locationDisplayName: { fontSize: 13, color: '#1E293B', fontWeight: '500', marginLeft: 6 },
  miniMapContainer: { height: 180, borderRadius: 15, overflow: 'hidden', borderWidth: 1, borderColor: '#3ACBE8', marginTop: 5 },
  miniMap: { width: '100%', height: '100%' },
  submitButton: { backgroundColor: '#0041C7', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 30, marginBottom: 40 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});