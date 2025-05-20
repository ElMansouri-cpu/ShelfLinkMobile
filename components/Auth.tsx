import React, { useState } from 'react'
import { Alert, AppState, TextInput, Text, TouchableOpacity, View } from 'react-native'
import { supabase } from '../lib/supabase'

declare module 'react-native' {
  interface ViewProps {
    className?: string
  }
  interface TextProps {
    className?: string
  }
  interface TextInputProps {
    className?: string
  }
  interface TouchableOpacityProps {
    className?: string
  }
}

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function signInWithEmail() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) Alert.alert(error.message)
    setLoading(false)
  }

  async function signUpWithEmail() {
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
      Alert.alert(error.message)
      setLoading(false)
      return
    }

    if (session?.user) {
      // Create a new user record in the users table
      const { error: userError } = await supabase
        .from('users')
        .insert([
          {
            id: session.user.id,
            email: session.user.email,
            role: 'client',
          }
        ])

      if (userError) {
        Alert.alert('Error creating user profile')
        console.error(userError)
      }
    }

    if (!session) Alert.alert('Please check your inbox for email verification!')
    setLoading(false)
  }

  return (
    <View className="mt-10 px-3">
      <View className="py-1 w-full mt-5">
        <Text className="text-sm mb-1 text-gray-700">Email</Text>
        <TextInput
          className="border border-gray-300 rounded px-3 py-2 text-base"
          placeholder="email@address.com"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View className="py-1 w-full">
        <Text className="text-sm mb-1 text-gray-700">Password</Text>
        <TextInput
          className="border border-gray-300 rounded px-3 py-2 text-base"
          placeholder="Password"
          secureTextEntry
          autoCapitalize="none"
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <View className="py-1 w-full mt-5">
        <TouchableOpacity
          disabled={loading}
          onPress={signInWithEmail}
          className={`rounded bg-blue-600 py-3 items-center ${loading ? 'opacity-50' : ''}`}
        >
          <Text className="text-white font-medium text-base">Sign in</Text>
        </TouchableOpacity>
      </View>

      <View className="py-1 w-full">
        <TouchableOpacity
          disabled={loading}
          onPress={signUpWithEmail}
          className={`rounded bg-green-600 py-3 items-center ${loading ? 'opacity-50' : ''}`}
        >
          <Text className="text-white font-medium text-base">Sign up</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
