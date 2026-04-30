import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BASE_URL } from '../../src/config';

// --- FIREBASE IMPORTS ---
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../../src/firebaseConfig'; 
import { apiFetch } from '../utils/apiClient';

export default function ForgotPasswordScreen({ onBack, onResetSuccess }) {
  // 1. STATE & HOOKS
  const [step, setStep] = useState('email'); 
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true); // Toggle for password visibility
  
  const [verificationId, setVerificationId] = useState(null);
  const recaptchaVerifier = useRef(null);

  // 2. API HANDLERS
  const handleSendOTP = async () => {
    if (!email) return alert("Please enter your email.");
    setLoading(true);
    try {
      const response = await apiFetch(`${BASE_URL}/api/auth/forgot-password-init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setLoading(false);
        return alert(data.message);
      }
      const phoneProvider = new PhoneAuthProvider(auth);
      const verifyId = await phoneProvider.verifyPhoneNumber(data.phone, recaptchaVerifier.current);
      setVerificationId(verifyId);
      setStep('otp'); 
    } catch (error) {
      alert("Server error. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 6) return alert("Please enter the 6-digit code.");
    setLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      await signInWithCredential(auth, credential);
      setStep('new_password');
    } catch (error) {
      alert("Invalid OTP code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) return alert("Password must be at least 6 characters.");
    setLoading(true);
    try {
      const response = await apiFetch(`${BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), newPassword: newPassword }),
      });
      if (response.ok) {
        alert("Password Reset Successfully!");
        onBack(); 
      } else {
        const data = await response.json();
        alert(data.message);
      }
    } catch (error) {
      alert("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  // 3. UI RENDER
  return (
    <SafeAreaView style={styles.container}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={auth.app.options}
        attemptInvisibleVerification={true}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color="#0160C9" />
            </TouchableOpacity>
            <View style={styles.iconCircle}>
              <Ionicons name={step === 'email' ? "mail" : step === 'otp' ? "keypad" : "lock-closed"} size={35} color="#0160C9" />
            </View>
          </View>

          <Text style={styles.title}>
            {step === 'email' ? "Reset Password" : step === 'otp' ? "Enter OTP" : "New Password"}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'email' ? "Enter your email address to receive a 6-digit verification code." 
              : step === 'otp' ? `We sent a code to your registered phone number.` 
              : "Create a secure new password for your account."}
          </Text>

          <View style={styles.form}>
            {step === 'email' && (
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#0160C9" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Enter your email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              </View>
            )}

            {step === 'otp' && (
              <View style={styles.inputContainer}>
                <Ionicons name="keypad-outline" size={20} color="#0160C9" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Enter 6-digit OTP" value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} />
              </View>
            )}

            {step === 'new_password' && (
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#0160C9" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Enter new password" 
                  value={newPassword} 
                  onChangeText={setNewPassword} 
                  secureTextEntry={secureText} 
                />
                <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                  <Ionicons name={secureText ? "eye-off-outline" : "eye-outline"} size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity 
              onPress={step === 'email' ? handleSendOTP : step === 'otp' ? handleVerifyOTP : handleResetPassword} 
              activeOpacity={0.8} 
              style={styles.btnWrapper}
              disabled={loading}
            >
              <LinearGradient colors={['#0041C7', '#0D85D8']} style={styles.button}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Continue</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// 4. STYLES
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingHorizontal: 25, paddingTop: 60, paddingBottom: 40 },
  header: { marginBottom: 30 },
  backBtn: { width: 40, height: 40, backgroundColor: '#fff', borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, marginBottom: 20 },
  iconCircle: { width: 70, height: 70, borderRadius: 25, backgroundColor: 'rgba(1, 96, 201, 0.1)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#0041C7', marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#64748B', lineHeight: 22, marginBottom: 40 },
  form: { width: '100%' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 15, height: 60, marginBottom: 25 },
  inputIcon: { marginRight: 15 },
  input: { flex: 1, fontSize: 16, color: '#1E293B', fontWeight: '500' },
  btnWrapper: { shadowColor: '#0041C7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  button: { height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});