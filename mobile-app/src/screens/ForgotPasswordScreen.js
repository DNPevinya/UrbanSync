import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BASE_URL } from '../../src/config';

export default function ForgotPasswordScreen({ onBack, onResetSuccess }) {
  const [step, setStep] = useState('email'); 
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSendOTP = async () => {
    if (!email) return alert("Please enter your email.");
    try {
      await fetch('http://192.168.8.103:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      setStep('otp'); 
    } catch (error) {
      alert("Server error. Check your connection.");
    }
  };

  const handleVerifyOTP = () => {
    if (otp.length === 4) setStep('new_password');
    else alert("Please enter the 4-digit code.");
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 8) return alert("Password must be at least 8 characters.");
    
    try {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), otp, newPassword }),
      });
      
      const data = await response.json();
      if (response.ok) {
        alert("Password Reset Successfully!");
        if (onResetSuccess) onResetSuccess();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Error connecting to server.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        
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
          {step === 'email' ? "Enter your email address to receive a 4-digit verification code." 
            : step === 'otp' ? `We sent a code to ${email}` 
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
              <TextInput style={styles.input} placeholder="Enter 4-digit OTP" value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={4} />
            </View>
          )}

          {step === 'new_password' && (
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#0160C9" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Enter new password" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
            </View>
          )}

          <TouchableOpacity 
            onPress={step === 'email' ? handleSendOTP : step === 'otp' ? handleVerifyOTP : handleResetPassword} 
            activeOpacity={0.8} 
            style={styles.btnWrapper}
          >
            <LinearGradient colors={['#0041C7', '#0D85D8']} style={styles.button}>
              <Text style={styles.buttonText}>
                {step === 'email' ? "Send OTP" : step === 'otp' ? "Verify Code" : "Update Password"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { flex: 1, paddingHorizontal: 25, paddingTop: 60, },
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
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },
});