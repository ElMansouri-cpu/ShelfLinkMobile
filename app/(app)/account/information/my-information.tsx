import { useEffect, useRef, useState } from "react"
import { View, Text, TouchableOpacity, SafeAreaView, TextInput, Animated, Image, Alert, ActivityIndicator } from "react-native"
import { Camera } from "lucide-react-native"
import { useRouter } from "expo-router"
import { useUpdateUserProfile } from "../../../../services/user-service/user.query"
import { useAuth } from "../../../../context/AuthContext"
import Header from "../../../../components/Header"
import { useTranslation } from "react-i18next"
import * as ImagePicker from 'expo-image-picker'

export default function MyInformation() {
    const { t } = useTranslation()
    const { mutate: updateUserProfile, isPending: isUpdatingProfile } = useUpdateUserProfile()
    const { user, updateUser } = useAuth()
    const router = useRouter()
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [profileImageUrl, setProfileImageUrl] = useState("")
    const [isUploadingImage, setIsUploadingImage] = useState(false)
    const scrollY = useRef(new Animated.Value(0)).current

    useEffect(()=>{
        if (user) {
            setFirstName(user.firstName || "")
            setLastName(user.lastName || "")
            setProfileImageUrl(user.profileImageUrl || "")
        }
    },[user])


    const handleImagePicker = async () => {
        try {
            // Request permission
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
            if (status !== 'granted') {
                Alert.alert(t('Permission Required'), t('Please grant permission to access your photo library'))
                return
            }

            // Show action sheet
            Alert.alert(
                t('Select Photo'),
                t('Choose an option'),
                [
                    { text: t('Camera'), onPress: openCamera },
                    { text: t('Photo Library'), onPress: openImageLibrary },
                    { text: t('Cancel'), style: 'cancel' }
                ]
            )
        } catch (error) {
            console.error('Error requesting permissions:', error)
            Alert.alert(t('Error'), t('Failed to request permissions'))
        }
    }

    const openCamera = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync()
            if (status !== 'granted') {
                Alert.alert(t('Permission Required'), t('Please grant permission to access your camera'))
                return
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            })

            if (!result.canceled && result.assets[0]) {
                await uploadImage(result.assets[0].uri)
            }
        } catch (error) {
            console.error('Error opening camera:', error)
            Alert.alert(t('Error'), t('Failed to open camera'))
        }
    }

    const openImageLibrary = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            })

            if (!result.canceled && result.assets[0]) {
                await uploadImage(result.assets[0].uri)
            }
        } catch (error) {
            console.error('Error opening image library:', error)
            Alert.alert(t('Error'), t('Failed to open image library'))
        }
    }

    const uploadImage = async (imageUri: string) => {
        try {
            setIsUploadingImage(true)
            
            // For now, we'll just set the local URI
            // In a real app, you'd upload to a server and get back a URL
            setProfileImageUrl(imageUri)
            
            // Update the user profile with the new image
            await handleUpdateProfile({ profileImageUrl: imageUri })
            
            Alert.alert(t('Success'), t('Profile picture updated successfully'))
        } catch (error) {
            console.error('Error uploading image:', error)
            Alert.alert(t('Error'), t('Failed to update profile picture'))
        } finally {
            setIsUploadingImage(false)
        }
    }

    const handleUpdateProfile = async (updates: { firstName?: string; lastName?: string; profileImageUrl?: string }) => {
        try {
            const profileData = {
                ...updates,
                firstName: updates.firstName || firstName,
                lastName: updates.lastName || lastName,
                profileImageUrl: updates.profileImageUrl || profileImageUrl,
            }

            updateUserProfile(profileData, {
                onSuccess: (data) => {
                    console.log('Profile updated successfully:', data)
                    // Update local user context
                    updateUser(profileData)
                },
                onError: (error) => {
                    console.error('Error updating profile:', error)
                    Alert.alert(t('Error'), t('Failed to update profile'))
                }
            })
        } catch (error) {
            console.error('Error in handleUpdateProfile:', error)
            Alert.alert(t('Error'), t('Failed to update profile'))
        }
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
                {/* Profile Picture Section */}
                <View className="items-center py-6 border-b border-gray-200">
                    <TouchableOpacity 
                        onPress={handleImagePicker}
                        disabled={isUploadingImage}
                        className="relative"
                    >
                        <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center overflow-hidden">
                            {profileImageUrl ? (
                                <Image 
                                    source={{ uri: profileImageUrl }} 
                                    className="w-full h-full"
                                    resizeMode="cover"
                                />
                            ) : (
                                <Camera size={32} color="#9ca3af" />
                            )}
                        </View>
                        {isUploadingImage && (
                            <View className="absolute inset-0 bg-black bg-opacity-50 rounded-full items-center justify-center">
                                <ActivityIndicator color="white" size="small" />
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={handleImagePicker}
                        disabled={isUploadingImage}
                        className="mt-3"
                    >
                        <Text className="text-[#48C6A8] font-medium">
                            {isUploadingImage ? t("Uploading...") : t("Change Photo")}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* First Name Input */}
                <View className="py-4 border-b border-gray-200">
                    <Text className="text-sm text-gray-500 mb-1">{t("First Name")}</Text>
                    <TextInput
                        className="text-lg text-gray-800"
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder={t("Enter your first name")}
                        onBlur={() => handleUpdateProfile({ firstName })}
                    />
                </View>

                {/* Last Name Input */}
                <View className="py-4 border-b border-gray-200">
                    <Text className="text-sm text-gray-500 mb-1">{t("Last Name")}</Text>
                    <TextInput
                        className="text-lg text-gray-800"
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder={t("Enter your last name")}
                        onBlur={() => handleUpdateProfile({ lastName })}
                    />
                </View>

            </View>

            {/* Home Indicator */}
            <View className="items-center pb-2">
                <View className="w-32 h-1 bg-gray-300 rounded-full" />
            </View>
        </SafeAreaView>
    )
}
