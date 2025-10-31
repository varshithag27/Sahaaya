import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { getData, saveData } from '../src/services/StorageService';
import { TRANSLATIONS, COLORS } from '../src/utils/constants';
import * as Notifications from 'expo-notifications';

export default function MedicationsScreen() {
  const [medications, setMedications] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [language, setLanguage] = useState('en');
  const [darkMode, setDarkMode] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    time: '',
    frequency: 'daily'
  });

  const router = useRouter();
  const t = TRANSLATIONS[language];
  const colors = darkMode ? COLORS.dark : COLORS.light;

  useEffect(() => {
    loadSettings();
    loadMedications();
    requestNotificationPermission();
  }, []);

  const loadSettings = async () => {
    const lang = await getData('language');
    const dark = await getData('darkMode');
    if (lang) setLanguage(lang);
    if (dark) setDarkMode(dark);
  };

  const loadMedications = async () => {
    const saved = await getData('medications');
    if (saved) setMedications(saved);
  };

  const requestNotificationPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Enable notifications for medication reminders');
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.time) {
      Alert.alert(t.required, 'Please fill all fields');
      return;
    }

    const newMed = {
      id: editingId || Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString()
    };

    let updatedMeds;
    if (editingId) {
      updatedMeds = medications.map(m => m.id === editingId ? newMed : m);
    } else {
      updatedMeds = [...medications, newMed];
    }

    await saveData('medications', updatedMeds);
    setMedications(updatedMeds);
    
    // Schedule notification
    await scheduleNotification(newMed);
    
    Alert.alert(t.medicationAdded);
    resetForm();
  };

  const scheduleNotification = async (med) => {
    const [hours, minutes] = med.time.split(':');
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `💊 ${t.medicationReminder}`,
        body: `Time to take ${med.name} - ${med.dosage}`,
        sound: true,
      },
      trigger: {
        hour: parseInt(hours),
        minute: parseInt(minutes),
        repeats: true,
      },
    });
  };

  const handleDelete = (id) => {
    Alert.alert(
      t.delete,
      t.deleteMedication,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete,
          style: 'destructive',
          onPress: async () => {
            const updated = medications.filter(m => m.id !== id);
            await saveData('medications', updated);
            setMedications(updated);
          }
        }
      ]
    );
  };

  const handleEdit = (med) => {
    setFormData({
      name: med.name,
      dosage: med.dosage,
      time: med.time,
      frequency: med.frequency
    });
    setEditingId(med.id);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', dosage: '', time: '', frequency: 'daily' });
    setEditingId(null);
    setShowModal(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← {t.home}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>💊 {t.medications}</Text>
      </View>

      {/* Medications List */}
      <ScrollView style={styles.list}>
        {medications.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.text }]}>
            {t.noMedications}
          </Text>
        ) : (
          medications.map((med) => (
            <View key={med.id} style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={styles.cardContent}>
                <Text style={[styles.medName, { color: colors.text }]}>{med.name}</Text>
                <Text style={[styles.medDetail, { color: colors.text }]}>
                  💊 {med.dosage}
                </Text>
                <Text style={[styles.medDetail, { color: colors.text }]}>
                  🕐 {med.time} • {med.frequency}
                </Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleEdit(med)}
                >
                  <Text style={styles.actionText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.danger }]}
                  onPress={() => handleDelete(med.id)}
                >
                  <Text style={styles.actionText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.fabText}>+ {t.addMedication}</Text>
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingId ? t.edit : t.addMedication}
            </Text>

            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder={t.medicineName}
              placeholderTextColor={colors.border}
              value={formData.name}
              onChangeText={(text) => setFormData({...formData, name: text})}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder={t.dosage}
              placeholderTextColor={colors.border}
              value={formData.dosage}
              onChangeText={(text) => setFormData({...formData, dosage: text})}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="Time (HH:MM) e.g., 08:00"
              placeholderTextColor={colors.border}
              value={formData.time}
              onChangeText={(text) => setFormData({...formData, time: text})}
            />

            <View style={styles.frequencyRow}>
              {['daily', 'twiceDaily', 'threeTimesDaily'].map((freq) => (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.freqBtn,
                    { backgroundColor: formData.frequency === freq ? colors.primary : colors.card }
                  ]}
                  onPress={() => setFormData({...formData, frequency: freq})}
                >
                  <Text style={[styles.freqText, { 
                    color: formData.frequency === freq ? '#FFF' : colors.text 
                  }]}>
                    {t[freq]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

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
  medName: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  medDetail: { fontSize: 18, marginTop: 3, opacity: 0.8 },
  cardActions: { flexDirection: 'row', gap: 10 },
  actionBtn: { padding: 12, borderRadius: 10, width: 50, alignItems: 'center' },
  actionText: { fontSize: 20 },
  fab: { position: 'absolute', bottom: 30, right: 20, left: 20, padding: 20, borderRadius: 15, alignItems: 'center', elevation: 8 },
  fabText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 20, padding: 25 },
  modalTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { padding: 18, borderRadius: 12, marginBottom: 15, fontSize: 20, borderWidth: 1, borderColor: '#ddd' },
  frequencyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  freqBtn: { padding: 12, borderRadius: 10, flex: 1, marginHorizontal: 3 },
  freqText: { fontSize: 14, textAlign: 'center', fontWeight: '600' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  modalBtn: { flex: 1, padding: 18, borderRadius: 12, alignItems: 'center' },
  modalBtnText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
});