"use client"
import { useEffect, useRef, useState } from "react"
import { View, Text, TouchableOpacity, SafeAreaView, TextInput, Animated } from "react-native"
import { ChevronLeft } from "lucide-react-native"
import { useRouter } from "expo-router"
import { useUpdateProfile,useGetProfile,useUpdatePhone } from "../../../../services/user-service/user.query"
import { useAuth } from "../../../../context/AuthContext"
import Header from "../../../../components/Header"
import { useTranslation } from "react-i18next"

const validatePhoneNumber = (phone: string) => {
  // Check if length is exactly 8
  if (phone.length !== 8) {
    return false;
  }

  // Get first two digits
  const firstTwoDigits = parseInt(phone.slice(0, 2));
  
  // Check if first two digits are in valid ranges
  const isValidRange = 
    (firstTwoDigits >= 20 && firstTwoDigits <= 29) ||
    (firstTwoDigits >= 90 && firstTwoDigits <= 99) ||
    (firstTwoDigits >= 50 && firstTwoDigits <= 59);

  return isValidRange;
};

export default function PhoneNumber() {
  const { t } = useTranslation()
  const {data:profile} = useGetProfile()
  const {session} = useAuth()
  const router = useRouter()
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone?.slice(4) || "")
  const [error, setError] = useState("")
  const { mutate: updatePhone } = useUpdatePhone()

  const handlePhoneChange = (text: string) => {
    // Only allow numbers and limit to 8 digits
    const numbersOnly = text.replace(/[^0-9]/g, '').slice(0, 8);
    setPhoneNumber(numbersOnly);
    setError("");
  };

  const scrollY = useRef(new Animated.Value(0)).current
  const savePhoneNumber = () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setError(t("Invalid phone number format. Must be 8 digits with first two digits in ranges [20-29], [90-99], or [50-59]"));
      return;
    }
    
    updatePhone("+216" + phoneNumber)
    setTimeout(() => {
      router.back()
    }, 500)
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
    


      <Header scrollY={scrollY} title={t("Phone number")} onBack={()=>router.back()} opacity={1} onSave={savePhoneNumber} />
      {/* Content */}
      <View className="flex-1 px-4 py-20">
        <Text className="text-sm text-gray-500 mb-2">{t("Enter your phone number")}</Text>
        <View className="flex-row items-center border-b border-gray-300">
          <View className="flex-row items-center">
            <Text className="text-lg text-gray-800 py-3 mr-1">🇹🇳</Text>
            <Text className="text-lg text-gray-800 py-3 mr-2">+216</Text>
          </View>
          <TextInput
            className="text-lg text-gray-800 py-3 flex-1"
            value={phoneNumber}
            onChangeText={handlePhoneChange}
            placeholder="XXXXXXXX"
            keyboardType="phone-pad"
            maxLength={8}
          />
        </View>
        {error ? (
          <Text className="text-red-500 text-sm mt-2">{error}</Text>
        ) : (
          <Text className="text-sm text-gray-500 mt-4">
            {t("We'll send a verification code to this number when you change it.")}
          </Text>
        )}
      </View>

      {/* Home Indicator */}
      <View className="items-center pb-2">
        <View className="w-32 h-1 bg-gray-300 rounded-full" />
      </View>
    </SafeAreaView>
  )
}
