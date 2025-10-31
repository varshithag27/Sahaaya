import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, 
  ScrollView, Alert, Linking 
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { getData, saveData, removeData } from '../src/services/StorageService';
import { TRANSLATIONS, COLORS } from '../src/utils/constants';

export default function HomeScreen() {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');
  const [userName, setUserName] = useState('');
  const router = useRouter();

  const t = TRANSLATIONS[language];
  const colors = darkMode ? COLORS.dark : COLORS.light;

  useEffect(() => {
    loadSettings();
    loadUserProfile();
  }, []);

  const loadSettings = async () => {
    const savedLang = await getData('language');
    const savedDarkMode = await getData('darkMode');
    if (savedLang) setLanguage(savedLang);
    if (savedDarkMode) setDarkMode(savedDarkMode);
  };

  const loadUserProfile = async () => {
    const profile = await getData('userProfile');
    if (profile && profile.fullName) {
      setUserName(profile.fullName);
    }
  };

  const toggleDarkMode = async () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    await saveData('darkMode', newMode);
  };

  const toggleLanguage = async () => {
    const newLang = language === 'en' ? 'kn' : 'en';
    setLanguage(newLang);
    await saveData('language', newLang);
  };

  const handleSOS = async () => {
    Alert.alert(
      '🚨 ' + t.sosEmergency,
      'Send emergency alert to all contacts?',
      [
        { text: t.cancel, style: 'cancel' },
        { 
          text: t.confirm, 
          style: 'destructive',
          onPress: async () => {
            await sendSOSAlert();
          }
        }
      ]
    );
  };

  const sendSOSAlert = async () => {
    try {
      // Get location
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for SOS');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      const locationURL = `https://maps.google.com/?q=${latitude},${longitude}`;

      // Get emergency contacts
      const contacts = await getData('emergencyContacts') || [];
      
      if (contacts.length === 0) {
        Alert.alert('No Contacts', 'Please add emergency contacts first!');
        router.push('/contacts');
        return;
      }

      // Send SMS to all contacts
      const phoneNumbers = contacts.map(c => c.phone);
      const message = `🚨 EMERGENCY ALERT from ${userName || 'User'}!\n\nI need immediate help!\n\nMy location: ${locationURL}`;

      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync(phoneNumbers, message);
        Alert.alert('✅ ' + t.sosActivated, 'Emergency contacts have been notified!');
      } else {
        Alert.alert('SMS Not Available', 'Please call emergency contacts manually');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send SOS alert: ' + error.message);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      t.logout,
      'Are you sure you want to logout?',
      [
        { text: t.cancel, style: 'cancel' },
        { 
          text: t.logout,
          style: 'destructive',
          onPress: async () => {
            await removeData('isLoggedIn');
            router.replace('/');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerText, { color: colors.text }]}>
            🏥 {t.appName}
          </Text>
          <Text style={[styles.welcomeText, { color: colors.text }]}>
            {t.welcomeUser}{userName ? `, ${userName}` : ''}
          </Text>
        </View>

        {/* Toggle Buttons Row */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, { backgroundColor: colors.card }]}
            onPress={toggleDarkMode}
          >
            <Text style={[styles.toggleText, { color: colors.text }]}>
              {darkMode ? '☀️' : '🌙'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, { backgroundColor: colors.card }]}
            onPress={toggleLanguage}
          >
            <Text style={[styles.toggleText, { color: colors.text }]}>
              {language === 'en' ? '🇮🇳 ಕನ್ನಡ' : '🇬🇧 EN'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* SOS Emergency Button */}
        <TouchableOpacity
          style={[styles.sosButton, { backgroundColor: colors.danger }]}
          onPress={handleSOS}
        >
          <Text style={styles.sosText}>🚨 {t.sosEmergency}</Text>
          <Text style={styles.sosSubText}>{t.tapForHelp}</Text>
        </TouchableOpacity>

        {/* Main Feature Buttons */}
        <View style={styles.featuresGrid}>
          <TouchableOpacity
            style={[styles.featureCard, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/medications')}
          >
            <Text style={styles.featureIcon}>💊</Text>
            <Text style={styles.featureText}>{t.medications}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.featureCard, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/appointments')}
          >
            <Text style={styles.featureIcon}>📅</Text>
            <Text style={styles.featureText}>{t.appointments}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.featureCard, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/contacts')}
          >
            <Text style={styles.featureIcon}>📞</Text>
            <Text style={styles.featureText}>{t.contacts}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.featureCard, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/profile')}
          >
            <Text style={styles.featureIcon}>👤</Text>
            <Text style={styles.featureText}>{t.profile}</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.card }]}
          onPress={handleLogout}
        >
          <Text style={[styles.logoutText, { color: colors.danger }]}>
            🚪 {t.logout}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginVertical: 20,
  },
  headerText: {
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  welcomeText: {
    fontSize: 22,
    opacity: 0.7,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  toggleBtn: {
    padding: 15,
    borderRadius: 15,
    minWidth: 120,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 20,
    fontWeight: '600',
  },
  sosButton: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    marginVertical: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  sosText: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sosSubText: {
    color: '#FFF',
    fontSize: 20,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  featureCard: {
    width: '48%',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    marginVertical: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  featureIcon: {
    fontSize: 50,
    marginBottom: 10,
  },
  featureText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  logoutButton: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginVertical: 20,
  },
  logoutText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
});