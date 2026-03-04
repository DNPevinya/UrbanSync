import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function LoginScreen({ onLoginSuccess, onCreateAccount }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    let newErrors = {};
    const emailRegex = /\S+@\S+\.\S+/;

    if (!email.trim()) {
      newErrors.email = "Email or phone is required.";
    } else if (!emailRegex.test(email) && isNaN(email)) {
      newErrors.email = "Please enter a valid email format.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Note: In your Final Year Project, ensure this IP matches your machine's local IP
      const response = await fetch('http://192.168.8.104:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Passing data to Index.tsx for state management
        onLoginSuccess(
          data.user.fullName, 
          data.user.email, 
          data.user.phone, 
          data.user.district, 
          data.user.division
        ); 
      } else {
        setErrors({ server: data.message || "Invalid email or password." });
      }
    } catch (error) {
      setErrors({ server: "Connection error. Ensure your Node.js server is running." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="account-balance" size={50} color="#0160C9" />
          </View>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Log in to report a complaint or provide feedback to Sri Lanka Urban Public Services.
          </Text>
        </View>

        <View style={styles.form}>
          {errors.server && <Text style={styles.serverErrorText}>{errors.server}</Text>}

          <Text style={styles.label}>Email or Phone Number</Text>
          <View style={[styles.inputContainer, errors.email && styles.inputErrorBorder]}>
            <Ionicons name="mail-outline" size={20} color="#1CA3DE" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. sunil@example.com"
              value={email}
              onChangeText={(val) => {
                setEmail(val);
                setErrors({ ...errors, email: null, server: null });
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#94A3B8"
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <View style={styles.labelRow}>
            <Text style={styles.label}>Password</Text>
            <TouchableOpacity>
              <Text style={styles.forgotText}>Forgot?</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.inputContainer, errors.password && styles.inputErrorBorder]}>
            <Ionicons name="lock-closed-outline" size={20} color="#1CA3DE" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              value={password}
              onChangeText={(val) => {
                setPassword(val);
                setErrors({ ...errors, password: null, server: null });
              }}
              secureTextEntry={!showPassword}
              placeholderTextColor="#94A3B8"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          {/* Spacer View: Replaced "Keep me logged in" to maintain spacing */}
          <View style={styles.spacer} />

          <TouchableOpacity onPress={handleLogin} disabled={loading}>
            <LinearGradient 
              colors={['#0041C7', '#0D85D8']} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 0 }} 
              style={[styles.button, loading && { opacity: 0.7 }]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Login</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.orText}>OR LOGIN WITH</Text>
          <TouchableOpacity style={styles.socialIcon}>
            <Ionicons name="person-circle-outline" size={40} color="#0160C9" />
          </TouchableOpacity>

          <View style={styles.signupRow}>
            <Text style={styles.noAccountText}>Don't have an account? </Text>
            <TouchableOpacity onPress={onCreateAccount}>
              <Text style={styles.signupLink}>Create an Account</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.securityRow}>
            <MaterialIcons name="security" size={14} color="#1CA3DE" />
            <Text style={styles.securityText}>SECURE ENCRYPTED CONNECTION</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { flex: 1, paddingHorizontal: 25, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 30 },
  iconCircle: { width: 80, height: 80, borderRadius: 20, backgroundColor: 'rgba(58, 203, 232, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  welcomeText: { fontSize: 28, fontWeight: 'bold', color: '#0041C7', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  form: { marginBottom: 20 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: '#1E293B', marginBottom: 8, marginTop: 15 },
  forgotText: { fontSize: 14, color: '#0160C9', fontWeight: '600', marginTop: 15 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#3ACBE8', borderRadius: 12, paddingHorizontal: 15, height: 55 },
  inputErrorBorder: { borderColor: '#EF4444' }, 
  errorText: { color: '#EF4444', fontSize: 11, marginTop: 5, marginLeft: 2 },
  serverErrorText: { color: '#EF4444', fontSize: 13, textAlign: 'center', marginBottom: 15, fontWeight: '700' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#1E293B' },
  // Added spacer style to preserve the gap before the Login button
  spacer: { marginTop: 15, marginBottom: 25 },
  button: { height: 55, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginRight: 10 },
  footer: { alignItems: 'center', marginTop: 30 },
  orText: { fontSize: 12, fontWeight: '700', color: '#94A3B8', letterSpacing: 1, marginBottom: 15 },
  socialIcon: { marginBottom: 30 },
  signupRow: { flexDirection: 'row', marginBottom: 25 },
  noAccountText: { color: '#64748B', fontSize: 14 },
  signupLink: { color: '#0160C9', fontSize: 14, fontWeight: 'bold' },
  securityRow: { flexDirection: 'row', alignItems: 'center' },
  securityText: { fontSize: 10, color: '#1CA3DE', fontWeight: 'bold', marginLeft: 5, letterSpacing: 0.5 },
});