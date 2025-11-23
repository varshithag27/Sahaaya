import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, Modal, Platform, Vibration
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { getData, saveData } from '../src/services/StorageService';
import { TRANSLATIONS, COLORS } from '../src/utils/constants';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function MedicationsScreen() {
  const [medications, setMedications] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showMenuId, setShowMenuId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [language, setLanguage] = useState('en');
  const [darkMode, setDarkMode] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const [currentAlarmMed, setCurrentAlarmMed] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    time: '',
    frequency: 'daily'
  });

  const soundRef = useRef(null);
  const vibrationIntervalRef = useRef(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  const router = useRouter();
  const t = TRANSLATIONS[language];
  const colors = darkMode ? COLORS.dark : COLORS.light;

  const navigateHome = () => {
    // Try to navigate to home/index route
    try {
      router.push('/'); // or router.replace('/') to prevent going back
    } catch (error) {
      router.back(); // Fallback to back navigation
    }
  };

  useEffect(() => {
    loadSettings();
    loadMedications();
    requestPermissions();
    setupNotificationListeners();

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      stopAlarm();
    };
  }, []);

  useEffect(() => {
    // Check for alarms every minute
    const interval = setInterval(() => {
      checkForAlarms();
      resetDailyTakenStatus();
    }, 60000); // Check every minute

    // Check immediately on mount
    checkForAlarms();
    resetDailyTakenStatus();

    return () => clearInterval(interval);
  }, [medications]);

  const resetDailyTakenStatus = async () => {
    const today = new Date().toDateString();
    const lastResetDate = await getData('lastResetDate');
    
    if (lastResetDate !== today) {
      // Reset all medications' taken status
      const resetMeds = medications.map(med => ({
        ...med,
        taken: false,
        lastTakenDate: med.taken ? new Date().toISOString() : med.lastTakenDate
      }));
      
      await saveData('medications', resetMeds);
      await saveData('lastResetDate', today);
      setMedications(resetMeds);
    }
  };

  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please enable notifications for medication reminders');
    }
  };

  const setupNotificationListeners = () => {
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      const medId = notification.request.content.data?.medicationId;
      const med = medications.find(m => m.id === medId);
      if (med && !med.taken) {
        triggerAlarm(med);
      }
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const medId = response.notification.request.content.data?.medicationId;
      const action = response.actionIdentifier;
      
      if (action === 'taken') {
        toggleTaken(medId, true);
      } else if (action === 'snooze') {
        handleSnooze(medications.find(m => m.id === medId));
      }
    });
  };

  const checkForAlarms = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    medications.forEach(med => {
      if (med.time === currentTime && !med.taken && currentAlarmMed?.id !== med.id) {
        triggerAlarm(med);
      }
    });
  };

  const triggerAlarm = async (med) => {
    setCurrentAlarmMed(med);
    setShowAlarmModal(true);
    
    // Start continuous vibration
    const VIBRATION_PATTERN = [0, 500, 500];
    vibrationIntervalRef.current = setInterval(() => {
      Vibration.vibrate(VIBRATION_PATTERN);
    }, 1000);

    // Play alarm sound (optional - works better in built APK)
    try {
      const { sound } = await Audio.Sound.createAsync(
        // Use a default system sound or add your own alarm.mp3 to assets
        { uri: 'https://www.soundjay.com/phone/sounds/phone-calling-1.mp3' },
        { shouldPlay: true, isLooping: true, volume: 1.0 }
      );
      soundRef.current = sound;
    } catch (error) {
      console.log('Sound not available, using vibration only');
    }
  };

  const stopAlarm = async () => {
    // Stop vibration
    Vibration.cancel();
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = null;
    }

    // Stop sound
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      } catch (error) {
        console.log('Error stopping sound:', error);
      }
    }

    setShowAlarmModal(false);
    setCurrentAlarmMed(null);
  };

  const scheduleNotification = async (medication) => {
    const [hours, minutes] = medication.time.split(':');
    
    const trigger = {
      hour: parseInt(hours),
      minute: parseInt(minutes),
      repeats: true,
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 Medicine Reminder',
        body: `Time to take ${medication.name} - ${medication.dosage}`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { medicationId: medication.id },
      },
      trigger,
    });

    return notificationId;
  };

  const cancelNotification = async (notificationId) => {
    try {
      if (notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
      }
    } catch (error) {
      console.log('Error canceling notification:', error);
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
      createdAt: new Date().toISOString(),
      notificationId: null
    };

    let updatedMeds;
    if (editingId) {
      const oldMed = medications.find(m => m.id === editingId);
      if (oldMed?.notificationId) {
        await cancelNotification(oldMed.notificationId);
      }
      updatedMeds = medications.map(m => m.id === editingId ? newMed : m);
    } else {
      updatedMeds = [...medications, newMed];
    }

    // Schedule notification
    const notificationId = await scheduleNotification(newMed);
    newMed.notificationId = notificationId;
    
    // Update with notification ID
    updatedMeds = updatedMeds.map(m => m.id === newMed.id ? newMed : m);

    await saveData('medications', updatedMeds);
    setMedications(updatedMeds);
    
    Alert.alert(
      '✓ ' + (editingId ? 'Updated' : t.medicationAdded),
      `Alarm set for ${formData.time} daily with vibration.`
    );
    
    resetForm();
  };

  const toggleTaken = async (id, takenStatus = null) => {
    stopAlarm();
    
    const updated = medications.map(m => {
      if (m.id === id) {
        const newTakenStatus = takenStatus !== null ? takenStatus : !m.taken;
        return { 
          ...m, 
          taken: newTakenStatus,
          lastTakenTime: newTakenStatus ? new Date().toISOString() : m.lastTakenTime
        };
      }
      return m;
    });
    
    await saveData('medications', updated);
    setMedications(updated);

    if (takenStatus) {
      // Brief success feedback
      Alert.alert('✓ Done', 'Medication marked as taken for today', [
        { text: 'OK' }
      ]);
    }
  };

  const handleDelete = async (id) => {
    setShowMenuId(null);
    Alert.alert(
      t.delete,
      'Delete this medication and its alarm?',
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete,
          style: 'destructive',
          onPress: async () => {
            const medication = medications.find(m => m.id === id);
            if (medication?.notificationId) {
              await cancelNotification(medication.notificationId);
            }
            
            const updated = medications.filter(m => m.id !== id);
            await saveData('medications', updated);
            setMedications(updated);
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
    stopAlarm();
    
    // Schedule notification for 10 minutes later
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 Medicine Reminder (Snoozed)',
        body: `Time to take ${med.name} - ${med.dosage}`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { medicationId: med.id },
      },
      trigger: {
        seconds: 600, // 10 minutes
      },
    });
    
    Alert.alert('⏰ Snoozed', 'Reminder snoozed for 10 minutes');
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
          <Text style={[styles.backBtn, { color: colors.primary }]}>← {t.home || 'Home'}</Text>
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
                opacity: med.taken ? 0.7 : 1
              }
            ]}>
              {med.taken && (
                <View style={[styles.takenBadge, { backgroundColor: colors.success }]}>
                  <Text style={styles.takenBadgeText}>✓ Taken Today</Text>
                </View>
              )}
              
              <View style={styles.cardHeader}>
                <View style={styles.cardContent}>
                  <Text style={[
                    styles.medName, 
                    { 
                      color: colors.text,
                      textDecorationLine: med.taken ? 'line-through' : 'none'
                    }
                  ]}>
                    {med.name}
                  </Text>
                  <Text style={[styles.medDetail, { color: colors.text }]}>
                    💊 {med.dosage}
                  </Text>
                  <Text style={[styles.medDetail, { color: colors.text }]}>
                    🕐 {med.time} • {t[med.frequency] || med.frequency}
                  </Text>
                  <Text style={[styles.alarmText, { color: colors.primary }]}>
                    🔔 Alarm {med.taken ? 'completed' : 'active'} for {med.time}
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
                    { backgroundColor: med.taken ? colors.success : colors.primary }
                  ]}
                  onPress={() => toggleTaken(med.id)}
                >
                  <Text style={styles.takenText}>
                    {med.taken ? '✓ Taken Today' : '○ Mark as Taken'}
                  </Text>
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
        <Text style={styles.fabText}>+ {t.addMedication}</Text>
      </TouchableOpacity>

      {/* Add/Edit Medication Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingId ? t.edit : t.addMedication}
            </Text>

            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder={t.medicineName || "Medicine Name"}
              placeholderTextColor={colors.border}
              value={formData.name}
              onChangeText={(text) => setFormData({...formData, name: text})}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder={(t.dosage || "Dosage") + ' (e.g., 500mg, 2 tablets)'}
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
                    {t[freq] || freq}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.noteBox, { backgroundColor: colors.card }]}>
              <Text style={[styles.noteText, { color: colors.text }]}>
                ℹ️ Alarm will ring with vibration at scheduled time. Status resets daily at midnight.
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.border }]}
                onPress={resetForm}
              >
                <Text style={styles.modalBtnText}>{t.cancel || 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.success }]}
                onPress={handleSave}
              >
                <Text style={styles.modalBtnText}>{t.save || 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full Screen Alarm Modal */}
      <Modal visible={showAlarmModal} animationType="fade" transparent={false}>
        <View style={[styles.alarmFullScreen, { backgroundColor: colors.danger }]}>
          <View style={styles.alarmContent}>
            <Text style={styles.alarmIcon}>🔔</Text>
            <Text style={styles.alarmTitle}>MEDICINE REMINDER!</Text>
            
            {currentAlarmMed && (
              <>
                <Text style={styles.alarmMedName}>{currentAlarmMed.name}</Text>
                <Text style={styles.alarmDosage}>{currentAlarmMed.dosage}</Text>
                <Text style={styles.alarmTime}>Scheduled: {currentAlarmMed.time}</Text>
              </>
            )}

            <View style={styles.alarmButtons}>
              <TouchableOpacity
                style={[styles.alarmActionBtn, { backgroundColor: colors.success }]}
                onPress={() => currentAlarmMed && toggleTaken(currentAlarmMed.id, true)}
              >
                <Text style={styles.alarmActionText}>✓ TAKEN</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.alarmActionBtn, { backgroundColor: '#FF9500' }]}
                onPress={() => currentAlarmMed && handleSnooze(currentAlarmMed)}
              >
                <Text style={styles.alarmActionText}>⏰ SNOOZE 10 MIN</Text>
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
  takenBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 1,
  },
  takenBadgeText: {
    color: '#FFF',
    fontSize: 12,
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
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  takenText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
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
  
  // Full Screen Alarm Styles
  alarmFullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alarmContent: {
    alignItems: 'center',
    width: '100%',
  },
  alarmIcon: {
    fontSize: 120,
    marginBottom: 30,
  },
  alarmTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 40,
    textAlign: 'center',
  },
  alarmMedName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  alarmDosage: {
    fontSize: 24,
    color: '#FFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  alarmTime: {
    fontSize: 20,
    color: '#FFF',
    marginBottom: 50,
    textAlign: 'center',
  },
  alarmButtons: {
    width: '100%',
    gap: 20,
  },
  alarmActionBtn: {
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
  },
  alarmActionText: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: 'bold',
  },
});