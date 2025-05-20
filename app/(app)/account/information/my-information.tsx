import { useEffect, useRef, useState } from "react"
import { View, Text, TouchableOpacity, SafeAreaView, TextInput, Animated } from "react-native"
import { ChevronLeft, ChevronRight } from "lucide-react-native"
import { useRouter } from "expo-router"
import { useGetProfile, useUpdateProfile } from "../../../../services/user-service/user.query"
import { useAuth } from "../../../../context/AuthContext"
import { updateProfileEmail } from "../../../../services/user-service/user.service"
import { safePush } from "../../../../utils/navigation"
import Header from "../../../../components/Header"
import { useTranslation } from "react-i18next"

export default function MyInformation() {
    const { t } = useTranslation()
    const { data: profile } = useGetProfile()  
    const { mutate: updateProfile } = useUpdateProfile()
    const { session } = useAuth()
    const router = useRouter()
    const [username, setUsername] = useState(profile?.username||"")
    const [email, setEmail] = useState(profile?.email||"")
    const [phone, setPhone] = useState(profile?.phone||"")
    const scrollY = useRef(new Animated.Value(0)).current

    useEffect(()=>{
        setUsername(profile?.username||"")
        setEmail(profile?.email||"")
        setPhone(profile?.phone||"")
    },[profile])

    const navigateToPhoneNumber = () => {
        safePush("/account/information/phone-number")
    }

    const navigateToPassword = () => {
        safePush("/account/information/password")
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Status Bar - would be handled by React Native StatusBar in a real app */}
           

            {/* Header */}
            {/* <View className="px-4 py-4 flex-row items-center border-b border-gray-100">
                <TouchableOpacity className="mr-4" onPress={() => router.back()}>
                    <ChevronLeft className="h-6 w-6 text-black" />
                </TouchableOpacity>
                <Text className="text-xl font-bold">My information</Text>
            </View> */}
            <Header title={t("My information")} onBack={()=>router.back()} opacity={1} scrollY={scrollY} />

            {/* Content */}
            <View className="flex-1 px-4 py-20">
                {/* Username Input */}
                <View className="py-4 1">
                    <Text className="text-sm text-gray-500 mb-1">{t("Username")}</Text>
                    <TextInput
                        className="text-lg text-gray-800"
                        value={username}
                        onChangeText={setUsername}
                        placeholder={t("Enter your username")}
                        onBlur={() => updateProfile({ id: session?.user.id, username })}
                    />
                </View>

                {/* Email Input */}
                <View className="py-4 border-gray-200">
                    <Text className="text-sm text-gray-500 mb-1">{t("Email")}</Text>
                    <TextInput
                        className="text-lg text-gray-800"
                        value={email}
                        onChangeText={setEmail}
                        placeholder={t("Enter your email")}
                        keyboardType="email-address"
                        onBlur={() => updateProfileEmail(email)}
                    />
                </View>

                {/* Phone Number Menu Item */}
                <TouchableOpacity
                    className="flex-row justify-between items-center py-5 border-b border-gray-200"
                    onPress={navigateToPhoneNumber}
                >
                    <Text className="text-lg text-gray-800">{t("Phone number")}</Text>
                    <View className="flex-row items-center">
                        <Text className="text-lg text-gray-500 mr-2">{phone}</Text>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                    </View>
                </TouchableOpacity>

                {/* Password Menu Item */}
                <TouchableOpacity
                    className="flex-row justify-between items-center py-5 border-b border-gray-200"
                    onPress={navigateToPassword}
                >
                    <Text className="text-lg text-gray-800">{t("Password")}</Text>
                    <View className="flex-row items-center">
                        <Text className="text-lg text-gray-500 mr-2">••••••••</Text>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                    </View>
                </TouchableOpacity>
            </View>

            {/* Home Indicator */}
            <View className="items-center pb-2">
                <View className="w-32 h-1 bg-gray-300 rounded-full" />
            </View>
        </SafeAreaView>
    )
}
