import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);

  const colors = darkMode ? {
    background: '#121212',
    text: '#FFFFFF',
    card: '#1E1E1E',
    primary: '#5FA3E8',
    danger: '#F05A4A'
  } : {
    background: '#FFFFFF',
    text: '#000000',
    card: '#F5F5F5',
    primary: '#4A90E2',
    danger: '#E74C3C'
  };

  const handleSOS = () => {
    Alert.alert(
      '🚨 SOS ACTIVATED!',
      'Emergency alert will be sent to your contacts',
      [{ text: 'OK' }]
    );
  };

  const handleMedication = () => {
    Alert.alert(
      '💊 Medications',
      'Medication reminders will appear here',
      [{ text: 'OK' }]
    );
  };

  const handleVoice = () => {
    Alert.alert(
      '🎤 Voice Assistant',
      'Voice commands activated',
      [{ text: 'OK' }]
    );
  };

  const handleSettings = () => {
    Alert.alert(
      '⚙️ Settings',
      'Settings options will appear here',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerText, { color: colors.text }]}>
            🏥 Sahaaya
          </Text>
          <Text style={[styles.subHeaderText, { color: colors.text }]}>
            Healthcare Assistant
          </Text>
        </View>

        {/* Dark Mode Toggle */}
        <TouchableOpacity
          style={[styles.toggleButton, { backgroundColor: colors.card }]}
          onPress={() => setDarkMode(!darkMode)}
        >
          <Text style={[styles.toggleText, { color: colors.text }]}>
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </Text>
        </TouchableOpacity>

        {/* SOS Button - BIG RED BUTTON */}
        <TouchableOpacity
          style={[styles.sosButton, { backgroundColor: colors.danger }]}
          onPress={handleSOS}
        >
          <Text style={styles.sosText}>🚨 SOS EMERGENCY</Text>
          <Text style={styles.sosSubText}>Tap for Immediate Help</Text>
        </TouchableOpacity>

        {/* Main Features */}
        <View style={styles.featuresContainer}>
          {/* Medications Button */}
          <TouchableOpacity
            style={[styles.featureButton, { backgroundColor: colors.primary }]}
            onPress={handleMedication}
          >
            <Text style={styles.featureIcon}>💊</Text>
            <Text style={styles.featureText}>Medications</Text>
          </TouchableOpacity>

          {/* Voice Assistant Button */}
          <TouchableOpacity
            style={[styles.featureButton, { backgroundColor: colors.primary }]}
            onPress={handleVoice}
          >
            <Text style={styles.featureIcon}>🎤</Text>
            <Text style={styles.featureText}>Voice Help</Text>
          </TouchableOpacity>

          {/* Settings Button */}
          <TouchableOpacity
            style={[styles.featureButton, { backgroundColor: colors.primary }]}
            onPress={handleSettings}
          >
            <Text style={styles.featureIcon}>⚙️</Text>
            <Text style={styles.featureText}>Settings</Text>
          </TouchableOpacity>

          {/* Emergency Contacts Button */}
          <TouchableOpacity
            style={[styles.featureButton, { backgroundColor: colors.primary }]}
            onPress={() => Alert.alert('📞 Emergency Contacts', 'Contacts list will appear here')}
          >
            <Text style={styles.featureIcon}>📞</Text>
            <Text style={styles.featureText}>Contacts</Text>
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.infoText, { color: colors.text }]}>
            ✅ Sahaaya is Running!
          </Text>
          <Text style={[styles.infoSubText, { color: colors.text }]}>
            All features will be added step by step
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginVertical: 20,
  },
  headerText: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subHeaderText: {
    fontSize: 24,
    opacity: 0.7,
  },
  toggleButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  toggleText: {
    fontSize: 22,
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
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sosSubText: {
    color: '#FFFFFF',
    fontSize: 20,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  featureButton: {
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
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoCard: {
    padding: 25,
    borderRadius: 15,
    marginVertical: 20,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoSubText: {
    fontSize: 18,
    textAlign: 'center',
    opacity: 0.7,
  },
});