import React, { useState } from 'react';
import { View, Image, Text, TextInput, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import '../../../i18n'; // make sure i18n is initialized
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'expo-router';
export default function OnboardingStepper() {
  const { session } = useAuth();

  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [fullNameError, setFullNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [loading, setLoading] = useState(false)
  const router = useRouter();
  const { t } = useTranslation();
  async function updateProfile({
    username,
    phone,
  }: {
    username: string,
    phone: string
  }) {
    try {
      setLoading(true)
      if (!session?.user) throw new Error('No user on the session!')

      const updates = {
        id: session.user.id,
        username,
        
      }
    const {data,error:errorInsert}  = await supabase.from('profiles').insert([
        { id: session.user.id, phone_number: phone }
      ]);
      if(errorInsert) throw errorInsert
      const { error } = await supabase.from('users').upsert(updates)
      if (error) throw error
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const validateStep = () => {
    if (step === 0) {
      if (!fullName.trim()) {
        setFullNameError(t('Full name is required'));
        return false;
      }
      setFullNameError('');
    }
    if (step === 1) {
      if (!phone.trim()) {
        setPhoneError(t('Phone number is required'));
        return false;
      }
      // Simple phone validation (customize as needed)
      if (!/^[0-9]{8,15}$/.test(phone)) {
        setPhoneError(t('Enter a valid phone number'));
        return false;
      }
      setPhoneError('');
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (step === 1) {
        updateProfile({username: fullName, phone: phone })
        // Submit data here (e.g., update user profile in your backend)
        router.replace('/(app)/onboarding/onboarding-success');
      } else {
        setStep(step + 1);
      }
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#00162e', justifyContent: 'center', padding: 24 }}>

      <Image source={require('../../../assets/man.png')} style={{ width: 200, height: 200, marginBottom: 24, alignSelf: 'center' }} />
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center', color: 'white' }}>
        {t('Complete your profile')}
      </Text>
      {step === 0 && (
        <View>
          <Text style={{ fontSize: 16, marginBottom: 8, color: 'white' }}>{t('Full Name')}</Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: fullNameError ? 'red' : '#ccc',
              borderRadius: 8,
              padding: 12,
              marginBottom: 4,
              backgroundColor: 'white',
            }}
            placeholder={t('Enter your full name')}
            value={fullName}
            onChangeText={setFullName}
          />
          {fullNameError ? <Text style={{ color: 'red', marginBottom: 8 }}>{fullNameError}</Text> : null}
        </View>
      )}
      {step === 1 && (
        <View>
          <Text style={{ fontSize: 16, marginBottom: 8, color: 'white' }}>{t('Phone Number')}</Text>
          <View style={{ position: 'relative', marginBottom: 4, height: 48 }}>
            {/* Flag and prefix visually inside the input */}
            <View style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              flexDirection: 'row',
              alignItems: 'center',
              height: 48, // match the input height
              zIndex: 1,
              borderRightWidth: 1,
              borderRightColor: '#ccc',
              paddingRight: 10,
              backgroundColor: '#465461',
              borderTopLeftRadius: 8,
              borderBottomLeftRadius: 8,
            }}>
              <Text style={{ fontSize: 20, marginRight: 4, marginLeft: 4 }}>🇹🇳</Text>
              <Text style={{ fontSize: 16, color: '#fff' }}>+216</Text>
            </View>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: phoneError ? 'red' : '#ccc',
                borderRadius: 8,
                padding: 12,
                paddingLeft: 70, // enough space for flag and prefix
                backgroundColor: 'white',
                color: '#333',
                fontSize: 16,
                height: 48, // match the container height
                marginLeft: 12,
              }}
              placeholder={t('Enter your phone number')}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={8}
            />
          </View>
          {phoneError ? <Text style={{ color: 'red', marginBottom: 8 }}>{phoneError}</Text> : null}
        </View>
      )}
      <View style={{ flexDirection: 'row', marginTop: 24, justifyContent: 'space-between' }}>
        {step > 0 && (
          <TouchableOpacity
            style={{
              backgroundColor: '#eee',
              padding: 14,
              borderRadius: 8,
              minWidth: 100,
              alignItems: 'center',
            }}
            onPress={handleBack}
          >
            <Text style={{ color: '#333' }}>{t('Back')}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          disabled={loading}
          style={{
            backgroundColor: '#ddba92',
            padding: 14,
            borderRadius: 8,
            minWidth: 100,
            alignItems: 'center',
            marginLeft: step > 0 ? 12 : 0,
            flex: 1,
          }}
          onPress={handleNext}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>{step === 1 ? t('Finish') : t('Next')}</Text>
        </TouchableOpacity>
      </View>
      {/* Step indicator */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
        {[0, 1].map((s) => (
          <View
            key={s}
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: step === s ? '#ddba92' : '#e5e7eb',
              marginHorizontal: 6,
            }}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}