import React, { useEffect } from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import '../../../i18n';
import { useTranslation } from 'react-i18next';

export default function OnboardingSuccess() {
  const router = useRouter();
  const { t } = useTranslation();
  useEffect(() => {
    // Redirect to home after 2 seconds
    const timer = setTimeout(() => {
      router.replace('/(app)/home');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#00162e', justifyContent: 'center', alignItems: 'center' }}>
      <View style={{
        width: 120, height: 120, borderRadius: 60, backgroundColor: '#059669',
        justifyContent: 'center', alignItems: 'center', marginBottom: 24
      }}>
        <Text style={{ fontSize: 64, color: 'white' }}>✓</Text>
      </View>
      <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>{t('Your profile is completed successfully.')}</Text>
      <Text style={{ color: 'white', fontSize: 16, textAlign: 'center' }}>{t('You will be redirected to the home page.')}</Text>
    </SafeAreaView>
  );
} 