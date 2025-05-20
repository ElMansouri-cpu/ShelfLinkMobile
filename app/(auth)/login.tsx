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
import { useAuth } from '../../context/AuthContext'
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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSignIn, setIsSignIn] = useState(true)
  const [loading, setLoading] = useState(false)
  const { setSession } = useAuth()
  const { t, i18n } = useTranslation();
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Height animation
  const collapsedHeight = 360
  const expandedHeight = 520
  const animatedHeight = useSharedValue(isSignIn ? collapsedHeight : expandedHeight)

  useEffect(() => {
    animatedHeight.value = withTiming(isSignIn ? collapsedHeight : expandedHeight, { duration: 400 })
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  }, [isSignIn])

  const animatedContainerStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value
  }))

  function validateEmail(email: string) {
    return /\S+@\S+\.\S+/.test(email);
  }

  async function signInWithEmail() {
    setEmailError('');
    setPasswordError('');
    let valid = true;

    if (!validateEmail(email)) {
      setEmailError(t('Invalid email address'));
      valid = false;
    }
    if (!password) {
      setPasswordError(t('Password is required'));
      valid = false;
    } else if (password.length < 6) {
      setPasswordError(t('Password must be at least 8 characters long'));
      valid = false;
    }
    if (!valid) return;

    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      Alert.alert(t('Sign in failed'))
      setLoading(false)
      return
    }
    setSession(data.session)
    router.replace('/(app)/home')
    setLoading(false)
  }

  async function signUpWithEmail() {
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    let valid = true;

    if (!validateEmail(email)) {
      setEmailError(t('Invalid email address'));
      valid = false;
    }
    if (!password) {
      setPasswordError(t('Password is required'));
      valid = false;
    } else if (password.length < 6) {
      setPasswordError(t('Password must be at least 6 characters'));
      valid = false;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError(t('Passwords do not match'));
      valid = false;
    }
    if (!valid) return;

    setLoading(true)
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'client'
        }
      }
    })

    if (error) {
      Alert.alert(t(error.message))
      setLoading(false)
      return
    }

    if (session?.user) {
      const {  error: userError } = await supabase
        .from('users')
        .insert([
          {
            id: session.user.id,
            email: session.user.email,
            role: 'client',
          }
        ])

      if (userError) {
        Alert.alert(t('Error creating user profile'))
        console.error(userError)
      }
    }

    if (!session) {
      Alert.alert(t('Please check your inbox for email verification!'));
      setIsSignIn(true)
    } else {
      setSession(session)
      setIsSignIn(true)
      router.replace('/(app)/onboarding/onboarding-stepper')
    }
    setLoading(false)
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="default" />
      <ScrollView className="flex-1">
        {/* Header */}
        <View className={`bg-[#00162e] ${isSignIn ? 'pb-16' : 'pb-8'} relative`}>
          <View className="items-center">
            <Image
              source={require('../../assets/splash-image.png')}
              style={{ width: width, height: isSignIn ? 240 : 200 }}
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
            {isSignIn ? t('Sign-in-or-create-an-account') : t('Create-an-account')}
          </Text>

          <Animated.View
            key={isSignIn ? 'signIn' : 'signUp'}
            entering={isSignIn ? FadeInRight.duration(400) : FadeInLeft.duration(400)}
            exiting={isSignIn ? FadeOutLeft.duration(400) : FadeOutRight.duration(400)}
          >
            {isSignIn ? (
              <>
                <View className="mb-4">
                  <Text className="text-sm mb-1 text-gray-700">{t('email')}</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                    placeholder={`email@address.com`}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    value={email}
                    onChangeText={setEmail}
                  />
                  {emailError ? <Text style={{ color: 'red', fontSize: 12 }}>{emailError}</Text> : null}
                </View>

                <View className="mb-6">
                  <Text className="text-sm mb-1 text-gray-700">{t('password')}</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                    placeholder={t('password')}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="password"
                    textContentType="password"
                    importantForAutofill="yes"
                    value={password}
                    onChangeText={setPassword}
                  />
                  {passwordError ? <Text style={{ color: 'red', fontSize: 12 }}>{passwordError}</Text> : null}
                </View>

                <TouchableOpacity
                  disabled={loading}
                  onPress={signInWithEmail}
                  className={`bg-[#00162e] rounded-full py-3.5 items-center mb-4 ${loading ? 'opacity-50' : ''}`}
                >
                  <Text className="text-white font-medium text-base">{t('Sign-in')}</Text>
                </TouchableOpacity>

                <View className="flex-row items-center mb-6">
                  <View className="flex-1 h-px bg-gray-300" />
                  <Text className="px-4 text-gray-500 text-sm">{t('Or with')}</Text>
                  <View className="flex-1 h-px bg-gray-300" />
                </View>

                <TouchableOpacity
                  disabled={loading}
                  onPress={() => setIsSignIn(false)}
                  className={`flex-row items-center justify-center border border-gray-300 rounded-full py-3 mb-6 ${loading ? 'opacity-50' : ''}`}
                >
                  <Text className="font-medium text-base">{t('Sign-up')}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View className="mb-4">
                  <Text className="text-sm mb-1 text-gray-700">{t('email')}</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                    placeholder="email@address.com"
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    value={email}
                    onChangeText={setEmail}
                  />
                  {emailError ? <Text style={{ color: 'red', fontSize: 12 }}>{emailError}</Text> : null}
                </View>

                <View className="mb-6">
                  <Text className="text-sm mb-1 text-gray-700">{t('password')}</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                    placeholder={t('password')}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="password"
                    textContentType="password"
                    importantForAutofill="yes"
                    value={password}
                    onChangeText={setPassword}
                  />
                  {passwordError ? <Text style={{ color: 'red', fontSize: 12 }}>{passwordError}</Text> : null}
                </View>

                <View className="mb-6">
                  <Text className="text-sm mb-1 text-gray-700">{t('confirmPassword')}</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                    placeholder={t('confirmPassword')}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="password"
                    textContentType="password"
                    importantForAutofill="yes"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  {confirmPasswordError ? <Text style={{ color: 'red', fontSize: 12 }}>{confirmPasswordError}</Text> : null}
                </View>

                <TouchableOpacity
                  disabled={loading}
                  onPress={signUpWithEmail}
                  className={`bg-[#00162e] rounded-full py-3.5 items-center mb-4 ${loading ? 'opacity-50' : ''}`}
                >
                  <Text className="text-white font-medium text-base">{t('Sign-up')}</Text>
                </TouchableOpacity>

                <View className="flex-row items-center mb-6">
                  <View className="flex-1 h-px bg-gray-300" />
                  <Text className="px-4 text-gray-500 text-sm">{t('Do you have an account?')}</Text>
                  <View className="flex-1 h-px bg-gray-300" />
                </View>

                <TouchableOpacity
                  disabled={loading}
                  onPress={() => setIsSignIn(true)}
                  className={`flex-row items-center justify-center border border-gray-300 rounded-full py-3 mb-6 ${loading ? 'opacity-50' : ''}`}
                >
                  <Text className="font-medium text-base">{t('Sign-in')}</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}
