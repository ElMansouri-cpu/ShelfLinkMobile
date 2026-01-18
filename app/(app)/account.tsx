"use client"
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Alert, Image, StatusBar } from "react-native"
import {
  X,
  HelpCircle,
  ChevronRight,
  ShoppingBag,
  User,
  Gift,
  Award,
  Tag,
  InfoIcon as FAQ,
  Bell,
  LogOut,
  Feather,
  ArrowLeft,
  Languages,
} from "lucide-react-native"
import { supabase } from "../../lib/supabase"
import { useEffect, useState } from "react"
import { useRouter } from "expo-router"
import { useGetProfile } from "../../services/user-service/user.query"
import { safePush } from '../../utils/navigation'
import { useTranslation } from "react-i18next"
import { useAuth } from '../../hooks/useAuth'

export default function AccountScreen() {
  const { t } = useTranslation()
  const { logout, user, loading: authLoading, isAuthenticated } = useAuth()
  const [username, setUsername] = useState("")
  const router = useRouter()
  

  useEffect(() => {
    if (user?.firstName) {
      setUsername(user.firstName)
    } else {
      setUsername("User")
    }
  }, [user])

  async function handleSignOut() {
    try {
      await logout()
      router.replace('/(auth)/login')
    } catch (error) {
      console.error("Logout error:", error)
      Alert.alert("Error", "Failed to logout")
    }
  }

  if (authLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#1A2A4F] justify-center items-center">
        <StatusBar barStyle="light-content" backgroundColor="#1A2A4F" />
        <Text className="text-lg text-white">Loading...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-[#1A2A4F]">
      <StatusBar barStyle="light-content" backgroundColor="#1A2A4F" />


      {/* Header */}
      <View className="px-4 py-3 flex-row justify-between items-center">
       
      </View>

      {/* Greeting */}
      <View className="px-4 py-6">
        <View className="flex-row items-center">
          <View className="h-14 w-14 rounded-full bg-gray-200 justify-center items-center mr-3 overflow-hidden">
            {user?.profileImageUrl ? (
              <Image 
                source={{ uri: user.profileImageUrl }} 
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <Text className="text-white text-xl font-bold bg-[#48C6A8] w-full h-full flex items-center justify-center">
                {username ? username.charAt(0).toUpperCase() : "U"}
              </Text>
            )}
          </View>        
          <Text className="text-3xl font-bold text-white">{t("Hello")}, {username || "User"}.</Text>
        </View>
      </View>

      {/* Account Section */}
      <View className="flex-1 bg-white rounded-t-3xl px-4 pt-6">
        <Text className="text-2xl font-bold mb-4">{t("Account")}</Text>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <MenuItem 
            icon={<User className="h-6 w-6 text-gray-700" />}  
            title={t("My information")} 
            onPress={() => safePush('/account/information/my-information')} 
          />
          <MenuItem 
            icon={<Languages className="h-6 w-6 text-gray-700" />}  
            title={t("Language")} 
            onPress={() => safePush('/account/language/language-settings')} 
          />
{/* 
          <MenuItem icon={<Gift className="h-6 w-6 text-gray-700" />} title="Share and earn!" />

          <MenuItem icon={<Award className="h-6 w-6 text-gray-700" />} title="Glovo Prime" />

          <MenuItem icon={<Tag className="h-6 w-6 text-gray-700" />} title="Promocodes" />

          <MenuItem icon={<FAQ className="h-6 w-6 text-gray-700" />} title="F.A.Q." /> */}

          {/* <MenuItem icon={<Bell className="h-6 w-6 text-gray-700" />} title="Notifications" showChevron={false} /> */}

          <MenuItem 
            icon={<LogOut className="h-6 w-6 text-gray-700" />} 
            onPress={handleSignOut} 
            title={t("Log out")} 
            showChevron={false} 
          />

          {/* Extra space at bottom for scrolling */}
          <View className="h-20" />
        </ScrollView>
      </View>
      
    </SafeAreaView>
  )
}

function MenuItem({ icon, title, showChevron = true, onPress }: { icon: any, title: string, showChevron?: boolean, onPress?: () => void }) {
  return (
    <TouchableOpacity className="flex-row items-center py-4 border-b border-gray-100" onPress={onPress}>
      <View className="mr-4">{icon}</View>
      <Text className="flex-1 text-gray-800 text-lg">{title}</Text>
      {showChevron && <ChevronRight className="h-5 w-5 text-gray-400" />}
    </TouchableOpacity>
  )
}
