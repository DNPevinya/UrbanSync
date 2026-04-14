import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator, Modal, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'; // ADDED PROVIDER_GOOGLE
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { BASE_URL } from '../../src/config';

export default function SubmitComplaintScreen({ onBack, userId }) {
  const SERVER_URL = BASE_URL;
  const mapRef = useRef(null);
  
  // 🚨 PASTE YOUR GOOGLE MAPS API KEY HERE 🚨
  const GOOGLE_API_KEY = 'AIzaSyAttl1IRPjcaHUuBYYFeSnBRH1Gk5cBDvg'; 

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

  const [selectedCategory, setSelectedCategory] = useState(categories[0].label);
  const [selectedType, setSelectedType] = useState(complaintData[categories[0].label][0]);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [showCategoryGuide, setShowCategoryGuide] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false); 
  
  const [region, setRegion] = useState({ latitude: 6.9271, longitude: 79.8612, latitudeDelta: 0.005, longitudeDelta: 0.005 });
  const [markerCoord, setMarkerCoord] = useState({ latitude: 6.9271, longitude: 79.8612 });
  const [locationName, setLocationName] = useState('Locating...');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingLocation, setSearchingLocation] = useState(false);

  const handleCategorySelect = (catLabel) => {
    setSelectedCategory(catLabel);
    setSelectedType(complaintData[catLabel][0]); 
  };

  const fetchAddress = async (coords) => {
    try {
      if (GOOGLE_API_KEY === 'PASTE_YOUR_API_KEY_HERE') {
        let address = await Location.reverseGeocodeAsync(coords);
        if (address.length > 0) {
          const addr = address[0];
          const district = addr.subregion || addr.city || addr.region || 'Unknown District';
          const street = addr.street || addr.name || 'Unknown Location';
          setLocationName(`${street}, ${district}`);
        }
        return;
      }

      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.latitude},${coords.longitude}&key=${GOOGLE_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        setLocationName(data.results[0].formatted_address);
      } else {
        setLocationName('Address Unavailable');
      }
    } catch (error) { setLocationName('Address Unavailable'); }
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let loc = await Location.getCurrentPositionAsync({});
      const newCoords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setMarkerCoord(newCoords);
      const newRegion = { ...newCoords, latitudeDelta: 0.005, longitudeDelta: 0.005 };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
      await fetchAddress(newCoords);
    })();
  }, []);

  const handleLocationSearch = async () => {
    if (!searchQuery.trim()) return;
    
    if (GOOGLE_API_KEY === 'PASTE_YOUR_API_KEY_HERE') {
      Alert.alert("API Key Missing", "Please add your Google Maps API Key to search for specific shops or temples.");
      return;
    }

    setSearchingLocation(true);
    try {
      const query = searchQuery.toLowerCase().includes('sri lanka') ? searchQuery : `${searchQuery}, Sri Lanka`;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        const newCoords = { latitude: lat, longitude: lng };
        
        setMarkerCoord(newCoords);
        const zoomRegion = { ...newCoords, latitudeDelta: 0.005, longitudeDelta: 0.005 };
        mapRef.current?.animateToRegion(zoomRegion, 1000);
        setLocationName(data.results[0].formatted_address);
      } else {
        Alert.alert("Not Found", "Location could not be found. Try being more specific.");
      }
    } catch (e) { 
      Alert.alert("Error", "Location search failed. Check your internet connection."); 
    } finally { 
      setSearchingLocation(false); 
    }
  };

  const takePhoto = async () => {
    if (images.length >= 3) return Alert.alert("Limit", "Max 3 photos allowed.");
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    let result = await ImagePicker.launchCameraAsync({ quality: 0.7, exif: true });
    if (!result.canceled) processImage(result.assets[0]);
  };

  const pickImages = async () => {
    if (images.length >= 3) return Alert.alert("Limit", "Max 3 photos allowed.");
    let result = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, selectionLimit: 3 - images.length, quality: 0.7, exif: true });
    if (!result.canceled) result.assets.forEach(asset => processImage(asset));
  };

  const processImage = (asset) => {
    setImages(prev => [...prev, asset.uri]);
    if (asset.exif?.GPSLatitude) {
      const photoLat = asset.exif.GPSLatitude * (asset.exif.GPSLatitudeRef === 'S' ? -1 : 1);
      const photoLon = asset.exif.GPSLongitude * (asset.exif.GPSLongitudeRef === 'W' ? -1 : 1);
      Alert.alert("Location Detected", "Move map pin to photo location?", [
        { text: "No" }, { text: "Yes", onPress: () => {
          const coords = { latitude: photoLat, longitude: photoLon };
          setMarkerCoord(coords);
          mapRef.current?.animateToRegion({...coords, latitudeDelta: 0.005, longitudeDelta: 0.005}, 1000);
          fetchAddress(coords);
        }}
      ]);
    }
  };

  const handleSubmit = async () => {
    if (!description || images.length === 0) return Alert.alert("Required", "Please provide description and at least one photo.");
    setLoading(true);
    const formData = new FormData();
    formData.append('user_id', userId || '1');
    formData.append('category', selectedCategory);
    formData.append('title', selectedType);
    formData.append('description', description);
    formData.append('location_text', locationName);
    formData.append('latitude', markerCoord.latitude);
    formData.append('longitude', markerCoord.longitude);

    images.forEach((uri, i) => {
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      formData.append('images', { uri, name: filename, type: match ? `image/${match[1]}` : `image` });
    });

    try {
      const res = await fetch(`${SERVER_URL}/api/complaints/submit`, {
        method: 'POST', body: formData, headers: { 'Accept': 'application/json', 'Content-Type': 'multipart/form-data' },
      });
      if (res.ok) Alert.alert("Success", "Report Submitted!", [{ text: "OK", onPress: onBack }]);
      else Alert.alert("Error", "Submission failed.");
    } catch (e) { Alert.alert("Error", "Server error."); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container} edges={Platform.OS === 'android' ? ['top'] : []}>
      <View style={styles.topNavBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}><Ionicons name="chevron-back" size={24} color="#0041C7" /><Text style={styles.backText}>Back</Text></TouchableOpacity>
        <Text style={styles.navTitle}>New Report</Text>
        <View style={{ width: 70 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.formSection}>
            <View style={styles.headerRow}><Text style={styles.label}>1. Category</Text><TouchableOpacity onPress={() => setShowCategoryGuide(true)} style={styles.helpLink}><Ionicons name="help-circle" size={16} color="#0041C7" /><Text style={styles.helpText}>Need help choosing?</Text></TouchableOpacity></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {categories.map((cat) => (
                <TouchableOpacity key={cat.id} style={[styles.catCard, selectedCategory === cat.label && styles.catCardActive]} onPress={() => handleCategorySelect(cat.label)}>
                  <MaterialCommunityIcons name={cat.icon} size={28} color={selectedCategory === cat.label ? '#fff' : '#0160C9'} />
                  <Text style={[styles.catLabel, selectedCategory === cat.label && styles.catLabelActive]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>2. Issue / Request Type</Text>
            <TouchableOpacity style={styles.dropBtn} onPress={() => setShowTypeModal(true)}><Text style={styles.dropText}>{selectedType}</Text><Ionicons name="chevron-down-circle" size={22} color="#0041C7" /></TouchableOpacity>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>3. Description</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Describe the issue or request in detail..." 
              placeholderTextColor="#94A3B8"
              multiline 
              value={description} 
              onChangeText={setDescription} 
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>4. Photos (Max 3)</Text>
            <View style={styles.photoActions}><TouchableOpacity style={styles.pBtn} onPress={takePhoto}><Ionicons name="camera" size={20} color="#0041C7" /><Text style={styles.pText}>Camera</Text></TouchableOpacity><TouchableOpacity style={styles.pBtn} onPress={pickImages}><Ionicons name="images" size={20} color="#0041C7" /><Text style={styles.pText}>Gallery</Text></TouchableOpacity></View>
            {images.length > 0 && <ScrollView horizontal style={styles.imgScroll}>{images.map((uri, i) => (<View key={i} style={styles.imgWrap}><Image source={{ uri }} style={styles.img} /><TouchableOpacity style={styles.rmv} onPress={() => setImages(images.filter((_, idx) => idx !== i))}><Ionicons name="close" size={14} color="#fff" /></TouchableOpacity></View>))}</ScrollView>}
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>5. Location</Text>
            <View style={styles.locBox}>
              <View style={styles.searchWrap}>
                 <Ionicons name="search" size={18} color="#0160C9" />
                 <TextInput 
                   style={styles.sInput} 
                   placeholder="Search location..." 
                   placeholderTextColor="#94A3B8"
                   value={searchQuery} 
                   onChangeText={setSearchQuery} 
                   onSubmitEditing={handleLocationSearch} 
                 />
                 <TouchableOpacity onPress={handleLocationSearch}>
                    {searchingLocation ? <ActivityIndicator size="small" color="#0041C7" /> : <Text style={styles.sBtn}>Find</Text>}
                 </TouchableOpacity>
              </View>
              <View style={styles.mapWrap}>
                 <MapView ref={mapRef} style={styles.map} initialRegion={region} provider={PROVIDER_GOOGLE}>
                   <Marker 
                     draggable 
                     coordinate={markerCoord} 
                     onDragEnd={async (e) => { 
                       setMarkerCoord(e.nativeEvent.coordinate); 
                       await fetchAddress(e.nativeEvent.coordinate); 
                     }} 
                     pinColor="#0041C7" 
                   />
                 </MapView>
                 <View style={styles.addr}><Ionicons name="location" size={16} color="#0041C7" /><Text style={styles.addrText} numberOfLines={2}>{locationName}</Text></View>
              </View>
            </View>
          </View>

          <TouchableOpacity onPress={handleSubmit} disabled={loading}><LinearGradient colors={['#0041C7', '#0D85D8']} style={styles.submit}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Report</Text>}</LinearGradient></TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showTypeModal} animationType="slide" transparent><View style={styles.mOverlay}><View style={styles.mContent}><View style={styles.mHead}><Text style={styles.mTitle}>Select Issue</Text><TouchableOpacity onPress={() => setShowTypeModal(false)}><Ionicons name="close-circle" size={28} color="#94A3B8" /></TouchableOpacity></View><ScrollView contentContainerStyle={{ paddingBottom: 20 }}>{complaintData[selectedCategory].map((t, i) => (<TouchableOpacity key={i} style={styles.mItem} onPress={() => { setSelectedType(t); setShowTypeModal(false); }}><Text style={[styles.mItemT, selectedType === t && styles.mActive]}>{t}</Text></TouchableOpacity>))}</ScrollView></View></View></Modal>
      <Modal visible={showCategoryGuide} animationType="fade" transparent>
        <View style={styles.mOverlay}>
          <View style={styles.mContent}>
            <View style={styles.mHead}>
              <Text style={styles.mTitle}>Category Guide</Text>
              <TouchableOpacity onPress={() => setShowCategoryGuide(false)}><Ionicons name="close-circle" size={28} color="#94A3B8" /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
              <GuideItem icon="office-building" title="Urban Infrastructure & Municipal Services" desc="Garbage Collection Delay, Illegal Waste Dumping, Street Cleaning Issue, Drainage Blockage / Flooding, Broken Road / Pothole, Damaged Footpath, Traffic Signal Malfunction, Public Park Maintenance Issue, Public Space Maintenance Issue" />
              <GuideItem icon="hospital-marker" title="Public Health & Sanitation" desc="Dengue Mosquito Breeding Site, Food Hygiene Complaint, Unsanitary Business Premises, Public Sanitation Issue, Waste Causing Health Hazard" />
              <GuideItem icon="shield-check" title="Public Safety & Law Enforcement" desc="Noise Complaint, Parking Violation, Vandalism, Suspicious Activity, Public Disorder" />
              <GuideItem icon="water" title="Water Supply Services" desc="Water Supply Interruption, Low Water Pressure, Pipe Leak, Water Contamination, Sewer Line Blockage" />
              <GuideItem icon="tree" title="Environmental Protection" desc="Illegal Tree Cutting, Air Pollution, Water Body Pollution (River/Canal), Industrial Waste Disposal, Environmental Damage Complaint" />
              <GuideItem icon="home-city" title="Urban Planning & Development" desc="Unauthorized Construction, Building Code Violation, Land Use Violation, Unsafe Construction Site" />
              <GuideItem icon="flash" title="Electricity Services" desc="Power Outage, Streetlight Breakdown, Fallen Electrical Line, Unsafe Electrical Connection, Transformer Issue" />
              <GuideItem icon="bus" title="Public Transport Infrastructure" desc="Bus Stop Maintenance Issue, Unsafe Bus Operation, Route Mismanagement, Public Transport Safety Concern" />
              <GuideItem icon="account-group" title="Local Administrative Issues" desc="Resident Verification Issue, Local Documentation Concern, Community-Level Dispute (Non-Criminal)" />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const GuideItem = ({ icon, title, desc }) => (<View style={styles.gItem}><MaterialCommunityIcons name={icon} size={24} color="#0160C9" /><View style={{marginLeft:15, flex: 1}}><Text style={styles.gTitle}>{title}</Text><Text style={styles.gDesc}>{desc}</Text></View></View>);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topNavBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  backText: { color: '#0041C7', fontSize: 16, fontWeight: '600', marginLeft: 5 },
  navTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  scrollContent: { padding: 25, paddingBottom: 60 },
  formSection: { marginBottom: 35 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 12, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: 12 },
  helpLink: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0EAFF', padding: 6, borderRadius: 10 },
  helpText: { fontSize: 11, color: '#0041C7', fontWeight: '700', marginLeft: 4 },
  catScroll: { flexDirection: 'row' },
  catCard: { width: 115, height: 105, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginRight: 15, padding: 8 },
  catCardActive: { backgroundColor: '#0041C7', borderColor: '#0041C7' },
  catLabel: { fontSize: 10, marginTop: 8, textAlign: 'center', color: '#64748B', fontWeight: '600' },
  catLabelActive: { color: '#fff' },
  dropBtn: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 18, borderRadius: 16, borderWidth: 1.5, borderColor: '#E2E8F0' },
  dropText: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  input: { backgroundColor: '#fff', borderRadius: 16, padding: 18, fontSize: 15, color: '#1E293B', height: 120, textAlignVertical: 'top', borderWidth: 1.5, borderColor: '#E2E8F0' },
  photoActions: { flexDirection: 'row', gap: 12 },
  pBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0' },
  pText: { marginLeft: 8, color: '#0041C7', fontWeight: '700' },
  imgScroll: { flexDirection: 'row', marginTop: 15 },
  imgWrap: { width: 90, height: 90, borderRadius: 14, marginRight: 12, overflow: 'hidden' },
  img: { width: '100%', height: '100%' },
  rmv: { position: 'absolute', top: 5, right: 5, backgroundColor: 'red', borderRadius: 10, padding: 2 },
  locBox: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1.5, borderColor: '#E2E8F0', overflow: 'hidden' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: '#F1F5F9' },
  sInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#1E293B' },
  sBtn: { color: '#0041C7', fontWeight: '800' },
  mapWrap: { height: 220 },
  map: { width: '100%', height: '100%' },
  addr: { position: 'absolute', bottom: 15, left: 15, right: 15, backgroundColor: '#fff', padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', elevation: 3 },
  addrText: { flex: 1, marginLeft: 8, fontSize: 13, fontWeight: '700', color: '#1E293B' },
  submit: { height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  mOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  mContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '80%' },
  mHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  mTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  mItem: { padding: 18, borderBottomWidth: 1, borderColor: '#F8FAFC' },
  mItemT: { fontSize: 16, color: '#64748B' },
  mActive: { color: '#0041C7', fontWeight: '800' },
  gItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  gTitle: { fontWeight: '800', color: '#1E293B' }, 
  gDesc: { color: '#64748B', fontSize: 13, marginTop: 2, lineHeight: 18 }
});