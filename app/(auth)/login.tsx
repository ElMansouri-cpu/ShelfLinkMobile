import React, { useState, useEffect } from 'react'
import {
  Alert,
  AppState,
  TextInput,
  Text,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions
} from 'react-native'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'expo-router'
import Animated, {
  FadeInRight,
  FadeOutLeft,
  FadeInLeft,
  FadeOutRight,
  useSharedValue,
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated'
import { useTranslation } from 'react-i18next';
import '../../i18n'; // make sure i18n is initialized
import { useOTPAuthentication, useOTPVerification } from '../../services/user-service/user.query'
import { setAuthToken } from '../../lib/api'
import * as SecureStore from "expo-secure-store";
import { useAuth } from '../../hooks/useAuth'
import { User } from '../../utils/auth'

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})

const { width } = Dimensions.get('window')

export default function Login() {
  const router = useRouter()
  const { login } = useAuth()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const { t, i18n } = useTranslation();
  const [phoneError, setPhoneError] = useState('');
  const [codeError, setCodeError] = useState('');
  const { mutate: OTPAuthentication } = useOTPAuthentication()
  const { mutate: OTPVerification } = useOTPVerification()


  // Height animation
  const collapsedHeight = 360
  const expandedHeight = 420
  const animatedHeight = useSharedValue(isCodeSent ? expandedHeight : collapsedHeight)

  useEffect(() => {
    animatedHeight.value = withTiming(isCodeSent ? expandedHeight : collapsedHeight, { duration: 400 })
    if (isCodeSent) {
      setResendTimer(60)
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isCodeSent])

  const animatedContainerStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value
  }))

  function validatePhoneNumber(phone: string) {
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, '')
    // Check if it's a valid Tunisian phone number (8 digits starting with 2, 9, or 5)
    return /^[259]\d{7}$/.test(cleanPhone)
  }

  function formatPhoneNumber(phone: string) {
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, '')
    // Format as +216 XX XXX XXX
    if (cleanPhone.length >= 8) {
      return `+216 ${cleanPhone.substring(0, 2)} ${cleanPhone.substring(2, 5)} ${cleanPhone.substring(5, 8)}`
    }
    return phone
  }

  async function sendVerificationCode() {
    setPhoneError('');
    let valid = true;

    if (!phoneNumber) {
      setPhoneError(t('phoneNumberRequired'));
      valid = false;
    } else if (!validatePhoneNumber(phoneNumber)) {
      setPhoneError(t('invalidPhoneNumber'));
      valid = false;
    }
    if (!valid) return;

    setLoading(true)
    
    try {
             // Format phone number for Supabase (add +216 prefix if not present)
               let formattedPhone = phoneNumber
        if (!phoneNumber.startsWith('+216')) {
          const cleanPhone = phoneNumber.replace(/\D/g, '')
          formattedPhone = `216${cleanPhone}`
        }
      OTPAuthentication(formattedPhone, {
        onSuccess: (data) => {
          setIsCodeSent(true)
          setPhoneError('')
          Alert.alert(t('Success'), t('codeSent', { phone: formatPhoneNumber(phoneNumber) }))
          setLoading(false)
        },
        onError: (error) => {
          console.error("OTP send failed:", error)
          Alert.alert(t('Sign in failed'), error.message || 'Failed to send OTP')
          setLoading(false)
        }
      })
    } catch (error) {
      Alert.alert(t('Sign in failed'), 'An unexpected error occurred')
      setLoading(false)
    }
  }

  async function verifyCode() {
    setCodeError('');
    let valid = true;

    if (!verificationCode) {
      setCodeError(t('codeRequired'));
      valid = false;
    } else if (verificationCode.length !== 6 || !/^\d{6}$/.test(verificationCode)) {
      setCodeError(t('invalidCode'));
      valid = false;
    }
    if (!valid) return;

    setLoading(true)
    
    try {
             // Format phone number for Supabase
       let formattedPhone = phoneNumber
       if (!phoneNumber.startsWith('+216')) {
         const cleanPhone = phoneNumber.replace(/\D/g, '')
         formattedPhone = `216${cleanPhone}`
       }

      OTPVerification({
        phone: formattedPhone,
        code: verificationCode,
      }, {
                 onSuccess: async(data) => {
           setLoading(false)
           // Handle successful verification here
           if (data.accessToken && data.user) {
             try {
               // Use the new login method from AuthContext
               await login(data.user as User, data.accessToken, data.refreshToken);
               
               // Redirect to home
               router.replace('/(app)/home')
             } catch (error) {
               console.error("Login failed:", error);
               Alert.alert(t('Sign in failed'), 'Failed to complete login');
               setLoading(false);
             }
           } else {
             Alert.alert(t('Sign in failed'), 'Invalid response from server');
             setLoading(false);
           }
         },
        onError: (error) => {
          console.error("OTP verification failed:", error)
          Alert.alert(t('Sign in failed'), 'Verification failed')
          setLoading(false)
        }
      })
    } catch (error) {
      Alert.alert(t('Sign in failed'), 'An unexpected error occurred')
    }
    
    setLoading(false)
  }

  function resendCode() {
    if (resendTimer > 0) return
    sendVerificationCode()
  }

  function goBackToPhone() {
    setIsCodeSent(false)
    setVerificationCode('')
    setCodeError('')
    setResendTimer(0)
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="default" />
      <ScrollView className="flex-1">
        {/* Header */}
        <View className={`bg-[#00162e] ${isCodeSent ? 'pb-8' : 'pb-16'} relative`}>
          <View className="items-center">
            <Image
              source={require('../../assets/logoShelf.png')}
              style={{ width: width, height: isCodeSent ? 200 : 240 }}
              resizeMode="contain"
            />
          </View>
          <View className={`absolute bottom-0 left-0 right-0 h-10 bg-white rounded-t-[40px]`} />
        </View>

        {/* Animated content container */}
        <Animated.View className={`px-6 pt-2 pb-8 ${animatedContainerStyle}`}>
          <Text className="text-3xl font-bold text-center mb-2">
            { t('welcome') }
          </Text>
          <Text className="text-center text-gray-600 mb-6">
            {isCodeSent ? t('verificationCode') : t('signInWithPhone')}
          </Text>

          <Animated.View
            key={isCodeSent ? 'verification' : 'phone'}
            entering={isCodeSent ? FadeInRight.duration(400) : FadeInLeft.duration(400)}
            exiting={isCodeSent ? FadeOutLeft.duration(400) : FadeOutRight.duration(400)}
          >
            {!isCodeSent ? (
              <>
                <View className="mb-6">
                  <Text className="text-sm mb-1 text-gray-700">{t('phoneNumber')}</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                    placeholder={t('phoneNumberPlaceholder')}
                    autoCapitalize="none"
                    autoComplete="tel"
                    keyboardType="phone-pad"
                    textContentType="telephoneNumber"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    maxLength={15}
                  />
                  {phoneError ? <Text style={{ color: 'red', fontSize: 12, marginTop: 4 }}>{phoneError}</Text> : null}
                </View>

                <Text className="text-center text-gray-500 mb-6 text-sm">
                  {t('weWillSendCode')}
                </Text>

                <TouchableOpacity
                  disabled={loading}
                  onPress={sendVerificationCode}
                  className={`bg-[#00162e] rounded-full py-3.5 items-center mb-4 ${loading ? 'opacity-50' : ''}`}
                >
                  <Text className="text-white font-medium text-base">{t('sendCode')}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View className="mb-4">
                  <Text className="text-sm mb-1 text-gray-700">{t('verificationCode')}</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 text-center text-lg"
                    placeholder={t('codePlaceholder')}
                    autoCapitalize="none"
                    autoComplete="one-time-code"
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    maxLength={6}
                  />
                  {codeError ? <Text style={{ color: 'red', fontSize: 12, marginTop: 4 }}>{codeError}</Text> : null}
                </View>

                <Text className="text-center text-gray-500 mb-6 text-sm">
                  {t('enterCode')}
                </Text>

                <TouchableOpacity
                  disabled={loading}
                  onPress={verifyCode}
                  className={`bg-[#00162e] rounded-full py-3.5 items-center mb-4 ${loading ? 'opacity-50' : ''}`}
                >
                  <Text className="text-white font-medium text-base">{t('verifyCode')}</Text>
                </TouchableOpacity>

                <View className="flex-row items-center justify-between mb-6">
                  <TouchableOpacity
                    disabled={loading}
                    onPress={goBackToPhone}
                    className="flex-row items-center"
                  >
                    <Text className="text-[#00162e] font-medium text-base">← {t('Back')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={loading || resendTimer > 0}
                    onPress={resendCode}
                    className={`flex-row items-center ${resendTimer > 0 ? 'opacity-50' : ''}`}
                  >
                    <Text className={`font-medium text-base ${resendTimer > 0 ? 'text-gray-400' : 'text-[#00162e]'}`}>
                      {resendTimer > 0 ? `${t('resendCode')} (${resendTimer}s)` : t('resendCode')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}
