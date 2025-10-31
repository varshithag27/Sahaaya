import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { getData, saveData } from '../src/services/StorageService';
import { TRANSLATIONS, COLORS } from '../src/utils/constants';

export default function ProfileScreen() {
  const [editing, setEditing] = useState(false);
  const [language, setLanguage] = useState('en');
  const [darkMode, setDarkMode] = useState(false);
  
  const [profileData, setProfileData] = useState({
    fullName: '',
    age: '',
    bloodGroup: '',
    address: '',
    emergencyNote: '',
    medicalConditions: '',
    allergies: ''
  });

  const router = useRouter();
  const t = TRANSLATIONS[language];
  const colors = darkMode ? COLORS.dark : COLORS.light;

  useEffect(() => {
    loadSettings();
    loadProfile();
  }, []);

  const loadSettings = async () => {
    const lang = await getData('language');
    const dark = await getData('darkMode');
    if (lang) setLanguage(lang);
    if (dark) setDarkMode(dark);
  };

  const loadProfile = async () => {
    const saved = await getData('userProfile');
    if (saved) {
      setProfileData(saved);
    }
  };

  const handleSave = async () => {
    if (!profileData.fullName) {
      Alert.alert(t.required, 'Full name is required');
      return;
    }

    await saveData('userProfile', profileData);
    Alert.alert(t.profileUpdated);
    setEditing(false);
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← {t.home}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>👤 {t.profile}</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.avatarContainer, { backgroundColor: colors.card }]}>
          <Text style={styles.avatar}>👤</Text>
          <Text style={[styles.nameText, { color: colors.text }]}>
            {profileData.fullName || 'Add Your Name'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t.personalInfo}
          </Text>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>{t.fullName} *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="Enter full name"
              placeholderTextColor={colors.border}
              value={profileData.fullName}
              onChangeText={(text) => setProfileData({...profileData, fullName: text})}
              editable={editing}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1, marginRight: 10 }]}>
              <Text style={[styles.label, { color: colors.text }]}>{t.age}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                placeholder="Age"
                placeholderTextColor={colors.border}
                keyboardType="number-pad"
                maxLength={3}
                value={profileData.age}
                onChangeText={(text) => setProfileData({...profileData, age: text})}
                editable={editing}
              />
            </View>

            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.text }]}>{t.bloodGroup}</Text>
              {editing ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {bloodGroups.map((bg) => (
                    <TouchableOpacity
                      key={bg}
                      style={[
                        styles.bloodBtn,
                        { 
                          backgroundColor: profileData.bloodGroup === bg ? colors.danger : colors.card,
                          borderColor: colors.border
                        }
                      ]}
                      onPress={() => setProfileData({...profileData, bloodGroup: bg})}
                    >
                      <Text style={[
                        styles.bloodText,
                        { color: profileData.bloodGroup === bg ? '#FFF' : colors.text }
                      ]}>
                        {bg}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={profileData.bloodGroup}
                  editable={false}
                />
              )}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>{t.address}</Text>
            <TextInput
              style={[styles.inputMulti, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="Enter address"
              placeholderTextColor={colors.border}
              multiline
              numberOfLines={3}
              value={profileData.address}
              onChangeText={(text) => setProfileData({...profileData, address: text})}
              editable={editing}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>{t.medicalConditions}</Text>
            <TextInput
              style={[styles.inputMulti, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="e.g., Diabetes, Hypertension"
              placeholderTextColor={colors.border}
              multiline
              numberOfLines={2}
              value={profileData.medicalConditions}
              onChangeText={(text) => setProfileData({...profileData, medicalConditions: text})}
              editable={editing}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>{t.allergies}</Text>
            <TextInput
              style={[styles.inputMulti, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="e.g., Penicillin, Peanuts"
              placeholderTextColor={colors.border}
              multiline
              numberOfLines={2}
              value={profileData.allergies}
              onChangeText={(text) => setProfileData({...profileData, allergies: text})}
              editable={editing}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>{t.emergencyNote}</Text>
            <TextInput
              style={[styles.inputMulti, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="Important notes for emergencies"
              placeholderTextColor={colors.border}
              multiline
              numberOfLines={3}
              value={profileData.emergencyNote}
              onChangeText={(text) => setProfileData({...profileData, emergencyNote: text})}
              editable={editing}
            />
          </View>
        </View>

        {editing ? (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.border }]}
              onPress={() => {
                setEditing(false);
                loadProfile();
              }}
            >
              <Text style={styles.buttonText}>{t.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.success }]}
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>{t.saveProfile}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.primary }]}
            onPress={() => setEditing(true)}
          >
            <Text style={styles.buttonText}>✏️ {t.editProfile}</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, flexDirection: 'row', alignItems: 'center' },
  backBtn: { fontSize: 20, fontWeight: 'bold', marginRight: 15 },
  title: { fontSize: 32, fontWeight: 'bold' },
  content: { flex: 1, padding: 20 },
  avatarContainer: { alignItems: 'center', padding: 30, borderRadius: 20, marginBottom: 20 },
  avatar: { fontSize: 80, marginBottom: 10 },
  nameText: { fontSize: 26, fontWeight: 'bold' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 15 },
  field: { marginBottom: 20 },
  row: { flexDirection: 'row', marginBottom: 20 },
  label: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  input: { padding: 16, borderRadius: 12, fontSize: 18, borderWidth: 1, borderColor: '#ddd' },
  inputMulti: { padding: 16, borderRadius: 12, fontSize: 18, borderWidth: 1, borderColor: '#ddd', minHeight: 80, textAlignVertical: 'top' },
  bloodBtn: { padding: 12, borderRadius: 8, marginHorizontal: 5, borderWidth: 1, minWidth: 50, alignItems: 'center' },
  bloodText: { fontSize: 16, fontWeight: 'bold' },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  button: { flex: 1, padding: 18, borderRadius: 15, alignItems: 'center' },
  editButton: { padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
});