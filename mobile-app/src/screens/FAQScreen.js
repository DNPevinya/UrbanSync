import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FAQScreen({ onBack }) {
  const faqs = [
    {
      question: "How long does it take to fix a reported issue?",
      answer: "Most minor repairs like street lighting or waste collection are addressed within 48 hours. Major repairs like road paving typically take 5-10 working days."
    },
    {
      question: "Will my identity be visible to the public?",
      answer: "No. Your personal details are only visible to the assigned government officer handling your case. Other citizens cannot see who submitted a specific complaint."
    },
    {
      question: "Can I report issues in other districts?",
      answer: "Yes. Our system uses GPS to automatically route your complaint to the correct local authority, regardless of where you are currently registered."
    },
    {
      question: "How do I know if my complaint is actually being worked on?",
      answer: "You can check the 'Status Timeline' in your complaint details. You will receive a notification every time an officer updates the status to 'In Progress' or 'Resolved'."
    },
    {
      question: "What if the authority provides an unsatisfactory resolution?",
      answer: "You can use the 'Chat with Authority' feature to request further clarification or reopen the discussion if the work was not completed properly."
    }
  ];

  return (
    <SafeAreaView style={styles.container} edges={Platform.OS === 'android' ? ['top'] : []}>
      
      <View style={[styles.topNavBar, Platform.OS === 'ios' && { paddingTop: 20 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#0041C7" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>FAQ</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subTitle}>FREQUENTLY ASKED QUESTIONS</Text>
        
        {faqs.map((item, index) => (
          <View key={index} style={styles.faqCard}>
            <View style={styles.questionRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="help" size={20} color="#0160C9" />
              </View>
              <Text style={styles.questionText}>{item.question}</Text>
            </View>
            <View style={styles.answerRow}>
              <Text style={styles.answerText}>{item.answer}</Text>
            </View>
          </View>
        ))}

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Still have questions?</Text>
          <TouchableOpacity style={styles.contactBtn} activeOpacity={0.8}>
            <Ionicons name="headset-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.contactBtnText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  
  topNavBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#F8FAFC' },
  backBtn: { flexDirection: 'row', alignItems: 'center', width: 70 },
  backText: { color: '#0041C7', fontSize: 16, fontWeight: '600', marginLeft: 4 },
  navTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  
  content: { padding: 25 },
  subTitle: { fontSize: 12, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, marginBottom: 20, marginLeft: 5 },
  
  faqCard: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 20, 
    borderWidth: 1.5, 
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 5
  },
  questionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconCircle: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(1, 96, 201, 0.08)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  questionText: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: '#1E293B', 
    flex: 1,
    lineHeight: 22
  },
  answerRow: { 
    paddingLeft: 20, 
    borderLeftWidth: 3, 
    borderLeftColor: '#0160C9', 
    marginLeft: 16,
    marginTop: 5
  },
  answerText: { fontSize: 14, color: '#64748B', lineHeight: 22, fontWeight: '500' },
  
  contactSection: { marginTop: 25, alignItems: 'center', paddingBottom: 50 },
  contactTitle: { fontSize: 15, color: '#64748B', marginBottom: 15, fontWeight: '600' },
  contactBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0041C7', 
    paddingHorizontal: 30, 
    paddingVertical: 15, 
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#0041C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6
  },
  contactBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});