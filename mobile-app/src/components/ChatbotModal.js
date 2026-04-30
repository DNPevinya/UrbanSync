import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Modal, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BASE_URL } from '../../src/config';
import { apiFetch } from '../utils/apiClient';

export default function ChatbotModal({ visible, onClose }) {
  // 1. STATE & HOOKS
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hello! I am the UrbanSync AI Assistant. How can I help you today?', sender: 'bot' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef();

  // 2. API HANDLERS
  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    const newUserMessage = { id: Date.now().toString(), text: userMsg, sender: 'user' };
    
    setMessages(prev => [...prev, newUserMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await apiFetch(`${BASE_URL}/api/chat/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const botReply = { id: (Date.now() + 1).toString(), text: data.reply, sender: 'bot' };
        setMessages(prev => [...prev, botReply]);
      } else {
        const errorReply = { id: (Date.now() + 1).toString(), text: "I'm having trouble connecting to the UrbanSync network right now. Please try again later.", sender: 'bot' };
        setMessages(prev => [...prev, errorReply]);
      }
    } catch (error) {
      const errorReply = { id: (Date.now() + 1).toString(), text: "Network error. Please check your connection.", sender: 'bot' };
      setMessages(prev => [...prev, errorReply]);
    } finally {
      setIsTyping(false);
    }
  };

  // 3. UI RENDER
  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            
            <View style={styles.header}>
              <View style={styles.headerTitleWrap}>
                <View style={styles.botIconWrap}>
                  <MaterialCommunityIcons name="robot-outline" size={24} color="#0041C7" />
                </View>
                <View>
                  <Text style={styles.headerTitle}>UrbanSync Assistant</Text>
                  <Text style={styles.headerStatus}>Online - Powered by AI</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="chevron-down" size={28} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              ref={scrollViewRef}
              onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
              contentContainerStyle={styles.chatScroll}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((msg) => (
                <View key={msg.id} style={[styles.messageWrapper, msg.sender === 'user' ? styles.messageUserWrap : styles.messageBotWrap]}>
                  {msg.sender === 'bot' ? (
                    <LinearGradient colors={['#F1F5F9', '#E2E8F0']} style={styles.bubbleBot}>
                      <Text style={styles.textBot}>{msg.text}</Text>
                    </LinearGradient>
                  ) : (
                    <LinearGradient colors={['#0041C7', '#0D85D8']} style={styles.bubbleUser}>
                      <Text style={styles.textUser}>{msg.text}</Text>
                    </LinearGradient>
                  )}
                </View>
              ))}
              {isTyping && (
                <View style={styles.messageWrapper}>
                  <View style={styles.typingBubble}>
                    <ActivityIndicator size="small" color="#0041C7" />
                    <Text style={styles.typingText}>AI is thinking...</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.inputArea}>
              <TextInput 
                style={styles.input}
                placeholder="Ask me anything..."
                placeholderTextColor="#94A3B8"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSend}
              />
              <TouchableOpacity 
                style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]} 
                onPress={handleSend} 
                disabled={!inputText.trim() || isTyping}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// 4. STYLES
const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { height: '85%', backgroundColor: '#F8FAFC', borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitleWrap: { flexDirection: 'row', alignItems: 'center' },
  botIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  headerStatus: { fontSize: 12, color: '#10B981', fontWeight: '600', marginTop: 2 },
  closeBtn: { padding: 5 },
  chatScroll: { padding: 20, paddingBottom: 30 },
  messageWrapper: { marginBottom: 15, width: '100%' },
  messageUserWrap: { alignItems: 'flex-end' },
  messageBotWrap: { alignItems: 'flex-start' },
  bubbleBot: { maxWidth: '80%', padding: 15, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomRightRadius: 20, borderBottomLeftRadius: 5 },
  textBot: { fontSize: 15, color: '#1E293B', lineHeight: 22 },
  bubbleUser: { maxWidth: '80%', padding: 15, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 5 },
  textUser: { fontSize: 15, color: '#fff', lineHeight: 22 },
  typingBubble: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#F1F5F9', padding: 12, borderRadius: 20 },
  typingText: { marginLeft: 8, fontSize: 13, color: '#64748B', fontWeight: '500' },
  inputArea: { flexDirection: 'row', padding: 15, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E2E8F0', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 25, paddingHorizontal: 20, paddingVertical: 12, fontSize: 15, color: '#1E293B', borderWidth: 1, borderColor: '#E2E8F0' },
  sendBtn: { width: 45, height: 45, borderRadius: 25, backgroundColor: '#0041C7', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  sendBtnDisabled: { backgroundColor: '#94A3B8' }
});