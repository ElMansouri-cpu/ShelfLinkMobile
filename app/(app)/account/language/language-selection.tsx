"use client"
import { useRef, useState } from "react"
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Animated } from "react-native"
import { ChevronLeft, Check } from "lucide-react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { languageMapping } from "../../../../locales/language_mapping"
import Header from "../../../../components/Header"

export default function LanguageSelection() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language||"en")
  const scrollY = useRef(new Animated.Value(0)).current
  const scrollViewRef = useRef<ScrollView>(null)

  const selectLanguage = (language) => {
    i18n.changeLanguage(language)
    setSelectedLanguage(language)
    setTimeout(() => {
      router.back()
    }, 500)
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Status Bar - would be handled by React Native StatusBar in a real app */}


      {/* Header */}
      <Header scrollY={scrollY} title={t("Preferred language")} onBack={()=>router.back()} opacity={1} />

      {/* Language List */}
      <ScrollView className="flex-1 py-20" ref={scrollViewRef}>
        {Object.entries(languageMapping).map(([code, language]) => (
          <TouchableOpacity
            key={code}
            className="flex-row justify-between items-center px-4 py-4 border-b border-gray-100"
            onPress={() => selectLanguage(code)}
          >
            <View>
              <Text className="text-xl text-gray-800">{language}</Text>
              <Text className="text-base text-gray-500">{code}</Text>
            </View>
            {selectedLanguage === code && <Check color="#00A67E" className="h-6 w-6" />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Home Indicator */}
      <View className="items-center pb-2">
        <View className="w-32 h-1 bg-gray-300 rounded-full" />
      </View>
    </SafeAreaView>
  )
}
