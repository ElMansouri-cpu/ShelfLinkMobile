"use client"
import { useRef, useState } from "react"
import { View, Text, TouchableOpacity, SafeAreaView, TextInput, Animated } from "react-native"
import { ChevronLeft, Eye, EyeOff } from "lucide-react-native"
import { useRouter } from "expo-router"
import { useUpdatePassword } from "../../../../services/user-service/user.query"
import Header from "../../../../components/Header"
import { useTranslation } from "react-i18next"

export default function Password() {
  const { t } = useTranslation()
  const router = useRouter()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { mutate: updatePassword } = useUpdatePassword()

  const savePassword = () => {
    // In a real app, you would validate and save this to your backend
    if (newPassword !== confirmPassword) {
      alert(t("New passwords don't match"))
      return
    }
    updatePassword(newPassword)

    setTimeout(() => {
      router.back()
    }, 500)
  }

  const scrollY = useRef(new Animated.Value(0)).current
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Status Bar - would be handled by React Native StatusBar in a real app */}
      <Header scrollY={scrollY} title={t("Change password")} onBack={()=>router.back()} opacity={1} onSave={savePassword} />

      {/* Header */}
   

      {/* Content */}
      <View className="flex-1 px-4 py-20">
        {/* Current Password */}
      

        {/* New Password */}
        <View className="mb-6">
          <Text className="text-sm text-gray-500 mb-2">{t("New password")}</Text>
          <View className="flex-row items-center #10b981">
            <TextInput
              className="flex-1 text-lg text-gray-800 py-3"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder={t("Enter new password")}
              secureTextEntry={!showNewPassword}
            />
            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
              {showNewPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm Password */}
        <View className="mb-6">
          <Text className="text-sm text-gray-500 mb-2">{t("Confirm new password")}</Text>
          <View className="flex-row items-center #10b981">
            <TextInput
              className="flex-1 text-lg text-gray-800 py-3"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={t("Confirm new password")}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Text className="text-sm text-gray-500 mt-4">
          {t("Your password must be at least 8 characters long and include a mix of letters, numbers, and symbols.")}
        </Text>
      </View>

      {/* Home Indicator */}
      <View className="items-center pb-2">
        <View className="w-32 h-1 bg-gray-300 rounded-full" />
      </View>
    </SafeAreaView>
  )
}
