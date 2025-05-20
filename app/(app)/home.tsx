import { View, Text, TouchableOpacity, Image, TextInput, ScrollView, SafeAreaView, Animated } from 'react-native'
import { useRouter } from 'expo-router'
import React, { useState, useEffect } from 'react'
import { Feather, MaterialIcons, FontAwesome } from '@expo/vector-icons'
import '../../i18n'
import { useTranslation } from 'react-i18next'
import { useGetAllStores } from '../../services/store-service/store.query'
import { useCart } from '../../context/CartContext'
import { safePush } from '../../utils/navigation'
// Skeleton component for store cards
const StoreCardSkeleton = () => {
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View className="mb-4 bg-white rounded-xl overflow-hidden shadow-sm">
      <Animated.View 
        style={{ 
          width: '100%', 
          height: 160,
          backgroundColor: '#e3e3e3',
          opacity 
        }} 
      />
      <View className="p-3">
        <View className="flex-row items-center">
          <Animated.View 
            style={{ 
              width: 40, 
              height: 40, 
              borderRadius: 20, 
              backgroundColor: '#E1E9EE',
              opacity 
            }} 
          />
          <Animated.View 
            style={{ 
              width: 120, 
              height: 20, 
              marginLeft: 12, 
              borderRadius: 4,
              backgroundColor: '#E1E9EE',
              opacity 
            }} 
          />
        </View>
        <View className="flex-row items-center mt-2">
          <Animated.View 
            style={{ 
              width: 60, 
              height: 16, 
              borderRadius: 4,
              backgroundColor: '#E1E9EE',
              opacity 
            }} 
          />
          <Animated.View 
            style={{ 
              width: 80, 
              height: 16, 
              marginLeft: 8,
              borderRadius: 4,
              backgroundColor: '#E1E9EE',
              opacity 
            }} 
          />
          <Animated.View 
            style={{ 
              width: 60, 
              height: 16, 
              marginLeft: 8,
              borderRadius: 4,
              backgroundColor: '#E1E9EE',
              opacity 
            }} 
          />
        </View>
      </View>
    </View>
  );
};

export default function Home() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const { t } = useTranslation();
  const { data: stores, isLoading, error, refetch } = useGetAllStores();
  const {clearCart}=useCart()


  const filteredStores = stores?.filter(store =>
    store.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const renderStoreCard = (store: any) => {
    // Generate random values for demo purposes
    const deliveryFee = (Math.random() * 5 + 2).toFixed(3)
    const deliveryTime = '30-40 min'
    const rating = Math.floor(Math.random() * 15 + 80)
    const reviews = Math.floor(Math.random() * 100)

    return (
      <TouchableOpacity
        key={store.id}
        className="mb-4 bg-white rounded-xl overflow-hidden shadow-sm"
        onPress={() => safePush( {pathname: `/(app)/store/${store.id}`, params: { store: JSON.stringify(store) }})}
      >
        <Image
          source={{ uri: 'https://glovo.dhmedia.io/image/stores-glovo/stores/d722bd537929fa107fa7136d72240634b89e484b423251a5319a3687680bf87e?t=W3siYXV0byI6eyJxIjoibG93In19LHsicmVzaXplIjp7ImhlaWdodCI6MjI1fX1d' }}
          style={{ width: '100%', height: 160 }}
          resizeMode="cover"
        />

        <View className="absolute top-4 left-4 bg-white/80 rounded-lg px-2 py-1 flex-row items-center">
          <Feather name="tag" size={14} color="#666" />
          <Text className="text-xs ml-1 text-gray-700">In-store prices</Text>
        </View>

        <View className="absolute top-12 left-4 bg-amber-400 rounded-lg px-2 py-1">
          <Text className="text-xs font-medium">Promo some items</Text>
        </View>

        <View className="p-3">
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-gray-200 rounded-full mr-3 items-center justify-center overflow-hidden">
              {store.logo ? (
                <Image
                  source={{ uri: store.logo }}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <Text className="font-bold">{store.name.charAt(0)}</Text>
              )}
            </View>
            <Text className="text-lg font-bold">{store.name}</Text>
          </View>

          <View className="flex-row items-center mt-2">
            <FontAwesome name="percent" size={14} color="#666" />
            <Text className="text-gray-600 ml-1">{deliveryFee} DT</Text>
            <Text className="text-gray-600 mx-2">•</Text>
            <Text className="text-gray-600">{deliveryTime}</Text>
            <Text className="text-gray-600 mx-2">•</Text>
            <View className="flex-row items-center">
              <MaterialIcons name="thumb-up" size={14} color="#4CAF50" />
              <Text className="text-gray-600 ml-1">{rating}%</Text>
              {reviews > 0 && (
                <Text className="text-gray-400 text-xs ml-1">({reviews})</Text>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">

      {/* Header */}
      <View className="bg-white px-4 py-2 flex-row items-center">


        <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-4 py-1">
          <Feather name="search" size={20} color="gray" />
          <TextInput
            className="flex-1 ml-2 text-base"
            placeholder={t("Search a store")}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>



        <TouchableOpacity onPress={() => safePush( '/(app)/account')} className="ml-2 bg-gray-200 w-10 h-10 rounded-full items-center justify-center">
          <Feather name="user" size={24} color="gray" />

        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 px-4 pt-4">
        {isLoading ? (
          <View className="pb-20">
            {[1, 2, 3, 4].map((_, index) => (
              <StoreCardSkeleton key={index} />
            ))}
          </View>
        ) : error ? (
          <View className="items-center h-[70vh] justify-center py-10">
            <Image source={require('../../assets/errors.png')} style={{ width: 250, height: 250 }} />
            <Text className="text-gray-400 mt-4 text-center text-2xl font-bold">{t('Failed to load stores')} </Text>
            <Text className="text-gray-400 mt-2 text-center text-md">{t('Failed to load stores .Please try again later')} </Text>

            <TouchableOpacity
              onPress={() => refetch()}
              className="bg-[#00162e] px-6 py-3 mt-4 rounded-full"
            >
              <Text className="text-white font-medium">{t('Retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : filteredStores.length === 0 ? (
          <View className="items-center h-[70vh] justify-center ">
            <Image source={require('../../assets/shopping-bag.png')} style={{ width: 300, height: 300 }} />
            <Text className="text-gray-400 mt-4 text-center text-2xl font-bold">  {t('No available stores')} </Text>
            <Text className="text-gray-400 mt-2 text-center text-md"> {t('No available stores .Please try again later')} </Text>

            <TouchableOpacity onPress={() => refetch()} className="bg-[#00162e] px-8 py-3 rounded-full mt-4">
              <Text className="text-white font-medium">{t('Retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="pb-20">
            {filteredStores.map(renderStoreCard)}
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}

    </SafeAreaView>
  )
}