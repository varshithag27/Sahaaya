import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, Modal, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useAudioPlayer } from 'expo-audio';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getData, saveData } from '../src/services/StorageService';
import { TRANSLATIONS, COLORS } from '../src/utils/constants';
import {
  requestNotificationPermissions,
  scheduleMedicationReminder,
  cancelMedicationReminder,
  snoozeNotification,
  setupNotificationCategories
} from '../src/services/NotificationService';

export default function MedicationsScreen() {
  const [medications, setMedications] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showMenuId, setShowMenuId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [language, setLanguage] = useState('en');
  const [darkMode, setDarkMode] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    time: '',
    frequency: 'daily'
  });

  const [alarmPlaying, setAlarmPlaying] = useState(false);
  const [playingAlarmId, setPlayingAlarmId] = useState(null);
  
  // Note: Audio player for alarm sound (works in production APK)
  // For Expo Go, we rely on system notification sounds

  const notificationListener = useRef();
  const responseListener = useRef();
  const router = useRouter();
  const t = TRANSLATIONS[language];
  const colors = darkMode ? COLORS.dark : COLORS.light;

  useEffect(() => {
    loadSettings();
    loadMedications();
    initializeNotifications();
    setupAudio();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      const medicationId = notification.request.content.data?.medicationId;
      if (medicationId) {
        playAlarmSound(medicationId);
      }
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      handleNotificationResponse(response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
      if (alarmSound) {
        alarmSound.unloadAsync();
      }
    };
  }, []);

  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
    } catch (error) {
      console.log('Audio setup error:', error);
    }
  };

  const playAlarmSound = async (medicationId) => {
    try {
      if (alarmSound) {
        await alarmSound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/alarm.mp3'), // We'll create this
        { 
          isLooping: true,
          shouldPlay: true,
          volume: 1.0,
        }
      );
      
      setAlarmSound(sound);
      setPlayingAlarmId(medicationId);
      await sound.playAsync();
    } catch (error) {
      console.log('Sound play error:', error);
      // Fallback to system notification sound
    }
  };

  const stopAlarmSound = async () => {
    try {
      if (alarmSound) {
        await alarmSound.stopAsync();
        await alarmSound.unloadAsync();
        setAlarmSound(null);
        setPlayingAlarmId(null);
      }
    } catch (error) {
      console.log('Stop sound error:', error);
    }
  };

  const initializeNotifications = async () => {
    const hasPermission = await requestNotificationPermissions();
    if (hasPermission) {
      await setupNotificationCategories();
    } else {
      Alert.alert(
        'Permissions Required',
        'Please enable notifications to receive medication reminders',
        [{ text: 'OK' }]
      );
    }
  };

  const handleNotificationResponse = async (response) => {
    const { actionIdentifier, notification } = response;
    const medicationId = notification.request.content.data?.medicationId;
    const medicationName = notification.request.content.data?.medicationName;

    if (actionIdentifier === 'taken') {
      await stopAlarmSound();
      await toggleTaken(medicationId, true);
      Alert.alert('✓ Marked as Taken', `${medicationName} marked as taken`);
    } else if (actionIdentifier === 'snooze') {
      await stopAlarmSound();
      const med = medications.find(m => m.id === medicationId);
      if (med) {
        await snoozeNotification(med);
        Alert.alert('⏰ Snoozed', `Reminder set for 10 minutes`);
      }
    } else if (actionIdentifier === 'dismiss') {
      await stopAlarmSound();
    }
  };

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

  const onTimeChange = (event, selected) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    if (selected) {
      setSelectedTime(selected);
      const hours = selected.getHours().toString().padStart(2, '0');
      const minutes = selected.getMinutes().toString().padStart(2, '0');
      setFormData({...formData, time: `${hours}:${minutes}`});
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
      taken: false,
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
    
    const notificationId = await scheduleMedicationReminder(newMed);
    if (notificationId) {
      Alert.alert(
        '✓ ' + t.medicationAdded,
        `Alarm set for ${formData.time} daily. Sound will play until you mark as taken.`
      );
    } else {
      Alert.alert(
        t.medicationAdded,
        'Note: Build APK for full alarm functionality with persistent sound.'
      );
    }
    
    resetForm();
  };

  const toggleTaken = async (id, takenStatus = null) => {
    await stopAlarmSound();
    
    const updated = medications.map(m => {
      if (m.id === id) {
        const newTakenStatus = takenStatus !== null ? takenStatus : !m.taken;
        return { ...m, taken: newTakenStatus };
      }
      return m;
    });
    await saveData('medications', updated);
    setMedications(updated);
  };

  const handleDelete = async (id) => {
    setShowMenuId(null);
    Alert.alert(
      t.delete,
      t.deleteMedication,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete,
          style: 'destructive',
          onPress: async () => {
            await cancelMedicationReminder(id);
            await stopAlarmSound();
            
            const updated = medications.filter(m => m.id !== id);
            await saveData('medications', updated);
            setMedications(updated);
            Alert.alert('Deleted', 'Medication and alarms removed');
          }
        }
      ]
    );
  };

  const handleEdit = (med) => {
    setShowMenuId(null);
    const [hours, minutes] = med.time.split(':');
    const time = new Date();
    time.setHours(parseInt(hours));
    time.setMinutes(parseInt(minutes));
    setSelectedTime(time);
    
    setFormData({
      name: med.name,
      dosage: med.dosage,
      time: med.time,
      frequency: med.frequency
    });
    setEditingId(med.id);
    setShowModal(true);
  };

  const handleSnooze = async (med) => {
    await stopAlarmSound();
    await snoozeNotification(med);
    Alert.alert('⏰ Snoozed', 'Alarm will ring again in 10 minutes');
  };

  const resetForm = () => {
    setFormData({ name: '', dosage: '', time: '', frequency: 'daily' });
    setEditingId(null);
    setShowModal(false);
    setSelectedTime(new Date());
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← {t.home}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>💊 {t.medications}</Text>
      </View>

      <ScrollView style={styles.list}>
        {medications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💊</Text>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              {t.noMedications}
            </Text>
            <Text style={[styles.emptySubText, { color: colors.text }]}>
              Tap + button below to add your first medication
            </Text>
          </View>
        ) : (
          medications.map((med) => (
            <View key={med.id} style={[
              styles.card, 
              { 
                backgroundColor: colors.card,
                borderWidth: playingAlarmId === med.id ? 3 : 0,
                borderColor: playingAlarmId === med.id ? colors.danger : 'transparent'
              }
            ]}>
              {playingAlarmId === med.id && (
                <View style={[styles.alarmBanner, { backgroundColor: colors.danger }]}>
                  <Text style={styles.alarmBannerText}>🔔 ALARM RINGING!</Text>
                </View>
              )}
              
              <View style={styles.cardHeader}>
                <View style={styles.cardContent}>
                  <Text style={[styles.medName, { color: colors.text }]}>{med.name}</Text>
                  <Text style={[styles.medDetail, { color: colors.text }]}>
                    💊 {med.dosage}
                  </Text>
                  <Text style={[styles.medDetail, { color: colors.text }]}>
                    🕐 {med.time} • {med.frequency}
                  </Text>
                  <Text style={[styles.alarmText, { color: colors.primary }]}>
                    🔔 Alarm set • Sound till marked taken
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={() => setShowMenuId(showMenuId === med.id ? null : med.id)}
                >
                  <Text style={[styles.menuDots, { color: colors.text }]}>⋮</Text>
                </TouchableOpacity>

                {showMenuId === med.id && (
                  <View style={[styles.dropdown, { backgroundColor: colors.background }]}>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => handleEdit(med)}
                    >
                      <Text style={[styles.dropdownText, { color: colors.primary }]}>
                        ✏️ {t.edit}
                      </Text>
                    </TouchableOpacity>
                    <View style={[styles.dropdownDivider, { backgroundColor: colors.border }]} />
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => handleDelete(med.id)}
                    >
                      <Text style={[styles.dropdownText, { color: colors.danger }]}>
                        🗑️ {t.delete}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[
                    styles.takenButton,
                    { backgroundColor: med.taken ? colors.success : colors.danger }
                  ]}
                  onPress={() => toggleTaken(med.id)}
                >
                  <Text style={styles.takenText}>
                    {med.taken ? '✓ Taken' : '○ Mark as Taken'}
                  </Text>
                </TouchableOpacity>

                {!med.taken && (
                  <TouchableOpacity
                    style={[styles.snoozeButton, { backgroundColor: colors.warning }]}
                    onPress={() => handleSnooze(med)}
                  >
                    <Text style={styles.snoozeText}>⏰ Snooze</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.fabText}>+ {t.addMedication}</Text>
      </TouchableOpacity>

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
              placeholder={t.dosage + ' (e.g., 500mg, 2 tablets)'}
              placeholderTextColor={colors.border}
              value={formData.dosage}
              onChangeText={(text) => setFormData({...formData, dosage: text})}
            />

            <View style={styles.timePickerContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                ⏰ Alarm Time:
              </Text>
              <TouchableOpacity
                style={[styles.timeButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.timeButtonText}>
                  🕐 {formData.time || 'Select Time'}
                </Text>
              </TouchableOpacity>
            </View>

            {showTimePicker && (
              <DateTimePicker
                value={selectedTime}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={onTimeChange}
              />
            )}

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

            <View style={[styles.noteBox, { backgroundColor: colors.card }]}>
              <Text style={[styles.noteText, { color: colors.text }]}>
                ℹ️ Alarm will ring continuously until you press "Mark as Taken"
              </Text>
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
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 80, marginBottom: 20 },
  emptyText: { fontSize: 22, textAlign: 'center', opacity: 0.6, marginBottom: 10 },
  emptySubText: { fontSize: 16, textAlign: 'center', opacity: 0.4 },
  card: { 
    padding: 20, 
    borderRadius: 15, 
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  alarmBanner: {
    marginBottom: 15,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  alarmBannerText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    position: 'relative',
    marginBottom: 15,
  },
  cardContent: { flex: 1 },
  medName: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  medDetail: { fontSize: 18, marginTop: 3, opacity: 0.8 },
  alarmText: { fontSize: 16, marginTop: 8, fontWeight: '600' },
  menuButton: { padding: 5, width: 40, alignItems: 'center' },
  menuDots: { fontSize: 28, fontWeight: 'bold', lineHeight: 28 },
  dropdown: {
    position: 'absolute',
    right: 10,
    top: 40,
    width: 150,
    borderRadius: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 1000,
    paddingVertical: 5,
  },
  dropdownItem: { padding: 15 },
  dropdownText: { fontSize: 18, fontWeight: '600' },
  dropdownDivider: { height: 1, marginHorizontal: 10 },
  actionButtons: { flexDirection: 'row', gap: 10 },
  takenButton: {
    flex: 2,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  takenText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  snoozeButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  snoozeText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  fab: { 
    position: 'absolute', 
    bottom: 30, 
    right: 20, 
    left: 20, 
    padding: 20, 
    borderRadius: 15, 
    alignItems: 'center', 
    elevation: 8 
  },
  fabText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 20, padding: 25, maxHeight: '90%' },
  modalTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  inputLabel: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  input: { padding: 18, borderRadius: 12, marginBottom: 15, fontSize: 20, borderWidth: 1, borderColor: '#ddd' },
  timePickerContainer: { marginBottom: 15 },
  timeButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  timeButtonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  frequencyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  freqBtn: { padding: 12, borderRadius: 10, flex: 1, marginHorizontal: 3 },
  freqText: { fontSize: 14, textAlign: 'center', fontWeight: '600' },
  noteBox: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  modalBtn: { flex: 1, padding: 18, borderRadius: 12, alignItems: 'center' },
  modalBtnText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
});