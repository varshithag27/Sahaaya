import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, Modal, Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SMS from 'expo-sms';
import { getData, saveData } from '../src/services/StorageService';
import { TRANSLATIONS, COLORS } from '../src/utils/constants';

export default function ContactsScreen() {
  const [contacts, setContacts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [language, setLanguage] = useState('en');
  const [darkMode, setDarkMode] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    relationship: ''
  });

  const router = useRouter();
  const t = TRANSLATIONS[language];
  const colors = darkMode ? COLORS.dark : COLORS.light;

  useEffect(() => {
    loadSettings();
    loadContacts();
  }, []);

  const loadSettings = async () => {
    const lang = await getData('language');
    const dark = await getData('darkMode');
    if (lang) setLanguage(lang);
    if (dark) setDarkMode(dark);
  };

  const loadContacts = async () => {
    const saved = await getData('emergencyContacts');
    if (saved) setContacts(saved);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone) {
      Alert.alert(t.required, 'Name and phone number are required');
      return;
    }

    if (formData.phone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return;
    }

    const newContact = {
      id: editingId || Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString()
    };

    let updated;
    if (editingId) {
      updated = contacts.map(c => c.id === editingId ? newContact : c);
    } else {
      updated = [...contacts, newContact];
    }

    await saveData('emergencyContacts', updated);
    setContacts(updated);
    Alert.alert(t.contactAdded);
    resetForm();
  };

  const handleDelete = (id) => {
    Alert.alert(
      t.delete,
      t.deleteContact,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete,
          style: 'destructive',
          onPress: async () => {
            const updated = contacts.filter(c => c.id !== id);
            await saveData('emergencyContacts', updated);
            setContacts(updated);
          }
        }
      ]
    );
  };

  const handleEdit = (contact) => {
    setFormData({
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship
    });
    setEditingId(contact.id);
    setShowModal(true);
  };

  const handleCall = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleSMS = async (phone, name) => {
    const isAvailable = await SMS.isAvailableAsync();
    if (isAvailable) {
      await SMS.sendSMSAsync(
        [phone],
        'Hello! This is a message from Sahaaya healthcare app.'
      );
    } else {
      Alert.alert('SMS Not Available', 'Cannot send SMS on this device');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', relationship: '' });
    setEditingId(null);
    setShowModal(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← {t.home}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>📞 {t.contacts}</Text>
      </View>

      <ScrollView style={styles.list}>
        {contacts.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.text }]}>
            {t.noContacts}
          </Text>
        ) : (
          contacts.map((contact) => (
            <View key={contact.id} style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={styles.cardContent}>
                <Text style={[styles.contactName, { color: colors.text }]}>
                  👤 {contact.name}
                </Text>
                <Text style={[styles.detail, { color: colors.text }]}>
                  📱 {contact.phone}
                </Text>
                {contact.relationship && (
                  <Text style={[styles.detail, { color: colors.text }]}>
                    💼 {contact.relationship}
                  </Text>
                )}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.callBtn, { backgroundColor: colors.success }]}
                    onPress={() => handleCall(contact.phone)}
                  >
                    <Text style={styles.btnText}>📞 {t.callNow}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.smsBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleSMS(contact.phone, contact.name)}
                  >
                    <Text style={styles.btnText}>💬 {t.sendSMS}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleEdit(contact)}
                >
                  <Text style={styles.actionText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.danger }]}
                  onPress={() => handleDelete(contact.id)}
                >
                  <Text style={styles.actionText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.fabText}>+ {t.addContact}</Text>
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingId ? t.edit : t.addContact}
            </Text>

            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder={t.contactName}
              placeholderTextColor={colors.border}
              value={formData.name}
              onChangeText={(text) => setFormData({...formData, name: text})}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder={t.phoneNumberContact}
              placeholderTextColor={colors.border}
              keyboardType="phone-pad"
              maxLength={10}
              value={formData.phone}
              onChangeText={(text) => setFormData({...formData, phone: text})}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder={t.relationship + ' (e.g., Son, Daughter, Friend)'}
              placeholderTextColor={colors.border}
              value={formData.relationship}
              onChangeText={(text) => setFormData({...formData, relationship: text})}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.border }]}
                onPress={resetForm}
              >
                <Text style={styles.modalBtnText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.success }]}
                onPress={handleSave}
              >
                <Text style={styles.modalBtnText}>{t.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, flexDirection: 'row', alignItems: 'center' },
  backBtn: { fontSize: 20, fontWeight: 'bold', marginRight: 15 },
  title: { fontSize: 32, fontWeight: 'bold' },
  list: { flex: 1, padding: 20 },
  emptyText: { fontSize: 20, textAlign: 'center', marginTop: 50, opacity: 0.5 },
  card: { padding: 20, borderRadius: 15, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between' },
  cardContent: { flex: 1 },
  contactName: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  detail: { fontSize: 18, marginTop: 3, opacity: 0.8 },
  actionRow: { flexDirection: 'row', marginTop: 12, gap: 10 },
  callBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  smsBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  cardActions: { flexDirection: 'column', gap: 10 },
  actionBtn: { padding: 12, borderRadius: 10, width: 50, alignItems: 'center' },
  actionText: { fontSize: 20 },
  fab: { position: 'absolute', bottom: 30, right: 20, left: 20, padding: 20, borderRadius: 15, alignItems: 'center', elevation: 8 },
  fabText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 20, padding: 25 },
  modalTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { padding: 18, borderRadius: 12, marginBottom: 15, fontSize: 20, borderWidth: 1, borderColor: '#ddd' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  modalBtn: { flex: 1, padding: 18, borderRadius: 12, alignItems: 'center' },
  modalBtnText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
});