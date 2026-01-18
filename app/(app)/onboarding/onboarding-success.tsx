import React, { useEffect } from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import '../../../i18n';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';

export default function OnboardingSuccess() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  
  useEffect(() => {
    // Redirect to home after 2 seconds
    const timer = setTimeout(() => {
      // Double check that user is onboarded before redirecting
      if (user?.isOnboarded) {
        router.replace('/(app)/home');
      } else {
        // If somehow user is not onboarded, redirect to onboarding
        router.replace('/(app)/onboarding/onboarding-stepper');
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [user]);

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