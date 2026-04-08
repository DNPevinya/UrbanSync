import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BASE_URL } from '../../src/config';

export default function LoginScreen({ onLoginSuccess, onCreateAccount, onNavigateToForgot }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    let newErrors = {};
    const emailRegex = /\S+@\S+\.\S+/;
    if (!email.trim()) newErrors.email = "Email or phone is required.";
    else if (!emailRegex.test(email) && isNaN(email)) newErrors.email = "Please enter a valid email format.";
    if (!password) newErrors.password = "Password is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setErrors({}); 

    try {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      });

      const data = await response.json();
      
      if (response.ok && data.user) {
        onLoginSuccess(
          data.user.id,          
          data.user.fullName,    
          data.user.email,       
          data.user.phone,       
          data.user.district,    
          data.user.division,    
          data.user.profilePicture || null 
        ); 
      } else {
        // ERROR FROM SERVER (e.g., Wrong Password)
        setErrors({ server: data.message || "Invalid email or password." });
      }
    } catch (error) {
      // NETWORK ERROR 
      console.error("Login Connection Error:", error);
      setErrors({ server: "Connection error. Check your Server IP & Wi-Fi." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoid}>
        
        {/* MAGIC HAPPENS HERE: ScrollView with flexGrow */}
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              <Image 
                source={require('../../assets/images/smartlogo.png')} 
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.subtitle}>Log in to report a complaint or provide feedback to UrbanSync.</Text>
          </View>

          <View style={styles.form}>
            {errors.server && (
               <View style={styles.errorBanner}>
                  <Ionicons name="warning" size={18} color="#EF4444" />
                  <Text style={styles.serverErrorText}>{errors.server}</Text>
               </View>
            )}

            <Text style={styles.label}>Email Address</Text>
            <View style={[styles.inputContainer, errors.email && styles.inputErrorBorder]}>
              <Ionicons name="mail-outline" size={20} color="#0160C9" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="e.g. citizen@example.com" 
                value={email} 
                onChangeText={(val) => { setEmail(val); setErrors({ ...errors, email: null, server: null }); }} 
                keyboardType="email-address" 
                autoCapitalize="none" 
                placeholderTextColor="#94A3B8" 
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            <View style={styles.labelRow}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity onPress={onNavigateToForgot}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.inputContainer, errors.password && styles.inputErrorBorder]}>
              <Ionicons name="lock-closed-outline" size={20} color="#0160C9" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Enter your password" 
                value={password} 
                onChangeText={(val) => { setPassword(val); setErrors({ ...errors, password: null, server: null }); }} 
                secureTextEntry={!showPassword} 
                placeholderTextColor="#94A3B8" 
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

            <View style={styles.spacer} />

            <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
              <LinearGradient colors={['#0041C7', '#0D85D8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.button, loading && { opacity: 0.7 }]}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                      <Text style={styles.buttonText}>Sign In</Text>
                      <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <View style={styles.signupRow}>
              <Text style={styles.noAccountText}>New to UrbanSync? </Text>
              <TouchableOpacity onPress={onCreateAccount}>
                <Text style={styles.signupLink}>Create an Account</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.securityRow}>
              <MaterialIcons name="security" size={14} color="#0160C9" />
              <Text style={styles.securityText}>SECURE ENCRYPTED CONNECTION</Text>
            </View>
          </View>
          
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  keyboardAvoid: { flex: 1 },
  // Changed this from 'content' to 'scrollContent' and added flexGrow
  scrollContent: { flexGrow: 1, paddingHorizontal: 25, justifyContent: 'center', paddingVertical: 30 },
  header: { alignItems: 'center', marginBottom: 35 },
  logoWrapper: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: '#fff', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 10, 
    elevation: 5, 
    overflow: 'hidden' 
  },
  logoImage: { width: '130%', height: '130%' },
  welcomeText: { fontSize: 28, fontWeight: '800', color: '#0041C7', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  form: { marginBottom: 10 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 12, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#FECACA' },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  label: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  forgotText: { fontSize: 13, color: '#0D85D8', fontWeight: '700' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 15, height: 58 },
  inputErrorBorder: { borderColor: '#EF4444' }, 
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 5, marginLeft: 2, fontWeight: '500' },
  serverErrorText: { color: '#EF4444', fontSize: 13, fontWeight: '700', marginLeft: 8 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1E293B' },
  spacer: { marginTop: 30 },
  button: { height: 60, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginRight: 10 },
  footer: { alignItems: 'center', marginTop: 20 },
  signupRow: { flexDirection: 'row', marginBottom: 25 },
  noAccountText: { color: '#64748B', fontSize: 15 },
  signupLink: { color: '#0041C7', fontSize: 15, fontWeight: 'bold' },
  securityRow: { flexDirection: 'row', alignItems: 'center', opacity: 0.8 },
  securityText: { fontSize: 10, color: '#0160C9', fontWeight: 'bold', marginLeft: 5, letterSpacing: 1 },
});