import React, { useState, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Screen Imports ---
import LoadingScreen from '../src/screens/LoadingScreen';
import WelcomeScreen from '../src/screens/WelcomeScreen';
import LoginScreen from '../src/screens/LoginScreen';
import ForgotPasswordScreen from '../src/screens/ForgotPasswordScreen';
import SignupScreen from '../src/screens/SignupScreen';
import HomeScreen from '../src/screens/HomeScreen';
import ViewComplaintsScreen from '../src/screens/ViewComplaintsScreen';
import ComplaintDetailsScreen from '../src/screens/ComplaintDetailsScreen';
import ChatScreen from '../src/screens/ChatScreen';
import SubmitComplaintScreen from '../src/screens/SubmitComplaintScreen';
import NotificationScreen from '../src/screens/NotificationScreen';

// --- Profile & Legal Screens ---
import ProfileScreen from '../src/screens/ProfileScreen';
import EditProfileScreen from '../src/screens/EditProfileScreen';
import HelpScreen from '../src/screens/HelpScreen';
import FAQScreen from '../src/screens/FAQScreen';
import TermsScreen from '../src/screens/TermsScreen';
import PrivacyScreen from '../src/screens/PrivacyScreen';

// --- Layout Component ---
import MainLayout from '../src/components/MainLayout';

interface UserData {
  name: string;
  email: string;
  phone: string;
  nic: string; 
  district: string;
  division: string;
  profilePicture: string | null; 
}

export default function Index() {
  const [currentStep, setCurrentStep] = useState<string>('loading');
  const [prevStep, setPrevStep] = useState<string>('');

  const [userId, setUserId] = useState<string | number | null>(null);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | number | null>(null);

  const [userName, setUserName] = useState<string>('Citizen');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userPhone, setUserPhone] = useState<string>('');      
  const [userNic, setUserNic] = useState<string>(''); 
  const [userDistrict, setUserDistrict] = useState<string>(''); 
  const [userDivision, setUserDivision] = useState<string>(''); 
  const [userProfilePicture, setUserProfilePicture] = useState<string | null>(null);

  const [signupData, setSignupData] = useState({
    fullName: '', phone: '', email: '', nic: '', district: '', division: '', password: ''
  });
  const [signupAgreed, setSignupAgreed] = useState<boolean>(false);
  const currentUserData: UserData = {
    name: userName, email: userEmail, phone: userPhone, nic: userNic, district: userDistrict, division: userDivision, profilePicture: userProfilePicture, 
  };

  useEffect(() => {
    const prepareApp = async () => {
      try {
        // Check if the user is already logged in
        const savedToken = await AsyncStorage.getItem('urbanSyncToken');
        const savedUserStr = await AsyncStorage.getItem('user');

        if (savedToken && savedUserStr) {
          const savedUser = JSON.parse(savedUserStr);
          
          setUserId(savedUser.id);
          setUserName(savedUser.fullName || 'Citizen');
          setUserEmail(savedUser.email || '');
          setUserPhone(savedUser.phone || '');
          setUserNic(savedUser.nic || '');
          setUserDistrict(savedUser.district || '');
          setUserDivision(savedUser.division || '');
          setUserProfilePicture(savedUser.profilePicture || null);
          
          // Skip login and go straight to the dashboard
          setCurrentStep('dashboard');
        }

        // Drop the splash screen 
        setTimeout(async () => {
          await SplashScreen.hideAsync();
        }, 500);

      } catch (e) {
        console.warn("Startup error parsing user data:", e);
        await SplashScreen.hideAsync();
      }
    };

    prepareApp();

    const subscription = DeviceEventEmitter.addListener('authError', () => {
      setUserId(null);
      setSelectedComplaintId(null);
      setUserName('Citizen');
      setUserEmail('');
      setUserPhone('');
      setUserNic(''); 
      setUserDistrict('');
      setUserDivision('');
      setUserProfilePicture(null);
      
      AsyncStorage.removeItem('urbanSyncToken');
      AsyncStorage.removeItem('user');
      
      setCurrentStep('login');
    });

    return () => subscription.remove();
  }, []);

  // --- STEP 1: LOADING & WELCOME ---
  if (currentStep === 'loading') return <LoadingScreen onFinish={() => setCurrentStep('welcome')} />;
  if (currentStep === 'welcome') return <WelcomeScreen onGetStarted={() => setCurrentStep('login')} />;
  
  // --- STEP 2: AUTHENTICATION ---
  if (currentStep === 'login') {
    return (
      <LoginScreen 
        onLoginSuccess={(id: string | number, name: string, email: string, phone: string, district: string, division: string, profilePic: string | null, nic: string) => {
          setUserId(id); 
          setUserName(typeof name === 'string' ? name : 'Citizen'); 
          setUserEmail(email || ''); 
          setUserPhone(phone || '');
          setUserNic(nic || ''); 
          setUserDistrict(district || ''); 
          setUserDivision(division || ''); 
          setUserProfilePicture(profilePic || null);
          setCurrentStep('dashboard');
        }} 
        onCreateAccount={() => setCurrentStep('signup')}
        onNavigateToForgot={() => setCurrentStep('forgot_password')} 
      />
    );
  }

  if (currentStep === 'forgot_password') {
    return (
      <ForgotPasswordScreen 
        onBack={() => setCurrentStep('login')} 
        onResetSuccess={() => setCurrentStep('login')}
      />
    );
  }

  if (currentStep === 'signup') {
    return (
      <SignupScreen 
        formData={signupData}
        setFormData={setSignupData}
        isAgreed={signupAgreed}
        setIsAgreed={setSignupAgreed}
        onBackToLogin={() => setCurrentStep('login')} 
        onNavigateToTerms={() => { setPrevStep('signup'); setCurrentStep('terms_page'); }}
        onNavigateToPrivacy={() => { setPrevStep('signup'); setCurrentStep('privacy_page'); }}
        onSignupSuccess={(name: string, email: string, phone: string, district: string, division: string, nic: string) => {
          setSignupData({ fullName: '', phone: '', email: '', nic: '', district: '', division: '', password: '' });
          setSignupAgreed(false);
          setCurrentStep('login'); 
        }}
      />
    );
  }

  // --- STEP 3: PROFILE & PAGES ---
  if (currentStep === 'edit_profile') {
    return (
      <EditProfileScreen 
        onBack={() => setCurrentStep('profile')} 
        initialData={currentUserData} 
        onUpdateSuccess={(newName: string, newPhone: string, newDistrict: string, newDivision: string, newProfilePic: string | null) => {
          setUserName(newName); setUserPhone(newPhone); setUserDistrict(newDistrict);
          setUserDivision(newDivision); setUserProfilePicture(newProfilePic);
        }}
      />
    );
  }

  if (currentStep === 'help_page') return <HelpScreen onBack={() => setCurrentStep('profile')} onNavigateToFAQ={() => setCurrentStep('faq_page')} />;
  if (currentStep === 'faq_page') return <FAQScreen onBack={() => setCurrentStep('profile')} />;
  if (currentStep === 'terms_page') return <TermsScreen onBack={() => setCurrentStep(prevStep || 'signup')} />;
  if (currentStep === 'privacy_page') return <PrivacyScreen onBack={() => setCurrentStep(prevStep || 'signup')} />;

  // --- STEP 4: COMPLAINTS & DASHBOARD ---
  if (currentStep === 'submit_complaint') return <SubmitComplaintScreen onBack={() => setCurrentStep('dashboard')} userId={userId} />;
  if (currentStep === 'chat_page') return <ChatScreen onBack={() => setCurrentStep('complaint_details')} complaintId="#SL-8923" />;
  
  if (currentStep === 'complaint_details') {
    return (
      <ComplaintDetailsScreen 
        complaintId={selectedComplaintId}
        onBack={() => setCurrentStep('view_complaints')} 
        onNavigateToChat={() => setCurrentStep('chat_page')} 
      />
    );
  }

  const authenticatedTabs = ['dashboard', 'view_complaints', 'notifications', 'profile'];

  if (authenticatedTabs.includes(currentStep)) {
    return (
      <MainLayout currentTab={currentStep} onTabPress={(tab: string) => setCurrentStep(tab)}>
        {currentStep === 'dashboard' && (
          <HomeScreen 
            userId={userId}
            userFirstName={typeof userName === 'string' && userName ? userName.split(' ')[0] : 'Citizen'}
            onNavigateToSubmit={() => setCurrentStep('submit_complaint')}
            onNavigateToView={() => setCurrentStep('view_complaints')}
            onNavigateToDetails={(id?: string | number) => {
              if (id) setSelectedComplaintId(id);
              setCurrentStep('complaint_details');
            }}
            onNavigateToNotifications={() => setCurrentStep('notifications')}
          />
        )}
        
        {currentStep === 'view_complaints' && (
          <ViewComplaintsScreen 
            onNavigateToDetails={(id: string | number) => {
              setSelectedComplaintId(id);
              setCurrentStep('complaint_details');
            }} 
            userId={userId} 
          />
        )}

        {currentStep === 'notifications' && (
          <NotificationScreen 
            userId={userId} 
            onBack={() => setCurrentStep('dashboard')} 
          />
        )}

        {currentStep === 'profile' && (
          <ProfileScreen 
            userName={userName} userEmail={userEmail} initialData={currentUserData} 
            onNavigateToEdit={() => setCurrentStep('edit_profile')}
            onNavigateToHelp={() => setCurrentStep('help_page')}
            onNavigateToFAQ={() => setCurrentStep('faq_page')}
            onNavigateToTerms={() => { setPrevStep('profile'); setCurrentStep('terms_page'); }}
            onNavigateToPrivacy={() => { setPrevStep('profile'); setCurrentStep('privacy_page'); }}
            onLogout={() => {
              setUserId(null); 
              setSelectedComplaintId(null); 
              setUserName('Citizen'); 
              setUserEmail(''); 
              setUserPhone('');
              setUserNic(''); 
              setUserDistrict(''); 
              setUserDivision(''); 
              setUserProfilePicture(null);
              
              // CRITICAL: Clear the notepad on logout so it doesn't auto-login again!
              AsyncStorage.removeItem('urbanSyncToken');
              AsyncStorage.removeItem('user');
              
              setCurrentStep('login');
            }}
          />
        )}
      </MainLayout>
    );
  }

  return null;
}