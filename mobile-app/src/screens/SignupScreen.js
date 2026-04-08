import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DropDownPicker from 'react-native-dropdown-picker'; 
import { BASE_URL } from '../../src/config';

const locationData = {
  "Colombo": ["Bambalapitiya", "Kollupitiya", "Borella", "Cinnamon Gardens", "Dehiwala"],
  "Gampaha": ["Negombo", "Kelaniya", "Kiribathgoda", "Kadawatha"],
  "Kandy": ["Kandy City", "Peradeniya", "Katugastota"],
  "Kalutara": ["Panadura", "Horana", "Beruwala"]
};

export default function SignupScreen({ 
  formData = { fullName: '', phone: '', email: '', district: '', division: '', password: '' }, 
  setFormData = (data) => {},     
  isAgreed = false,        
  setIsAgreed = (val) => {},     
  onBackToLogin, 
  onNavigateToTerms, 
  onNavigateToPrivacy, 
  onSignupSuccess 
}) {
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 

  const [districtOpen, setDistrictOpen] = useState(false);
  const [divisionOpen, setDivisionOpen] = useState(false);

  const [districtValue, setDistrictValue] = useState(formData.district || null);
  const [divisionValue, setDivisionValue] = useState(formData.division || null);

  const [districtItems, setDistrictItems] = useState(Object.keys(locationData).map(dist => ({ label: dist, value: dist })));
  const [divisionItems, setDivisionItems] = useState([]);

  useEffect(() => {
    if (districtValue) {
      setDivisionItems(locationData[districtValue].map(div => ({ label: div, value: div })));
    } else {
      setDivisionItems([]);
    }
    setFormData(prev => ({...prev, district: districtValue || '', division: divisionValue || ''}));
  }, [districtValue, divisionValue]);

  const validateForm = () => {
    let newErrors = {};
    const emailRegex = /\S+@\S+\.\S+/;
    const phoneRegex = /^[7]\d{8}$/; 

    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required.";
    if (!phoneRegex.test(formData.phone)) newErrors.phone = "Enter 9 digits starting with 7 (e.g. 771234567).";
    if (!emailRegex.test(formData.email)) newErrors.email = "Enter a valid email address.";
    if (!districtValue) newErrors.district = "Please select a district.";
    if (!divisionValue) newErrors.division = "Please select a division.";
    if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters.";
    if (!isAgreed) newErrors.agreement = "You must agree to the terms.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData), 
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Account created successfully!", [
          { text: "OK", onPress: () => onSignupSuccess(formData.fullName, formData.email, formData.phone, districtValue, divisionValue) }
        ]);
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
            <View style={styles.logoWrapper}>
              <Image 
                source={require('../../assets/images/smartlogo.png')} 
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join UrbanSync to help improve our city.</Text>
          </View>

          <View style={styles.form}>
            {errors.server && (
               <View style={styles.errorBanner}>
                  <Ionicons name="warning" size={18} color="#EF4444" />
                  <Text style={styles.serverErrorText}>{errors.server}</Text>
               </View>
            )}

            <Text style={styles.label}>FULL NAME</Text>
            <View style={[styles.inputContainer, errors.fullName && styles.inputErrorBorder]}>
              <Ionicons name="person-outline" size={20} color="#0160C9" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Sunil Perera" placeholderTextColor="#94A3B8" value={formData.fullName} onChangeText={(v) => {setFormData({...formData, fullName: v}); setErrors({...errors, fullName: null})}} />
            </View>
            {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}

            <Text style={styles.label}>PHONE NUMBER</Text>
            <View style={[styles.inputContainer, errors.phone && styles.inputErrorBorder]}>
              <Text style={styles.countryCode}>+94</Text>
              <TextInput style={styles.input} placeholder="77 123 4567" placeholderTextColor="#94A3B8" keyboardType="phone-pad" maxLength={9} value={formData.phone} onChangeText={(v) => {setFormData({...formData, phone: v}); setErrors({...errors, phone: null})}} />
            </View>
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <View style={[styles.inputContainer, errors.email && styles.inputErrorBorder]}>
              <Ionicons name="mail-outline" size={20} color="#0160C9" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="citizen@example.com" placeholderTextColor="#94A3B8" keyboardType="email-address" autoCapitalize="none" value={formData.email} onChangeText={(v) => {setFormData({...formData, email: v}); setErrors({...errors, email: null})}} />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            {/* --- DISTRICT MODAL DROPDOWN --- */}
            <Text style={styles.label}>DISTRICT</Text>
            <View> 
              <DropDownPicker
                open={districtOpen}
                value={districtValue}
                items={districtItems}
                setOpen={setDistrictOpen}
                setValue={setDistrictValue}
                setItems={setDistrictItems}
                onChangeValue={() => { setDivisionValue(null); setErrors({...errors, district: null}); }}
                placeholder="Select your district"
                style={[styles.dropdownStyle, errors.district && styles.inputErrorBorder]}
                textStyle={styles.dropdownText}
                placeholderStyle={styles.dropdownPlaceholder}
                listMode="MODAL"
                modalProps={{ animationType: "slide" }}
                modalTitle="Select Your District"
                modalTitleStyle={{ fontWeight: 'bold', color: '#0041C7', fontSize: 18 }}
              />
            </View>
            {errors.district && <Text style={styles.errorText}>{errors.district}</Text>}

            {/* --- DIVISION MODAL DROPDOWN --- */}
            <Text style={styles.label}>DIVISION/AREA</Text>
            <View style={{ opacity: districtValue ? 1 : 0.5, zIndex: -1 }}>
              <DropDownPicker
                open={divisionOpen}
                value={divisionValue}
                items={divisionItems}
                setOpen={setDivisionOpen}
                setValue={setDivisionValue}
                setItems={setDivisionItems}
                onChangeValue={() => setErrors({...errors, division: null})}
                placeholder="Select your division"
                disabled={!districtValue} 
                style={[styles.dropdownStyle, errors.division && styles.inputErrorBorder]}
                textStyle={styles.dropdownText}
                placeholderStyle={styles.dropdownPlaceholder}
                listMode="MODAL"
                modalProps={{ animationType: "slide" }}
                modalTitle="Select Your Division"
                modalTitleStyle={{ fontWeight: 'bold', color: '#0041C7', fontSize: 18 }}
              />
            </View>
            {errors.division && <Text style={styles.errorText}>{errors.division}</Text>}

            <Text style={styles.label}>PASSWORD</Text>
            <View style={[styles.inputContainer, errors.password && styles.inputErrorBorder]}>
              <Ionicons name="lock-closed-outline" size={20} color="#0160C9" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Create password" 
                placeholderTextColor="#94A3B8" 
                secureTextEntry={!showPassword} 
                value={formData.password} 
                onChangeText={(v) => {setFormData({...formData, password: v}); setErrors({...errors, password: null})}} 
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748B" />
              </TouchableOpacity>
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

            <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
              <LinearGradient colors={['#0041C7', '#0D85D8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.button, loading && { opacity: 0.7 }]}>
                <Text style={styles.buttonText}>{loading ? "Saving..." : "Create Account"}</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={onBackToLogin}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 25 },
  header: { alignItems: 'center', marginBottom: 25 },
  logoWrapper: { 
    width: 90, 
    height: 90, 
    borderRadius: 45, 
    backgroundColor: '#fff', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 15, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 10, 
    elevation: 5, 
    overflow: 'hidden' 
  },
  logoImage: { width: '130%', height: '130%' },
  title: { fontSize: 26, fontWeight: '800', color: '#0041C7', marginBottom: 8 },
  subtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', paddingHorizontal: 20 },
  form: { marginTop: 10 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 12, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#FECACA' },
  label: { fontSize: 12, fontWeight: '700', color: '#1E293B', marginBottom: 8, marginTop: 15, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 15, height: 58 },
  inputErrorBorder: { borderColor: '#EF4444' },
  dropdownStyle: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, minHeight: 58, paddingHorizontal: 15, elevation: 0 },
  dropdownText: { fontSize: 15, color: '#1E293B' },
  dropdownPlaceholder: { color: '#94A3B8', fontSize: 15 },
  errorText: { color: '#EF4444', fontSize: 11, marginTop: 4, marginLeft: 5, fontWeight: '500' },
  serverErrorText: { color: '#EF4444', fontSize: 13, fontWeight: '700', marginLeft: 8 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15, color: '#1E293B' },
  countryCode: { fontSize: 15, color: '#0160C9', fontWeight: 'bold', marginRight: 12, borderRightWidth: 1, borderRightColor: '#E2E8F0', paddingRight: 12 },
  helperText: { fontSize: 11, marginTop: 6, marginLeft: 5 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 25, marginBottom: 5 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: '#E2E8F0', marginRight: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  checkboxActive: { backgroundColor: '#0160C9', borderColor: '#0160C9' },
  checkboxText: { flex: 1, fontSize: 13, color: '#64748B', lineHeight: 20 },
  link: { color: '#0160C9', fontWeight: 'bold' },
  button: { height: 60, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 4, marginTop: 25 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginRight: 10 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30, marginBottom: 40 },
  footerText: { color: '#64748B', fontSize: 15 },
  loginLink: { color: '#0041C7', fontWeight: 'bold', fontSize: 15 }
});