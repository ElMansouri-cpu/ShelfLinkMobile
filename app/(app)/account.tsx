"use client"
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Alert } from "react-native"
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

export default function AccountScreen() {
  const { t } = useTranslation()
  const { data: profile } = useGetProfile()
  const [username, setUsername] = useState(profile?.username||"")
  const router = useRouter()

  useEffect(() => {
    setUsername(profile?.username||"")
  }, [profile])

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      Alert.alert(error.message)
    } else {
      router.replace('/(auth)/login')
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FFBA08]">


      {/* Header */}
      <View className="px-4 py-3 flex-row justify-between items-center">
       
        <TouchableOpacity    style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
              }} onPress={() => { safePush({pathname: `/(app)/home`}) }}>
            <ArrowLeft size={32} color="#111" />
          </TouchableOpacity>
    
      </View>

      {/* Greeting */}
      <View className="px-4 py-6">
        <View className="flex-row items-center">
          <View className="h-14 w-14 rounded-full bg-[#7DD3D8] justify-center items-center mr-3">
            <Text className="text-white text-xl font-bold">{username.charAt(0).toUpperCase()}</Text>
          </View>        
          <Text className="text-3xl font-bold text-black">{t("Hello")}, {username}.</Text>
        </View>
      </View>

      {/* Account Section */}
      <View className="flex-1 bg-white rounded-t-3xl px-4 pt-6">
        <Text className="text-2xl font-bold mb-4">{t("Account")}</Text>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <MenuItem 
            icon={<ShoppingBag className="h-6 w-6 text-gray-700" />}  
            title={t("My orders")} 
            onPress={() => safePush('/(app)/orders')} 
          />

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
