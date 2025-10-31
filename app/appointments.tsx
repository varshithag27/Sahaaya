import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { getData, saveData } from '../src/services/StorageService';
import { TRANSLATIONS, COLORS } from '../src/utils/constants';

export default function AppointmentsScreen() {
  const [appointments, setAppointments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [language, setLanguage] = useState('en');
  const [darkMode, setDarkMode] = useState(false);
  
  const [formData, setFormData] = useState({
    doctorName: '',
    hospital: '',
    date: '',
    time: '',
    notes: ''
  });

  const router = useRouter();
  const t = TRANSLATIONS[language];
  const colors = darkMode ? COLORS.dark : COLORS.light;

  useEffect(() => {
    loadSettings();
    loadAppointments();
  }, []);

  const loadSettings = async () => {
    const lang = await getData('language');
    const dark = await getData('darkMode');
    if (lang) setLanguage(lang);
    if (dark) setDarkMode(dark);
  };

  const loadAppointments = async () => {
    const saved = await getData('appointments');
    if (saved) setAppointments(saved);
  };

  const handleSave = async () => {
    if (!formData.doctorName || !formData.date || !formData.time) {
      Alert.alert(t.required, 'Please fill required fields');
      return;
    }

    const newAppt = {
      id: editingId || Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString()
    };

    let updated;
    if (editingId) {
      updated = appointments.map(a => a.id === editingId ? newAppt : a);
    } else {
      updated = [...appointments, newAppt];
    }

    await saveData('appointments', updated);
    setAppointments(updated);
    Alert.alert(t.appointmentAdded);
    resetForm();
  };

  const handleDelete = (id) => {
    Alert.alert(
      t.delete,
      t.deleteAppointment,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete,
          style: 'destructive',
          onPress: async () => {
            const updated = appointments.filter(a => a.id !== id);
            await saveData('appointments', updated);
            setAppointments(updated);
          }
        }
      ]
    );
  };

  const handleEdit = (appt) => {
    setFormData({
      doctorName: appt.doctorName,
      hospital: appt.hospital,
      date: appt.date,
      time: appt.time,
      notes: appt.notes
    });
    setEditingId(appt.id);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ doctorName: '', hospital: '', date: '', time: '', notes: '' });
    setEditingId(null);
    setShowModal(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← {t.home}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>📅 {t.appointments}</Text>
      </View>

      <ScrollView style={styles.list}>
        {appointments.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.text }]}>
            {t.noAppointments}
          </Text>
        ) : (
          appointments.map((appt) => (
            <View key={appt.id} style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={styles.cardContent}>
                <Text style={[styles.doctorName, { color: colors.text }]}>
                  👨‍⚕️ Dr. {appt.doctorName}
                </Text>
                <Text style={[styles.detail, { color: colors.text }]}>
                  🏥 {appt.hospital}
                </Text>
                <Text style={[styles.detail, { color: colors.text }]}>
                  📅 {appt.date} • 🕐 {appt.time}
                </Text>
                {appt.notes && (
                  <Text style={[styles.notes, { color: colors.text }]}>
                    📝 {appt.notes}
                  </Text>
                )}
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleEdit(appt)}
                >
                  <Text style={styles.actionText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.danger }]}
                  onPress={() => handleDelete(appt.id)}
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
        <Text style={styles.fabText}>+ {t.addAppointment}</Text>
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingId ? t.edit : t.addAppointment}
            </Text>

            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder={t.doctorName}
              placeholderTextColor={colors.border}
              value={formData.doctorName}
              onChangeText={(text) => setFormData({...formData, doctorName: text})}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder={t.hospitalClinic}
              placeholderTextColor={colors.border}
              value={formData.hospital}
              onChangeText={(text) => setFormData({...formData, hospital: text})}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="Date (DD/MM/YYYY)"
              placeholderTextColor={colors.border}
              value={formData.date}
              onChangeText={(text) => setFormData({...formData, date: text})}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="Time (HH:MM)"
              placeholderTextColor={colors.border}
              value={formData.time}
              onChangeText={(text) => setFormData({...formData, time: text})}
            />

            <TextInput
              style={[styles.inputMulti, { backgroundColor: colors.card, color: colors.text }]}
              placeholder={t.notes}
              placeholderTextColor={colors.border}
              multiline
              numberOfLines={3}
              value={formData.notes}
              onChangeText={(text) => setFormData({...formData, notes: text})}
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
  doctorName: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  detail: { fontSize: 18, marginTop: 3, opacity: 0.8 },
  notes: { fontSize: 16, marginTop: 8, fontStyle: 'italic', opacity: 0.7 },
  cardActions: { flexDirection: 'row', gap: 10 },
  actionBtn: { padding: 12, borderRadius: 10, width: 50, alignItems: 'center' },
  actionText: { fontSize: 20 },
  fab: { position: 'absolute', bottom: 30, right: 20, left: 20, padding: 20, borderRadius: 15, alignItems: 'center', elevation: 8 },
  fabText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 20, padding: 25, maxHeight: '90%' },
  modalTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { padding: 18, borderRadius: 12, marginBottom: 15, fontSize: 20, borderWidth: 1, borderColor: '#ddd' },
  inputMulti: { padding: 18, borderRadius: 12, marginBottom: 15, fontSize: 18, borderWidth: 1, borderColor: '#ddd', minHeight: 80, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  modalBtn: { flex: 1, padding: 18, borderRadius: 12, alignItems: 'center' },
  modalBtnText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
});