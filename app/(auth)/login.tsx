import React, { useState, useEffect, useRef } from 'react'
import {
  AppState,
  TextInput,
  Text,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Vibration
} from 'react-native'
import CustomAlert from '../../components/CustomAlert'
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
import { useTranslation } from 'react-i18next'
import '../../i18n'
import { useOTPAuthentication, useOTPVerification } from '../../services/user-service/user.query'
import { setAuthToken } from '../../lib/api'
import * as SecureStore from "expo-secure-store"
import { useAuth } from '../../hooks/useAuth'

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})

const { width } = Dimensions.get('window')

// Custom component for input container
const InputContainer = ({ children, error }: { children: React.ReactNode; error?: string }) => (
  <View className={`border ${error ? 'border-red-400' : 'border-gray-300'} 
    rounded-xl px-4 py-3.5 bg-white shadow-sm
    ${error ? 'shadow-red-100' : 'shadow-gray-100'}`}>
    {children}
  </View>
)

export default function Login() {
  const router = useRouter()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const { t } = useTranslation()
  const [phoneError, setPhoneError] = useState('')
  const [codeError, setCodeError] = useState('')
  const [alert, setAlert] = useState<{ visible: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  })

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlert({ visible: true, title, message, type })
  }

  const hideAlert = () => {
    setAlert(prev => ({ ...prev, visible: false }))
  }
  const { mutate: OTPAuthentication } = useOTPAuthentication()
  const { mutate: OTPVerification } = useOTPVerification()
  const { setUser } = useAuth()

  // For OTP input refs
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)]

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

  // Phone input handler with formatting xx xxx xxx
  function handlePhoneChange(text: string) {
    let clean = text.replace(/\D/g, '').slice(0, 8)
    let formatted = clean
    if (clean.length > 2) {
      formatted = `${clean.slice(0,2)} ${clean.slice(2,5)}${clean.length > 5 ? ' ' + clean.slice(5,8) : ''}`
    }
    setPhoneNumber(formatted)
  }

  // OTP input handler
  function handleOtpChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return
    
    setCodeError('') // Clear any previous error
    const newOtp = [...otpDigits]
    newOtp[index] = value
    setOtpDigits(newOtp)
    
    const newCode = newOtp.join('')
    setVerificationCode(newCode)

    if (value) {
      // Vibrate for feedback
      Vibration.vibrate(40)
      
      // Auto-focus next or submit if last digit
      if (index < 5) {
        otpRefs[index + 1].current?.focus()
      } else if (index === 5 && newCode.length === 6) {
        // Auto-submit if all digits are filled
        verifyCode(newCode)
      }
    } else if (index > 0) {
      // Auto-backspace
      otpRefs[index - 1].current?.focus()
    }
  }

  function validatePhoneNumber(phone: string) {
    const cleanPhone = phone.replace(/\D/g, '')
    return /^[259]\d{7}$/.test(cleanPhone)
  }

  function formatPhoneNumber(phone: string) {
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length >= 8) {
      return `+216 ${cleanPhone.substring(0, 2)} ${cleanPhone.substring(2, 5)} ${cleanPhone.substring(5, 8)}`
    }
    return phone
  }

  async function sendVerificationCode() {
    setPhoneError('')
    let valid = true

    if (!phoneNumber) {
      setPhoneError(t('phoneNumberRequired'))
      valid = false
    } else if (!validatePhoneNumber(phoneNumber.replace(/\D/g, ''))) {
      setPhoneError(t('invalidPhoneNumber'))
      valid = false
    }
    if (!valid) return

    setLoading(true)
    
    try {
      let formattedPhone = phoneNumber.replace(/\D/g, '')
      if (!formattedPhone.startsWith('216')) {
        formattedPhone = `216${formattedPhone}`
      }
      OTPAuthentication(formattedPhone, {
        onSuccess: (data) => {
          setIsCodeSent(true)
          setPhoneError('')
          showAlert(t('Success'), t('codeSent', { phone: formatPhoneNumber(phoneNumber) }), 'success')
          setTimeout(hideAlert, 2000)
          setLoading(false)
        },
        onError: (error) => {
          console.error("OTP send failed:", error)
          showAlert(t('Sign in failed'), error.message || t('otpSendFailed'), 'error')
          setLoading(false)
        }
      })
    } catch (error) {
      showAlert(t('Sign in failed'), t('unexpectedError'), 'error')
      setLoading(false)
    }
  }

  async function verifyCode(code?: string) {
    const codeToVerify = code || verificationCode
    setCodeError('')
    let valid = true

    if (!codeToVerify) {
      setCodeError(t('codeRequired'))
      valid = false
    } else if (codeToVerify.length !== 6 || !/^\d{6}$/.test(codeToVerify)) {
      setCodeError(t('invalidCode'))
      valid = false
    }
    if (!valid) return

    setLoading(true)
    
    try {
      let formattedPhone = phoneNumber.replace(/\D/g, '')
      if (!formattedPhone.startsWith('216')) {
        formattedPhone = `216${formattedPhone}`
      }
      OTPVerification({
        phone: formattedPhone,
        code: codeToVerify,
      }, {
        onSuccess: async(data) => {
          setLoading(false)
          if (data.accessToken) {
            await SecureStore.setItemAsync("accessToken", data?.accessToken)
            await SecureStore.setItemAsync("refreshToken", data?.refreshToken)
            await SecureStore.setItemAsync("user", JSON.stringify(data?.user))
            setAuthToken(data?.accessToken)
            setUser(data?.user)
            showAlert(t('Success'), t('loginSuccess'), 'success')
            setTimeout(() => {
              hideAlert()
              router.replace('/(app)/orders')
            }, 1500)
          }
        },
        onError: (error) => {
          console.error("OTP verification failed:", error)
          showAlert(t('Sign in failed'), t('verificationFailed'), 'error')
          setCodeError(t('invalidCode'))
          setLoading(false)
          // Clear OTP inputs
          setOtpDigits(['', '', '', '', '', ''])
          otpRefs[0].current?.focus()
        }
      })
    } catch (error) {
      showAlert(t('Sign in failed'), t('unexpectedError'), 'error')
      setLoading(false)
    }
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
    <SafeAreaView className="flex-1 bg-[#fafafa]">
      <StatusBar barStyle="dark-content" />
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={hideAlert}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1">
          {/* Header */}
          <View className={`bg-[#00162e] ${isCodeSent ? 'pb-12' : 'pb-20'} relative`}>
            <View className="items-center pt-4">
              <Image
                source={require('../../assets/logoShelf.png')}
                style={{ width: width * 0.8, height: isCodeSent ? 180 : 220 }}
                resizeMode="contain"
              />
            </View>
            <View className={`absolute bottom-0 left-0 right-0 h-16 bg-[#fafafa] rounded-t-[40px] shadow-sm`} />
          </View>

          {/* Animated content container */}
          <Animated.View className={`px-6 pt-4 pb-8 ${animatedContainerStyle}`}>
            <Text className="text-4xl font-bold text-center mb-2 text-[#00162e]">
              {t('welcome')}
            </Text>
            <Text className="text-center text-gray-600 mb-8 text-base">
              {isCodeSent ? t('verificationCode') : t('signInWithPhone')}
            </Text>

            <Animated.View
              key={isCodeSent ? 'verification' : 'phone'}
              entering={isCodeSent ? FadeInRight.duration(400) : FadeInLeft.duration(400)}
              exiting={isCodeSent ? FadeOutLeft.duration(400) : FadeOutRight.duration(400)}
            >
              {!isCodeSent ? (
                <>
                  <View className="mb-8">
                    <Text className="text-sm mb-2 text-gray-700 font-medium">{t('phoneNumber')}</Text>
                    <InputContainer error={phoneError}>
                      <View className="flex-row items-center">
                        <View className="flex-row items-center border-r border-gray-200 pr-3 mr-3">
                          <Text className="text-2xl mr-2">🇹🇳</Text>
                          <Text className="font-semibold text-base text-gray-800">+216</Text>
                        </View>
                        <TextInput
                          className="flex-1 text-base text-gray-800 tracking-wider"
                          placeholder="xx xxx xxx"
                          keyboardType="number-pad"
                          value={phoneNumber}
                          onChangeText={handlePhoneChange}
                          maxLength={11}
                          autoCapitalize="none"
                          autoComplete="tel"
                          textContentType="telephoneNumber"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    </InputContainer>
                    {phoneError && (
                      <Text className="text-red-500 text-sm mt-2 ml-1">{phoneError}</Text>
                    )}
                  </View>

                  <Text className="text-center text-gray-500 mb-8 text-sm px-6">
                    {t('weWillSendCode')}
                  </Text>

                  <TouchableOpacity
                    disabled={loading}
                    onPress={sendVerificationCode}
                    className={`bg-[#00162e] rounded-xl py-4 items-center mb-4 shadow-lg shadow-blue-900/20
                      ${loading ? 'opacity-50' : 'active:opacity-90'}`}
                  >
                    <Text className="text-white font-semibold text-base">
                      {loading ? t('sending...') : t('sendCode')}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View className="mb-6">
                    <Text className="text-sm mb-3 text-gray-700 font-medium">{t('verificationCode')}</Text>
                    <View className="flex-row justify-between mb-2">
                      {otpDigits.map((digit, idx) => (
                        <View key={idx} className={`shadow-sm ${codeError ? 'shadow-red-100' : 'shadow-gray-100'}`}>
                          <TextInput
                            ref={otpRefs[idx]}
                            className={`w-[45px] h-[55px] text-xl font-medium text-center 
                              bg-white border-2 rounded-xl
                              ${codeError 
                                ? 'border-red-400 text-red-500' 
                                : digit 
                                  ? 'border-[#00162e] text-[#00162e]' 
                                  : 'border-gray-200 text-gray-800'}`}
                            keyboardType="number-pad"
                            maxLength={1}
                            value={digit}
                            onChangeText={val => handleOtpChange(idx, val)}
                            autoFocus={idx === 0}
                            returnKeyType="next"
                          />
                        </View>
                      ))}
                    </View>
                    {codeError && (
                      <Text className="text-red-500 text-sm mt-2 ml-1">{codeError}</Text>
                    )}
                  </View>

                  <Text className="text-center text-gray-500 mb-8 text-sm px-6">
                    {t('enterCode')}
                  </Text>

                  <TouchableOpacity
                    disabled={loading}
                    onPress={() => verifyCode()}
                    className={`bg-[#00162e] rounded-xl py-4 items-center mb-6 shadow-lg shadow-blue-900/20
                      ${loading ? 'opacity-50' : 'active:opacity-90'}`}
                  >
                    <Text className="text-white font-semibold text-base">
                      {loading ? t('verifying...') : t('verifyCode')}
                    </Text>
                  </TouchableOpacity>

                  <View className="flex-row items-center justify-between mb-6 px-2">
                    <TouchableOpacity
                      disabled={loading}
                      onPress={goBackToPhone}
                      className="flex-row items-center py-2"
                    >
                      <Text className="text-[#00162e] font-semibold text-base">← {t('Back')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      disabled={loading || resendTimer > 0}
                      onPress={resendCode}
                      className={`py-2 ${resendTimer > 0 ? 'opacity-50' : ''}`}
                    >
                      <Text className={`font-medium text-base
                        ${resendTimer > 0 ? 'text-gray-400' : 'text-[#00162e]'}`}>
                        {resendTimer > 0 
                          ? `${t('resendCode')} (${resendTimer}s)` 
                          : t('resendCode')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
