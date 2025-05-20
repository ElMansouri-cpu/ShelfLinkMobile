"use client"
import { View, Text, TouchableOpacity, SafeAreaView, Animated } from "react-native"
import { ChevronLeft, ChevronRight } from "lucide-react-native"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { languageMapping } from "../../../../locales/language_mapping"
import { safePush } from "../../../../utils/navigation"
import { useRef } from "react"
import Header from "../../../../components/Header"

export default function LanguageSettings() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const navigateToLanguageSelection = () => {
    safePush("/account/language/language-selection")
  }

  const ScrollY = useRef(new Animated.Value(0)).current
  const currentLanguage = languageMapping[i18n.language] || "English"

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Status Bar - would be handled by React Native StatusBar in a real app */}
      <Header scrollY={ScrollY} title={t("Language")} onBack={()=>router.back()} opacity={1} />

      {/* Header */}
      {/* <View className="px-4 py-4 flex-row items-center border-b border-gray-100">
        <TouchableOpacity className="mr-4" onPress={() => router.back()}>
          <ChevronLeft className="h-6 w-6 text-black" />
        </TouchableOpacity>
        <Text className="text-xl font-bold">Language</Text>
      </View> */}

      {/* Content */}
      <View className="flex-1 px-4 py-20">
        <TouchableOpacity
          className="flex-row justify-between items-center py-5 border-b border-gray-200"
          onPress={navigateToLanguageSelection}
        >
          <Text className="text-xl text-gray-800">{t("Preferred language")}</Text>
          <View className="flex-row items-center">
            <Text className="text-xl text-[#00A67E] mr-2">{currentLanguage}</Text>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </View>
        </TouchableOpacity>

        <View className="mt-4">
          <Text className="text-base text-gray-500">
            {t("You'll see the app and all communications in your preferred language.")}
          </Text>
        </View>
      </View>

      {/* Home Indicator */}
      <View className="items-center pb-2">
        <View className="w-32 h-1 bg-gray-300 rounded-full" />
      </View>
    </SafeAreaView>
  )
}
