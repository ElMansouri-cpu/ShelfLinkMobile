import { View, Text, TouchableOpacity, Image, TextInput, ScrollView, SafeAreaView, Animated, StatusBar } from 'react-native'
import { useRouter } from 'expo-router'
import React, { useState, useEffect } from 'react'
import { Feather, MaterialIcons, FontAwesome } from '@expo/vector-icons'
import '../../i18n'
import { useTranslation } from 'react-i18next'
import { useGetAllStores } from '../../services/store-service/store.query'
import { useCart } from '../../context/CartContext'
import { safePush } from '../../utils/navigation'
import QRCodeScanner from '../../components/QRCodeScanner'
import { useAuth } from '../../context/AuthContext'
import { Redirect } from 'expo-router'
// Skeleton component for store cards
const StoreCardSkeleton = () => {
  const [animatedValue] = useState(() => new Animated.Value(0));

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
  }, [animatedValue]);

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
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('approved') // Default to approved
  const { t } = useTranslation();
  const { data: stores, isLoading, error, refetch } = useGetAllStores();
  const {clearCart}=useCart()
  const { user, isAuthenticated, loading: authLoading } = useAuth()

  // Format phone number with +216 prefix
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return 'No phone number'
    // Remove any non-digit characters
    const digits = phone.replace(/\D/g, '')
    // Format as +216 XX XXX XXX
    if (digits.length >= 8) {
      return `+216 ${digits.slice(-8, -6)} ${digits.slice(-6, -3)} ${digits.slice(-3)}`
    }
    return phone
  }

  // Check if user is onboarded, redirect to onboarding if not
  if (authLoading) {
    return null; // Show loading state
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/(auth)/login" />
  }

  // Debug logging
  console.log('Home page - User onboarding status:', user.isOnboarded);
  console.log('Home page - User data:', user);

  if (!user.isOnboarded) {
    console.log('Home page - Redirecting to onboarding');
    return <Redirect href="/(app)/onboarding/onboarding-stepper" />
  }


  const filteredStores = stores?.filter(store => {
    const matchesSearch = store.organization.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = store.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const renderStoreCard = (store: any) => {
    // Use actual metrics from the store data
    const totalDebt = store.totalDebt || 0
    const totalOrderValue = store.totalOrderValue || 0
    const totalOrders = store.totalOrders || 0
    const unpaidInvoices = store.unpaidInvoices || 0
    
    // Get status information
    const getStatusInfo = (status: string) => {
      switch (status) {
        case 'approved':
          return { text: t('Active'), color: '#16a34a', bgColor: '#dcfce7', textColor: '#15803d' }
        case 'pending':
          return { text: t('Pending'), color: '#f59e0b', bgColor: '#fef3c7', textColor: '#d97706' }
        case 'rejected':
          return { text: t('Rejected'), color: '#dc2626', bgColor: '#fee2e2', textColor: '#dc2626' }
        case 'blocked':
          return { text: t('Blocked'), color: '#6b7280', bgColor: '#f3f4f6', textColor: '#6b7280' }
        default:
          return { text: 'Unknown', color: '#6b7280', bgColor: '#f3f4f6', textColor: '#6b7280' }
      }
    }
    
    const statusInfo = getStatusInfo(store.status)
    const isApproved = store.status === 'approved'
    
    // Get organization location
    const location = store.organization.location?.address || 'Location not specified'
    const cityCountry = location.split(',').slice(-2).join(',').trim() || 'Unknown Location'

    return (
      <TouchableOpacity
        key={store.organization.id}
        className={`mb-3 bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 ${!isApproved ? 'opacity-60' : ''}`}
        onPress={() => isApproved ? safePush( {pathname: `/(app)/store/${store.organization.id}`, params: { store: JSON.stringify(store) }}) : null}
        disabled={!isApproved}
      >
        {/* Header Section */}
        <View className="p-4 border-b border-gray-100">
          <View className="flex-row items-center">
            {/* Organization Logo */}
            <View className="w-12 h-12 bg-gray-100 rounded-lg mr-3 items-center justify-center overflow-hidden">
              {store?.organization?.logoUrl ? (
                <Image
                  source={{ uri: store.organization.logoUrl }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : (
                <Text className="font-bold text-gray-600 text-lg">{store.organization.name.charAt(0)}</Text>
              )}
            </View>

            {/* Store Info */}
            <View className="flex-1">
              {/* Name and Status */}
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-base font-semibold text-gray-900 flex-1" numberOfLines={1}>
                  {store.organization.name}
                </Text>
                
                {/* Status Badge */}
                <View style={{ 
                  paddingHorizontal: 12, 
                  paddingVertical: 4, 
                  borderRadius: 20, 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  marginLeft: 8,
                  backgroundColor: '#1A2A4F'
                }}>
                  <View style={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: 4, 
                    marginRight: 4,
                    backgroundColor: '#48C6A8'
                  }} />
                  <Text style={{ 
                    fontSize: 12, 
                    fontWeight: '500',
                    color: 'white'
                  }}>
                    {statusInfo.text}
                  </Text>
                </View>

                {/* Menu Icon */}
                <TouchableOpacity className="ml-2 p-1">
                  <Feather name="more-vertical" size={16} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Location */}
              <View className="bg-gray-100 px-3 py-1 rounded-full self-start">
                <Text className="text-xs text-gray-600" numberOfLines={1}>
                  {cityCountry}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Body Section - KPI Cards */}
        <View className="p-4">
          <View className="flex-row flex-wrap justify-between">
            {/* Total Value KPI */}
            <View className="bg-gray-50 rounded-lg p-3 mb-2" style={{ width: '48%' }}>
              <View className="flex-row items-center mb-1">
                <Feather name="dollar-sign" size={14} color="#48C6A8" />
                <Text className="text-xs text-gray-600 ml-2 font-medium">
{t("Total Value")}
                </Text>
              </View>
              <Text className="text-lg font-bold text-gray-900">
                {totalOrderValue.toFixed(2)} TND
              </Text>
            </View>

            {/* Total Orders KPI */}
            <View className="bg-gray-50 rounded-lg p-3 mb-2" style={{ width: '48%' }}>
              <View className="flex-row items-center mb-1">
                <Feather name="shopping-bag" size={14} color="#48C6A8" />
                <Text className="text-xs text-gray-600 ml-2 font-medium">
{t("Total Orders")}
                </Text>
              </View>
              <Text className="text-lg font-bold text-gray-900">
                {totalOrders}
              </Text>
            </View>

            {/* Total Debt KPI */}
            <View className="bg-gray-50 rounded-lg p-3" style={{ width: '48%' }}>
              <View className="flex-row items-center mb-1">
                <Feather name="credit-card" size={14} color="#48C6A8" />
                <Text className="text-xs text-gray-600 ml-2 font-medium">
{t("Total Debt")}
                </Text>
              </View>
              <Text className="text-lg font-bold text-gray-900">
                {totalDebt.toFixed(2)} TND
              </Text>
            </View>

            {/* Unpaid Invoices KPI */}
            <View className="bg-gray-50 rounded-lg p-3" style={{ width: '48%' }}>
              <View className="flex-row items-center mb-1">
                <Feather name="file-text" size={14} color="#48C6A8" />
                <Text className="text-xs text-gray-600 ml-2 font-medium">
{t("Unpaid Invoices")}
                </Text>
              </View>
              <Text className="text-lg font-bold text-gray-900">
                {unpaidInvoices}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100" >
      <StatusBar barStyle="light-content" backgroundColor="#1A2A4F" />

      {/* Header */}
      <View className="px-6" style={{ 
        backgroundColor: '#1A2A4F',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    
        minHeight: 180,
        paddingTop: 0
      }}>
        {/* User Info Section */}
        <View className="flex-row items-center justify-between mb-6 pt-4">
          {/* User Info */}
          <View className="flex-row items-center flex-1">
            {/* User Avatar */}
            <View className="w-12 h-12 bg-gray-200 rounded-full mr-3 items-center justify-center overflow-hidden border-2 border-gray-300">
              {user?.profileImageUrl ? (
                <Image
                  source={{ uri: user.profileImageUrl }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : (
                <Text className="font-bold text-gray-600 text-lg">
                  {user?.firstName?.charAt(0) || user?.phone?.charAt(0) || 'U'}
                </Text>
              )}
            </View>
            
            {/* User Details */}
            <View className="flex-1">
              <Text className="text-base font-semibold text-white" numberOfLines={1}>
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user?.phone || 'User'
                }
              </Text>
              <Text className="text-sm text-gray-300" numberOfLines={1}>
                {formatPhoneNumber(user?.phone || '')}
              </Text>
            </View>
          </View>

          {/* QR Scanner Button */}
          <TouchableOpacity 
            onPress={() => setShowQRScanner(true)} 
            className="bg-[#48C6A8] w-10 h-10 rounded-lg items-center justify-center"
          >
            <Feather name="maximize" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-lg px-4 py-1 mb-3">
          <Feather name="search" size={20} color="gray" />
          <TextInput
            className="flex-1 ml-2 text-base"
            placeholder={t("Search")}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={"gray"}
          />
        </View>

        {/* Filter Tabs */}
        <View className="flex-row">
          {[
            { key: 'approved', label: t('Active'), color: '#16a34a' },
            { key: 'pending', label: t('Pending'), color: '#f59e0b' },
            { key: 'rejected', label: t('Rejected'), color: '#dc2626' },
            { key: 'blocked', label: t('Blocked'), color: '#6b7280' }
          ].map((status) => (
            <TouchableOpacity
              key={status.key}
              className={`flex-1 mr-1 px-2 py-2 rounded-md border ${
                selectedStatus === status.key 
                  ? 'bg-white border-white' 
                  : 'bg-transparent border-gray-400'
              }`}
              onPress={() => setSelectedStatus(status.key)}
            >
              <View className="flex-row items-center justify-center">
                <View 
                  className="w-1.5 h-1.5 rounded-full mr-1.5"
                  style={{ backgroundColor: status.color }}
                />
                <Text className={`text-xs font-medium ${
                  selectedStatus === status.key ? 'text-gray-900' : 'text-white'
                }`}>
                  {status.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>


      {/* Content */}
      <ScrollView className="flex-1 px-4" style={{ marginTop: -20 }} contentContainerStyle={{ paddingBottom: 100, paddingTop: 40 }}>
        {isLoading ? (
          <View>
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
          <View>
            {filteredStores.map(renderStoreCard)}
          </View>
        )}
      </ScrollView>


      {/* QR Code Scanner Modal */}
      <QRCodeScanner
        visible={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onSuccess={(organizationId) => {
          console.log('Access requested for organization:', organizationId);
          // Optionally refresh the stores list to show new organizations
          refetch();
        }}
      />
    </SafeAreaView>
  )
}