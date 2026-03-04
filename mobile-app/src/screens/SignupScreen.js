import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

const locationData = {
  "Colombo": ["Bambalapitiya", "Kollupitiya", "Borella", "Cinnamon Gardens", "Dehiwala"],
  "Gampaha": ["Negombo", "Kelaniya", "Kiribathgoda", "Kadawatha"],
  "Kandy": ["Kandy City", "Peradeniya", "Katugastota"],
  "Kalutara": ["Panadura", "Horana", "Beruwala"]
};

// ADDED: onSignupSuccess to the props
export default function SignupScreen({ onBackToLogin, onNavigateToTerms, onNavigateToPrivacy, onSignupSuccess }) {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    district: '',
    division: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [isAgreed, setIsAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    let newErrors = {};
    const emailRegex = /\S+@\S+\.\S+/;
    const phoneRegex = /^[7]\d{8}$/; 

    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required.";
    if (!phoneRegex.test(formData.phone)) newErrors.phone = "Enter 9 digits starting with 7 (e.g. 771234567).";
    if (!emailRegex.test(formData.email)) newErrors.email = "Enter a valid email address.";
    if (!formData.district) newErrors.district = "Please select a district.";
    if (!formData.division) newErrors.division = "Please select a division.";
    if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters.";
    if (!isAgreed) newErrors.agreement = "You must agree to the terms.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch('http://192.168.8.104:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData), // This works because your state keys match backend keys
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          "Success", 
          "Account created successfully!",
          [{ 
            text: "OK", 
            onPress: () => {
              // Passing data back to Index.tsx so the profile is pre-filled
              onSignupSuccess(
                formData.fullName,
                formData.email,
                formData.phone,
                formData.district,
                formData.division
              );
            } 
          }]
        );
      } else {
        setErrors({ server: data.message || "Registration failed." });
      }
    } catch (err) {
      setErrors({ server: "Network Error: Please check your server connection." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="account-balance" size={40} color="#0160C9" />
            </View>
            <Text style={styles.title}>Create New Account</Text>
            <Text style={styles.subtitle}>Join the urban service feedback system to improve our city.</Text>
          </View>

          <View style={styles.form}>
            {errors.server && <Text style={styles.errorTextCenter}>{errors.server}</Text>}

            <Text style={styles.label}>FULL NAME</Text>
            <View style={[styles.inputContainer, errors.fullName && styles.inputErrorBorder]}>
              <Ionicons name="person-outline" size={20} color="#1CA3DE" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Sunil Perera" placeholderTextColor="#94A3B8" onChangeText={(v) => {setFormData({...formData, fullName: v}); setErrors({...errors, fullName: null})}} />
            </View>
            {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}

            <Text style={styles.label}>PHONE NUMBER</Text>
            <View style={[styles.inputContainer, errors.phone && styles.inputErrorBorder]}>
              <Text style={styles.countryCode}>+94</Text>
              <TextInput style={styles.input} placeholder="77 123 4567" placeholderTextColor="#94A3B8" keyboardType="phone-pad" maxLength={9} onChangeText={(v) => {setFormData({...formData, phone: v}); setErrors({...errors, phone: null})}} />
            </View>
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <View style={[styles.inputContainer, errors.email && styles.inputErrorBorder]}>
              <Ionicons name="mail-outline" size={20} color="#1CA3DE" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="name@example.com" placeholderTextColor="#94A3B8" keyboardType="email-address" autoCapitalize="none" onChangeText={(v) => {setFormData({...formData, email: v}); setErrors({...errors, email: null})}} />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            <Text style={styles.label}>DISTRICT</Text>
            <View style={[styles.inputContainer, errors.district && styles.inputErrorBorder]}>
              <Picker selectedValue={formData.district} onValueChange={(v) => {setFormData({...formData, district: v, division: ''}); setErrors({...errors, district: null})}} style={styles.picker} dropdownIconColor="transparent">
                <Picker.Item label="Select your district" value="" color="#94A3B8" />
                {Object.keys(locationData).map(dist => <Picker.Item key={dist} label={dist} value={dist} color="#000" />)}
              </Picker>
              <Ionicons name="chevron-down" size={20} color="#64748B" />
            </View>
            {errors.district && <Text style={styles.errorText}>{errors.district}</Text>}

            <Text style={styles.label}>DIVISION/AREA</Text>
            <View style={[styles.inputContainer, !formData.district && {opacity: 0.5}, errors.division && styles.inputErrorBorder]}>
              <Picker selectedValue={formData.division} enabled={formData.district !== ''} onValueChange={(v) => {setFormData({...formData, division: v}); setErrors({...errors, division: null})}} style={styles.picker} dropdownIconColor="transparent">
                <Picker.Item label="Select your division" value="" color="#94A3B8" />
                {formData.district && locationData[formData.district].map(div => <Picker.Item key={div} label={div} value={div} color="#000" />)}
              </Picker>
              <Ionicons name="chevron-down" size={20} color="#64748B" />
            </View>
            {errors.division && <Text style={styles.errorText}>{errors.division}</Text>}

            <Text style={styles.label}>PASSWORD</Text>
            <View style={[styles.inputContainer, errors.password && styles.inputErrorBorder]}>
              <Ionicons name="lock-closed-outline" size={20} color="#1CA3DE" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Create password" placeholderTextColor="#94A3B8" secureTextEntry onChangeText={(v) => {setFormData({...formData, password: v}); setErrors({...errors, password: null})}} />
            </View>
            <Text style={[styles.helperText, errors.password ? {color: '#EF4444'} : {color: '#94A3B8'}]}>Must be at least 8 characters long</Text>

            <View style={styles.checkboxRow}>
              <TouchableOpacity style={[styles.checkbox, isAgreed && styles.checkboxActive, errors.agreement && {borderColor: '#EF4444'}]} onPress={() => {setIsAgreed(!isAgreed); setErrors({...errors, agreement: null})}}>
                {isAgreed && <Ionicons name="checkmark" size={14} color="#fff" />}
              </TouchableOpacity>
              <Text style={styles.checkboxText}>
                I agree to the <Text style={styles.link} onPress={onNavigateToTerms}>User Terms</Text> and <Text style={styles.link} onPress={onNavigateToPrivacy}>Privacy Policy</Text>.
              </Text>
            </View>
            {errors.agreement && <Text style={styles.errorText}>{errors.agreement}</Text>}

            <TouchableOpacity onPress={handleRegister} disabled={loading}>
              <LinearGradient colors={['#0041C7', '#0D85D8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.button, loading && { opacity: 0.7 }]}>
                <Text style={styles.buttonText}>{loading ? "Saving..." : "Create Account"}</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={onBackToLogin}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ... styles remain the same
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 25 },
  header: { alignItems: 'center', marginBottom: 20 },
  iconCircle: { width: 70, height: 70, borderRadius: 18, backgroundColor: 'rgba(58, 203, 232, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0041C7', marginBottom: 8 },
  subtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', paddingHorizontal: 20 },
  form: { marginTop: 10 },
  label: { fontSize: 11, fontWeight: '700', color: '#1E293B', marginBottom: 8, marginTop: 15 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#3ACBE8', borderRadius: 12, paddingHorizontal: 15, height: 50 },
  inputErrorBorder: { borderColor: '#EF4444' },
  errorText: { color: '#EF4444', fontSize: 10, marginTop: 4, marginLeft: 5 },
  errorTextCenter: { color: '#EF4444', fontSize: 12, textAlign: 'center', marginBottom: 10, fontWeight: 'bold' },
  picker: { flex: 1, marginLeft: -10, color: '#000000' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#1E293B' },
  countryCode: { fontSize: 15, color: '#0160C9', fontWeight: 'bold', marginRight: 10, borderRightWidth: 1, borderRightColor: '#E2E8F0', paddingRight: 10 },
  helperText: { fontSize: 11, marginTop: 5 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 5 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: '#3ACBE8', marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: '#0160C9', borderColor: '#0160C9' },
  checkboxText: { flex: 1, fontSize: 12, color: '#64748B' },
  link: { color: '#0160C9', fontWeight: 'bold' },
  button: { height: 55, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 4, marginTop: 20 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginRight: 10 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30, marginBottom: 40 },
  footerText: { color: '#64748B', fontSize: 14 },
  loginLink: { color: '#0160C9', fontWeight: 'bold', fontSize: 14 }
});