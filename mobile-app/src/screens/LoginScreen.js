import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Image, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BASE_URL } from '../../src/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../../src/translations';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../../src/firebaseConfig';

import NationalBadge from '../components/NationalBadge';

export default function LoginScreen({ onLoginSuccess, onCreateAccount, onNavigateToForgot }) {
  // 1. STATE & HOOKS
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');

  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [pendingUser, setPendingUser] = useState(null);

  const recaptchaVerifier = useRef(null);
  const [verificationId, setVerificationId] = useState(null);

  // 2. LIFECYCLE & UTILITIES
  useEffect(() => {
    const loadLang = async () => {
      const savedLang = await AsyncStorage.getItem('userLanguage');
      if (savedLang) setCurrentLang(savedLang);
    };
    loadLang();
  }, []);

  const changeLanguage = async (lang) => {
    setCurrentLang(lang);
    await AsyncStorage.setItem('userLanguage', lang);
  };

  const t = translations[currentLang];

  const validateForm = () => {
    let newErrors = {};
    const emailRegex = /\S+@\S+\.\S+/;
    if (!email.trim()) newErrors.email = "Email or phone is required.";
    else if (!emailRegex.test(email) && isNaN(email)) newErrors.email = "Please enter a valid email format.";
    if (!password) newErrors.password = "Password is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 3. API HANDLERS
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

      if (response.ok && data.status === "2FA_REQUIRED") {
        try {
          const phoneProvider = new PhoneAuthProvider(auth);
          const vId = await phoneProvider.verifyPhoneNumber(
            data.phone,
            recaptchaVerifier.current
          );

          setVerificationId(vId);
          setPendingUser({ ...data.userProfile, token: data.token });
          setIsOtpMode(true);

        } catch (firebaseErr) {
          console.error("Firebase SMS Error:", firebaseErr);
          setErrors({ server: "Failed to send SMS. Please check your number." });
        }

      } else if (response.ok && data.user) {
        const userObj = {
          id: data.user.id, fullName: data.user.fullName, email: data.user.email,
          phone: data.user.phone, district: data.user.district, division: data.user.division,
          profilePicture: data.user.profilePicture || null,
          nic: data.user.nic 
        };
        await AsyncStorage.setItem('user', JSON.stringify(userObj));
        if (data.token) await AsyncStorage.setItem('urbanSyncToken', data.token);

        onLoginSuccess(
          data.user.id, data.user.fullName, data.user.email,
          data.user.phone, data.user.district, data.user.division,
          data.user.profilePicture || null,
          data.user.nic 
        );
      } else {
        setErrors({ server: data.message || "Invalid email or password." });
      }
    } catch (error) {
      setErrors({ server: "Connection error. Check your Server IP & Wi-Fi." });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      setErrors({ server: "Please enter a valid 6-digit code." });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const credential = PhoneAuthProvider.credential(verificationId, otpCode);
      await signInWithCredential(auth, credential);

      const userObj = {
        id: pendingUser.id, fullName: pendingUser.fullName, email: pendingUser.email,
        phone: pendingUser.phone, district: pendingUser.district, division: pendingUser.division,
        profilePicture: pendingUser.profilePicture || null,
        nic: pendingUser.nic 
      };
      await AsyncStorage.setItem('user', JSON.stringify(userObj));
      if (pendingUser.token) await AsyncStorage.setItem('urbanSyncToken', pendingUser.token);

      onLoginSuccess(
        pendingUser.id, pendingUser.fullName, pendingUser.email,
        pendingUser.phone, pendingUser.district, pendingUser.division,
        pendingUser.profilePicture || null,
        pendingUser.nic 
      );

    } catch (error) {
      console.error("OTP Error:", error);
      setErrors({ server: "Invalid OTP code. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // 4. UI RENDER
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoid}>

        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={auth.app.options}
          attemptInvisibleVerification={true}
        />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <View style={styles.headerTopRow}>
            <NationalBadge size="large" />
            <View style={styles.langToggleGroup}>
              {['en', 'si', 'ta'].map((lang) => (
                <TouchableOpacity
                  key={lang}
                  onPress={() => changeLanguage(lang)}
                  style={[styles.langBtn, currentLang === lang && styles.langBtnActive]}
                >
                  <Text style={[styles.langBtnText, currentLang === lang && styles.langBtnTextActive]}>
                    {lang === 'en' ? 'EN' : lang === 'si' ? 'සිං' : 'த'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              <Image source={require('../../assets/images/smartlogo.png')} style={styles.logoImage} resizeMode="cover" />
            </View>
            <Text style={styles.welcomeText}>{t.welcome}</Text>
            <Text style={styles.subtitle}>{t.subtitle}</Text>
          </View>

          <View style={styles.form}>
            {errors.server && (
              <View style={styles.errorBanner}>
                <Ionicons name="warning" size={18} color="#EF4444" />
                <Text style={styles.serverErrorText}>{errors.server}</Text>
              </View>
            )}

            {!isOtpMode ? (
              <>
                <Text style={styles.label}>{t.email_label}</Text>
                <View style={[styles.inputContainer, errors.email && styles.inputErrorBorder]}>
                  <Ionicons name="mail-outline" size={20} color="#0160C9" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input} placeholder="e.g. citizen@example.com" value={email}
                    onChangeText={(val) => { setEmail(val); setErrors({ ...errors, email: null, server: null }); }}
                    keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#94A3B8"
                  />
                </View>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                <View style={styles.labelRow}>
                  <Text style={styles.label}>{t.pass_label}</Text>
                  <TouchableOpacity onPress={onNavigateToForgot}>
                    <Text style={styles.forgotText}>{t.forgot}</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.inputContainer, errors.password && styles.inputErrorBorder]}>
                  <Ionicons name="lock-closed-outline" size={20} color="#0160C9" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input} placeholder="Enter your password" value={password}
                    onChangeText={(val) => { setPassword(val); setErrors({ ...errors, password: null, server: null }); }}
                    secureTextEntry={!showPassword} placeholderTextColor="#94A3B8"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                <View style={styles.spacer} />

                <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
                  <LinearGradient colors={['#0041C7', '#0D85D8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.button, loading && { opacity: 0.7 }]}>
                    {loading ? <ActivityIndicator color="#fff" /> : (
                      <>
                        <Text style={styles.buttonText}>{t.signin}</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.label}>{t.otp_title}</Text>
                <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 15, lineHeight: 20 }}>
                  {t.otp_sub}
                </Text>

                <View style={[styles.inputContainer, { borderColor: '#0160C9', borderWidth: 2 }]}>
                  <Ionicons name="chatbubble-ellipses-outline" size={20} color="#0160C9" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { fontSize: 22, letterSpacing: 8, fontWeight: 'bold', textAlign: 'center' }]}
                    placeholder="------" value={otpCode} onChangeText={setOtpCode}
                    keyboardType="number-pad" maxLength={6} placeholderTextColor="#CBD5E1"
                  />
                </View>

                <View style={styles.spacer} />

                <TouchableOpacity onPress={handleVerifyOtp} disabled={loading} activeOpacity={0.8}>
                  <LinearGradient colors={['#10B981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.button, loading && { opacity: 0.7 }]}>
                    {loading ? <ActivityIndicator color="#fff" /> : (
                      <>
                        <Text style={styles.buttonText}>{t.verify_btn}</Text>
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => { setIsOtpMode(false); setOtpCode(''); }}
                  style={{ marginTop: 25, alignItems: 'center' }}
                >
                  <Text style={{ color: '#64748B', fontWeight: '700', fontSize: 14 }}>{t.cancel}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.footer}>
            <View style={styles.signupRow}>
              <Text style={styles.noAccountText}>{t.new_user}</Text>
              <TouchableOpacity onPress={onCreateAccount}>
                <Text style={styles.signupLink}>{t.create}</Text>
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
  scrollContent: { flexGrow: 1, paddingHorizontal: 25, paddingVertical: 30 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  langToggleGroup: { flexDirection: 'row', alignItems: 'center' },
  langBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginLeft: 8, backgroundColor: '#E2E8F0', borderWidth: 1, borderColor: '#CBD5E1' },
  langBtnActive: { backgroundColor: '#0160C9', borderColor: '#0041C7' },
  langBtnText: { fontSize: 12, fontWeight: '800', color: '#64748B' },
  langBtnTextActive: { color: '#fff' },

  header: { alignItems: 'center', marginBottom: 35 },
  logoWrapper: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, overflow: 'hidden' },
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