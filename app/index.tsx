import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, SafeAreaView, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { saveData, getData } from '../src/services/StorageService';
import { TRANSLATIONS, COLORS } from '../src/utils/constants';

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const router = useRouter();

  const t = TRANSLATIONS[language];
  const colors = COLORS.light;

  useEffect(() => {
    checkLoginStatus();
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    const savedLang = await getData('language');
    if (savedLang) setLanguage(savedLang);
  };

  const checkLoginStatus = async () => {
    const isLoggedIn = await getData('isLoggedIn');
    if (isLoggedIn) {
      router.replace('/home');
    }
  };

  const handleSendOTP = () => {
    if (phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter valid 10-digit phone number');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
      Alert.alert('OTP Sent', `OTP sent to ${phoneNumber}\nUse: 123456`);
    }, 1500);
  };

  const handleVerifyOTP = async () => {
    if (otp !== '123456') {
      Alert.alert('Error', 'Invalid OTP. Try 123456');
      return;
    }
    setLoading(true);
    await saveData('isLoggedIn', true);
    await saveData('phoneNumber', phoneNumber);
    setTimeout(() => {
      setLoading(false);
      router.replace('/home');
    }, 1000);
  };

  const toggleLanguage = async () => {
    const newLang = language === 'en' ? 'kn' : 'en';
    setLanguage(newLang);
    await saveData('language', newLang);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.langButton} onPress={toggleLanguage}>
          <Text style={styles.langText}>
            {language === 'en' ? '🇮🇳 ಕನ್ನಡ' : '🇬🇧 English'}
          </Text>
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🏥</Text>
          <Text style={[styles.appName, { color: colors.text }]}>{t.appName}</Text>
          <Text style={[styles.tagline, { color: colors.text }]}>{t.welcome}</Text>
        </View>

        {step === 'phone' ? (
          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.text }]}>{t.phoneNumber}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder={t.enterPhone}
              keyboardType="phone-pad"
              maxLength={10}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleSendOTP}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : 
                <Text style={styles.buttonText}>{t.sendOTP}</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.text }]}>{t.enterOTP}</Text>
            <Text style={[styles.hint, { color: colors.text }]}>Sent to +91 {phoneNumber}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="Enter 6-digit OTP"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
            />
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.success }]}
              onPress={handleVerifyOTP}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : 
                <Text style={styles.buttonText}>{t.verifyOTP}</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep('phone')}>
              <Text style={[styles.backText, { color: colors.primary }]}>
                ← Change Phone Number
              </Text>
            </TouchableOpacity>
          </View>
        )}
        <Text style={[styles.demoNote, { color: colors.text }]}>
          📝 Demo: Use OTP 123456
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 20, justifyContent: 'center' },
  langButton: { position: 'absolute', top: 20, right: 20, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 20 },
  langText: { fontSize: 16, fontWeight: '600' },
  logoContainer: { alignItems: 'center', marginBottom: 50 },
  logo: { fontSize: 80, marginBottom: 10 },
  appName: { fontSize: 42, fontWeight: 'bold', marginBottom: 5 },
  tagline: { fontSize: 20, opacity: 0.7 },
  form: { width: '100%' },
  label: { fontSize: 22, fontWeight: '600', marginBottom: 10 },
  hint: { fontSize: 16, marginBottom: 15, opacity: 0.7 },
  input: { fontSize: 24, padding: 20, borderRadius: 15, marginBottom: 20, borderWidth: 2, borderColor: '#ddd' },
  button: { padding: 20, borderRadius: 15, alignItems: 'center', marginBottom: 15 },
  buttonText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  backText: { fontSize: 18, textAlign: 'center', marginTop: 10 },
  demoNote: { fontSize: 16, textAlign: 'center', marginTop: 30, opacity: 0.6 },
});