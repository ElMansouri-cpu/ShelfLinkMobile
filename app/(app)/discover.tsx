import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  TextInput,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
  Modal,
  Animated,
  PanResponder,
  FlatList,
} from 'react-native'
import { Feather, MaterialIcons, FontAwesome } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useLocation } from '../../context/LocationContext'
import { useRouter } from 'expo-router'
import * as Location from 'expo-location'
import Mapbox from '@rnmapbox/maps'
import Constants from 'expo-constants'
import { api } from '../../lib/api'
import { useRequestAccess } from '../../services/organization-service/organization.query'

const { width, height } = Dimensions.get('window')

interface Organization {
  id: string
  name: string
  phone: string
  email: string | null
  address: string | null
  location: {
    lat: number
    lng: number
    address: string
  }
  logoUrl: string | null
  bannerUrl: string | null
  productsCount: number
  categoriesCount?: number
  brandsCount?: number
  ordersCount: number
  distance: number
  hasRelationship: boolean
  relationshipStatus?: 'approved' | 'pending' | 'rejected' | 'blocked'
  preview: {
    products: Array<{
      id: string
      name: string
      image: string
      barcode: string | null
    }>
    categories: Array<{
      id: string
      name: string
      image: string
      productsCount: number
    }>
    brands: Array<{
      id: string
      name: string
      logo: string
      productsCount: number
    }>
  }
}

interface NearbyOrganizationsResponse {
  organizations: Organization[]
  total: number
  searchLocation: {
    lat: number
    lng: number
  }
  radius: number
  message: string
}

// Hotel Style Card Component
const HotelStyleCard = ({ organization, isSelected, onViewDetails, onSelect }) => {
  const { t } = useTranslation()
  
  const formatPhoneNumber = (phone) => {
    if (!phone || phone === 'N/A') return 'N/A'
    const digits = phone.replace(/\D/g, '')
    if (digits.length >= 8) {
      return `+216 ${digits.slice(-8, -6)} ${digits.slice(-6, -3)} ${digits.slice(-3)}`
    }
    return phone
  }

  const phone = formatPhoneNumber(organization.phone || 'N/A')
  const cityCountry = organization.address?.split(',').slice(-2).join(',').trim() || 'Unknown Location'

  const getStatusInfo = (status) => {
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
        return { text: t('Available'), color: '#3b82f6', bgColor: '#dbeafe', textColor: '#1d4ed8' }
    }
  }

  const statusInfo = getStatusInfo(organization.relationshipStatus)

  return (
    <TouchableOpacity 
      style={[styles.hotelCard, isSelected && styles.selectedHotelCard]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      <View style={styles.hotelCardContent}>
        {/* Hotel Image */}
        <View style={styles.hotelImageContainer}>
          {organization.logoUrl ? (
            <Image
              source={{ uri: organization.logoUrl }}
              style={styles.hotelImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.hotelImagePlaceholder}>
              <Text style={styles.hotelImagePlaceholderText}>{organization.name.charAt(0)}</Text>
            </View>
          )}
          
          {/* Heart Icon */}
          <TouchableOpacity style={styles.heartIcon}>
            <Feather name="heart" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Hotel Info */}
        <View style={styles.hotelInfo}>
          {/* Hotel Name */}
          <Text style={styles.hotelName} numberOfLines={1}>
            {organization.name}
          </Text>

          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
            <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
            <Text style={[styles.statusText, { color: statusInfo.textColor }]}>
              {statusInfo.text}
            </Text>
          </View>

          {/* Distance */}
          <Text style={styles.distance}>
            {organization.distance.toFixed(1)} km away
          </Text>

          {/* Products Count */}
          <Text style={styles.productsCount}>
            {organization.productsCount} products
          </Text>

          {/* Request Button or Status */}
          {((!organization.hasRelationship && !organization.relationshipStatus) || organization.relationshipStatus === 'rejected') ? (
            <TouchableOpacity
              style={styles.requestButton}
              onPress={onViewDetails}
            >
              <Text style={styles.requestButtonText}>
                {t('Send Request')}
              </Text>
            </TouchableOpacity>
          ) : organization.relationshipStatus === 'approved' ? (
            <TouchableOpacity
              style={[styles.requestButton, { backgroundColor: '#48C6A8' }]}
              onPress={onViewDetails}
            >
              <Text style={styles.requestButtonText}>
                View Details
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.statusContainer}>
              <Text style={styles.statusMessage}>
                {organization.relationshipStatus === 'pending' ? t('Request Pending') :
                 organization.relationshipStatus === 'blocked' ? t('Access Blocked') : t('Connected')}
              </Text>
            </View>
          )}
        </View>

        {/* Distance Badge */}
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>
            {organization.distance.toFixed(1)}km
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

// Store Card Component
const StoreCard = ({ organization, isSelected, onViewDetails, onSelect, onSwipeLeft, onSwipeRight }) => {
  const { t } = useTranslation()
  const translateX = useRef(new Animated.Value(0)).current
  
  const formatPhoneNumber = (phone) => {
    if (!phone || phone === 'N/A') return 'N/A'
    const digits = phone.replace(/\D/g, '')
    if (digits.length >= 8) {
      return `+216 ${digits.slice(-8, -6)} ${digits.slice(-6, -3)} ${digits.slice(-3)}`
    }
    return phone
  }

  const phone = formatPhoneNumber(organization.phone || 'N/A')
  const cityCountry = organization.address?.split(',').slice(-2).join(',').trim() || 'Unknown Location'

  const getStatusInfo = (status) => {
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
        return { text: t('Available'), color: '#3b82f6', bgColor: '#dbeafe', textColor: '#1d4ed8' }
    }
  }

  const statusInfo = getStatusInfo(organization.relationshipStatus)

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 10
    },
    onPanResponderMove: (_, gestureState) => {
      translateX.setValue(gestureState.dx)
    },
    onPanResponderRelease: (_, gestureState) => {
      if (Math.abs(gestureState.dx) > 50) {
        // Swipe to navigate
        if (gestureState.dx > 0) {
          // Swipe right - go to previous organization
          onSwipeRight()
        } else {
          // Swipe left - go to next organization
          onSwipeLeft()
        }
      }
      
      // Return to original position
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start()
    },
  })

  return (
    <Animated.View 
      style={[
        styles.hotelCard,
        isSelected && styles.selectedHotelCard,
        { transform: [{ translateX }] }
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity 
        style={{ flex: 1 }}
        onPress={onSelect}
        activeOpacity={0.7}
      >
        <View style={{ padding: 12 }}>
          {/* Top Row: Logo, Name and Status */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              {/* Organization Logo */}
              <View style={{ width: 32, height: 32, backgroundColor: '#f3f4f6', borderRadius: 6, marginRight: 8, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {organization.logoUrl ? (
                  <Image
                    source={{ uri: organization.logoUrl }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={{ fontWeight: 'bold', color: '#6b7280', fontSize: 14 }}>{organization.name.charAt(0)}</Text>
                )}
              </View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', flex: 1 }} numberOfLines={1}>
                {organization.name}
              </Text>
            </View>
            
            {/* Status Badge - Minimal */}
            <View style={{ 
              paddingHorizontal: 8, 
              paddingVertical: 2, 
              borderRadius: 12, 
              flexDirection: 'row', 
              alignItems: 'center', 
              marginLeft: 8,
              backgroundColor: statusInfo.bgColor
            }}>
              <View style={{ 
                width: 6, 
                height: 6, 
                borderRadius: 3, 
                marginRight: 4,
                backgroundColor: statusInfo.color
              }} />
              <Text style={{ 
                fontSize: 10, 
                fontWeight: '500',
                color: statusInfo.textColor
              }}>
                {statusInfo.text}
              </Text>
            </View>
          </View>

          {/* Contact and Location Info - Compact */}
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>
              {phone} • {organization.distance.toFixed(1)} km
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 11, color: '#9ca3af', flex: 1 }} numberOfLines={1}>
                {cityCountry}
              </Text>
              <Text style={{ fontSize: 11, color: '#6b7280', marginLeft: 8 }}>
                {organization.productsCount} products • {organization.categoriesCount || 0} categories
              </Text>
            </View>
          </View>

          {/* Request Button - Only show for organizations that can receive requests */}
          {((!organization.hasRelationship && !organization.relationshipStatus) || organization.relationshipStatus === 'rejected') && (
            <TouchableOpacity
              style={[
                styles.requestButton, 
                { marginTop: 8, paddingVertical: 8, paddingHorizontal: 16 }
              ]}
              onPress={onViewDetails}
            >
              <Text style={[styles.requestButtonText, { fontSize: 12 }]}>
                {t('Send Request')}
              </Text>
            </TouchableOpacity>
          )}

          {/* Show relationship status for organizations with existing relationships */}
          {organization.hasRelationship && (
            <View style={{ marginTop: 8, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#f3f4f6', borderRadius: 8 }}>
              <Text style={{ fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
                {organization.relationshipStatus === 'approved' ? t('Already Connected') :
                 organization.relationshipStatus === 'pending' ? t('Request Pending') :
                 organization.relationshipStatus === 'rejected' ? t('Request Rejected') :
                 organization.relationshipStatus === 'blocked' ? t('Access Blocked') : t('Relationship Status')}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

export default function DiscoverScreen() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { location: userLocation, loading: locationLoading } = useLocation()
  const router = useRouter()
  const { mutate: requestAccess, isPending: isRequestingAccess } = useRequestAccess()
  const [searchQuery, setSearchQuery] = useState('')
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null)
  const [showMap, setShowMap] = useState(true)
  const [selectedMapOrganization, setSelectedMapOrganization] = useState<Organization | null>(null)
  const [requestingOrganizationId, setRequestingOrganizationId] = useState<string | null>(null)
  const [currentStoreIndex, setCurrentStoreIndex] = useState(0)
  const [selectedLocationCenter, setSelectedLocationCenter] = useState<[number, number] | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const mapRef = useRef<Mapbox.MapView>(null)
  const flatListRef = useRef<FlatList>(null)
  const [isMapboxInitialized, setIsMapboxInitialized] = useState(false)
  const [shouldRenderMap, setShouldRenderMap] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [mapKey, setMapKey] = useState(0)

  // Navigation functions
  const goToNextOrganization = () => {
    if (organizations.length > 0) {
      const nextIndex = currentStoreIndex < organizations.length - 1 ? currentStoreIndex + 1 : 0
      const nextOrg = organizations[nextIndex]
      setCurrentStoreIndex(nextIndex)
      setSelectedMapOrganization(nextOrg)
      
      // Center map on new organization
      if (nextOrg.location) {
        setSelectedLocationCenter([nextOrg.location.lng, nextOrg.location.lat])
      }
      
      // Scroll to the selected card
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({ index: nextIndex, animated: true })
      }
    }
  }

  const goToPreviousOrganization = () => {
    if (organizations.length > 0) {
      const prevIndex = currentStoreIndex > 0 ? currentStoreIndex - 1 : organizations.length - 1
      const prevOrg = organizations[prevIndex]
      setCurrentStoreIndex(prevIndex)
      setSelectedMapOrganization(prevOrg)
      
      // Center map on new organization
      if (prevOrg.location) {
        setSelectedLocationCenter([prevOrg.location.lng, prevOrg.location.lat])
      }
      
      // Scroll to the selected card
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({ index: prevIndex, animated: true })
      }
    }
  }

  // Retry map initialization
  const retryMapInitialization = () => {
    setMapError(null)
    setMapKey(prev => prev + 1) // Force remount
    setTimeout(() => {
      setShouldRenderMap(true)
    }, 500)
  }

  // Initialize Mapbox
  useEffect(() => {
    let isMounted = true
    
    const initializeMapbox = async () => {
      try {
        // Check if we're in production build
        const isProductionBuild = !__DEV__
        
        // Set Mapbox token for both development and production
        const token = Constants.expoConfig?.extra?.mapboxAccessToken || 'pk.eyJ1IjoieGdoYXNlMTQiLCJhIjoiY21mNDhxMXRxMDB3eTJrczRwZTR5dnlydSJ9.-iWoOkmS7QXZqhqwTMLAAA'
        if (token) {
          Mapbox.setAccessToken(token)
        }
        
        setIsMapboxInitialized(true)
        setMapError(null)
        
        // Longer delay for production builds to ensure plugin initialization
        const delay = isProductionBuild ? 2000 : 500
        
        setTimeout(() => {
          if (isMounted) {
            setShouldRenderMap(true)
          }
        }, delay)
      } catch (error) {
        if (isMounted) {
          setMapError('Failed to initialize Mapbox')
          console.error('Failed to initialize Mapbox:', error)
        }
      }
    }

    initializeMapbox()

    return () => {
      isMounted = false
    }
  }, [])

  // Initialize selectedMapOrganization when organizations are loaded
  useEffect(() => {
    if (organizations.length > 0 && !selectedMapOrganization) {
      const firstOrg = organizations[0]
      setSelectedMapOrganization(firstOrg)
      setCurrentStoreIndex(0)
      
      // Set map center to first organization
      if (firstOrg.location) {
        setSelectedLocationCenter([firstOrg.location.lng, firstOrg.location.lat])
      }
    }
  }, [organizations, selectedMapOrganization])

  // Fetch nearby organizations when location is available
  useEffect(() => {
    if (userLocation) {
      console.log('Location available, fetching organizations...', userLocation)
      fetchNearbyOrganizations()
    }
  }, [userLocation])

  const fetchNearbyOrganizations = async () => {
    if (!userLocation) {
      console.log('No user location available, skipping API call')
      return
    }

    try {
      console.log('Fetching nearby organizations for location:', userLocation)
      setLoading(true)
      setError(null)

      const response = await api.get('/organization/explore/nearby', {
        params: {
          lat: userLocation.lat,
          lng: userLocation.lng,
          radius: 25,
        },
      })

      console.log('API response received:', response.data)
      const data: NearbyOrganizationsResponse = response.data
      setOrganizations(data.organizations)
      console.log('Organizations set:', data.organizations.length, 'organizations found')
    } catch (error) {
      console.error('Error fetching organizations:', error)
      setError(t('Failed to load organizations. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  // Check if organization already has a pending request
  const hasPendingRequest = (organizationId: string) => {
    // This would typically check against a list of pending requests
    // For now, we'll assume organizations with certain patterns have pending requests
    // In a real implementation, you'd check against your pending requests state
    return false // Placeholder - implement based on your pending requests logic
  }

  const handleSendRequest = (organization: Organization) => {
    setRequestingOrganizationId(organization.id)
    
    requestAccess(
      {
        organizationId: organization.id,
        requestMessage: `I would like to become a client of ${organization.name}. Please consider my request.`,
      },
      {
        onSuccess: (response) => {
          setRequestingOrganizationId(null)
          Alert.alert(
            t('Request Sent'),
            response.message || t('Your request to become a client has been sent to {{organizationName}}.', { organizationName: organization.name })
          )
        },
        onError: (error) => {
          setRequestingOrganizationId(null)
          console.error('Error sending request:', error)
          Alert.alert(t('Error'), t('Failed to send request. Please try again.'))
        },
      }
    )
  }

  const renderOrganizationCard = (organization: Organization) => {
    // Get status information based on relationship status
    const getStatusInfo = (status?: string) => {
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
          return { text: t('Available'), color: '#3b82f6', bgColor: '#dbeafe', textColor: '#1d4ed8' }
      }
    }
    
    const statusInfo = getStatusInfo(organization.relationshipStatus)
    
    // Get organization location
    const location = organization.location?.address || 'Location not specified'
    const cityCountry = location.split(',').slice(-2).join(',').trim() || 'Unknown Location'
    
    // Get organization statistics
    const distance = organization.distance
    const productCount = organization.productsCount || 0
    const categoryCount = organization.categoriesCount || 0
    
    // Format phone number
    const formatPhoneNumber = (phone: string) => {
      if (!phone || phone === 'N/A') return 'N/A'
      // Remove any non-digit characters
      const digits = phone.replace(/\D/g, '')
      // Format as +216 XX XXX XXX
      if (digits.length >= 8) {
        return `+216 ${digits.slice(-8, -6)} ${digits.slice(-6, -3)} ${digits.slice(-3)}`
      }
      return phone
    }
    const phone = formatPhoneNumber(organization.phone || 'N/A')

    return (
      <TouchableOpacity
        key={organization.id}
        style={[styles.organizationCard, { padding: 12 }]}
        onPress={() => setSelectedOrganization(organization)}
      >
        <View>
          {/* Top Row: Logo, Name and Status */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              {/* Organization Logo */}
              <View style={{ width: 32, height: 32, backgroundColor: '#f3f4f6', borderRadius: 6, marginRight: 8, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {organization.logoUrl ? (
                  <Image
                    source={{ uri: organization.logoUrl }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={{ fontWeight: 'bold', color: '#6b7280', fontSize: 14 }}>{organization.name.charAt(0)}</Text>
                )}
              </View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', flex: 1 }} numberOfLines={1}>
                {organization.name}
              </Text>
            </View>
              
              {/* Status Badge - Minimal */}
              <View style={{ 
                paddingHorizontal: 8, 
                paddingVertical: 2, 
                borderRadius: 12, 
                flexDirection: 'row', 
                alignItems: 'center', 
                marginLeft: 8,
                backgroundColor: statusInfo.bgColor
              }}>
                <View style={{ 
                  width: 6, 
                  height: 6, 
                  borderRadius: 3, 
                  marginRight: 4,
                  backgroundColor: statusInfo.color
                }} />
                <Text style={{ 
                  fontSize: 10, 
                  fontWeight: '500',
                  color: statusInfo.textColor
                }}>
                  {statusInfo.text}
                </Text>
              </View>

              {/* Menu Icon */}
              <TouchableOpacity style={{ marginLeft: 8, padding: 4 }}>
                <Feather name="more-vertical" size={16} color="#666" />
              </TouchableOpacity>
            </View>

          {/* Contact and Location Info - Compact */}
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>
              {phone} • {distance.toFixed(1)} km
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 11, color: '#9ca3af', flex: 1 }} numberOfLines={1}>
                {cityCountry}
              </Text>
              <Text style={{ fontSize: 11, color: '#6b7280', marginLeft: 8 }}>
                {productCount} products • {categoryCount} categories
              </Text>
            </View>
          </View>

          {/* Request Button - Only show for organizations that can receive requests */}
          {((!organization.hasRelationship && !organization.relationshipStatus) || organization.relationshipStatus === 'rejected') && (
            <TouchableOpacity
              style={[
                styles.requestButton, 
                { marginTop: 8, paddingVertical: 8, paddingHorizontal: 16 },
                (isRequestingAccess && requestingOrganizationId === organization.id) && styles.disabledButton
              ]}
              onPress={() => handleSendRequest(organization)}
              disabled={isRequestingAccess && requestingOrganizationId === organization.id}
            >
              <Text style={[styles.requestButtonText, { fontSize: 12 }]}>
                {(isRequestingAccess && requestingOrganizationId === organization.id) 
                  ? t('Sending...') 
                  : t('Send Request')
                }
              </Text>
            </TouchableOpacity>
          )}

          {/* Show relationship status for organizations with existing relationships */}
          {organization.hasRelationship && (
            <View style={{ marginTop: 8, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#f3f4f6', borderRadius: 8 }}>
              <Text style={{ fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
                {organization.relationshipStatus === 'approved' ? t('Already Connected') :
                 organization.relationshipStatus === 'pending' ? t('Request Pending') :
                 organization.relationshipStatus === 'rejected' ? t('Request Rejected') :
                 organization.relationshipStatus === 'blocked' ? t('Access Blocked') : t('Relationship Status')}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  const renderMapView = () => {
    const mapCenter: [number, number] = userLocation 
      ? [userLocation.lng, userLocation.lat] 
      : [10.1815, 36.8065] // [longitude, latitude] for Mapbox

    return (
      <View style={styles.mapContainer}>
        {isMapboxInitialized && shouldRenderMap && !mapError ? (
          <Mapbox.MapView
            key={`map-${mapKey}`}
            ref={mapRef}
            style={styles.map}
            styleURL="mapbox://styles/mapbox/light-v11"
            onDidFinishLoadingMap={() => {
              console.log('Discover map loaded successfully')
            }}
            onDidFailLoadingMap={() => {
              console.error('Discover map failed to load')
              setMapError('Map failed to load - check your internet connection')
            }}
          >
            <Mapbox.Camera
              centerCoordinate={selectedLocationCenter || mapCenter}
              zoomLevel={selectedLocationCenter ? 15 : 12}
              animationMode="flyTo"
              animationDuration={1000}
            />
            {organizations.map((org) => {
              const isSelected = selectedMapOrganization?.id === org.id
              const isActive = org.relationshipStatus === 'approved'
              const isPending = org.relationshipStatus === 'pending'
              
              return (
                <Mapbox.PointAnnotation
                  key={org.id}
                  id={org.id}
                  coordinate={[org.location.lng, org.location.lat]}
                  title={org.name}
                  onSelected={() => {
                    const index = organizations.findIndex(o => o.id === org.id)
                    setSelectedMapOrganization(org)
                    setCurrentStoreIndex(index)
                    
                    // Scroll to the selected organization
                    if (flatListRef.current && index >= 0) {
                      flatListRef.current.scrollToIndex({ index, animated: true })
                    }
                    
                    // Center map on selected organization
                    if (org.location) {
                      setSelectedLocationCenter([org.location.lng, org.location.lat])
                    }
                  }}
                >
                  <View style={[
                    styles.mapPin,
                    isSelected && styles.mapPinSelected,
                    isActive && styles.mapPinActive,
                    isPending && styles.mapPinPending
                  ]}>
                    {org.logoUrl ? (
                      <Image
                        source={{ uri: org.logoUrl }}
                        style={[
                          styles.mapPinImage,
                          isSelected && styles.mapPinImageSelected
                        ]}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.mapPinFallback}>
                        <Text style={[
                          styles.mapPinFallbackText,
                          isSelected && styles.mapPinFallbackTextSelected
                        ]}>
                          {org.name.charAt(0)}
                        </Text>
                      </View>
                    )}
                  </View>
                </Mapbox.PointAnnotation>
              )
            })}
          </Mapbox.MapView>
        ) : (
          <TouchableOpacity 
            style={styles.mapFallback}
            onPress={() => {
              if (mapError) {
                retryMapInitialization()
              } else {
                setShowMap(false)
              }
            }}
          >
            <Feather name="map" size={48} color="#48C6A8" />
            <Text style={styles.mapFallbackTitle}>
              {mapError ? t('Map error - tap to retry') : t('Loading map...')}
            </Text>
            <Text style={styles.mapFallbackSubtitle}>
              {mapError ? t('Tap to retry') : t('Please wait')}
            </Text>
            {mapError && (
              <>
                <Text style={styles.mapErrorDetails}>
                  {t('If the problem persists, try switching to list view')}
                </Text>
                <TouchableOpacity 
                  style={styles.switchToListButton}
                  onPress={() => setShowMap(false)}
                >
                  <Text style={styles.switchToListButtonText}>
                    {t('Switch to List View')}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        )}
        
        {/* Floating Status Filter Tabs */}
        <View style={styles.floatingFilterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterTabsContent}
          >
            <TouchableOpacity
              style={[
                styles.filterTab,
                !statusFilter && styles.filterTabActive
              ]}
              onPress={() => setStatusFilter(null)}
            >
              <Text style={[
                styles.filterTabText,
                !statusFilter && styles.filterTabTextActive
              ]}>
                All
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterTab,
                statusFilter === 'available' && styles.filterTabActive
              ]}
              onPress={() => setStatusFilter('available')}
            >
              <Text style={[
                styles.filterTabText,
                statusFilter === 'available' && styles.filterTabTextActive
              ]}>
                Available
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterTab,
                statusFilter === 'approved' && styles.filterTabActive
              ]}
              onPress={() => setStatusFilter('approved')}
            >
              <Text style={[
                styles.filterTabText,
                statusFilter === 'approved' && styles.filterTabTextActive
              ]}>
{t('Active')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterTab,
                statusFilter === 'pending' && styles.filterTabActive
              ]}
              onPress={() => setStatusFilter('pending')}
            >
              <Text style={[
                styles.filterTabText,
                statusFilter === 'pending' && styles.filterTabTextActive
              ]}>
{t('Pending')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* List View Toggle Button */}
        <TouchableOpacity
          style={styles.listViewToggle}
          onPress={() => setShowMap(!showMap)}
        >
          <Feather name="list" size={20} color="#48C6A8" />
        </TouchableOpacity>

        {/* Map Organization Card */}
        {filteredOrganizations.length > 0 && (
          <View style={styles.storeCardsContainer}>
            <FlatList
              ref={flatListRef}
              data={filteredOrganizations}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={currentStoreIndex}
              getItemLayout={(data, index) => ({
                length: Dimensions.get('window').width - 40,
                offset: (Dimensions.get('window').width - 40) * index,
                index,
              })}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / (Dimensions.get('window').width - 40))
                if (index !== currentStoreIndex && filteredOrganizations[index]) {
                  setCurrentStoreIndex(index)
                  const newOrg = filteredOrganizations[index]
                  setSelectedMapOrganization(newOrg)
                  
                  // Center map on new organization
                  if (newOrg.location) {
                    setSelectedLocationCenter([newOrg.location.lng, newOrg.location.lat])
                  }
                }
              }}
              renderItem={({ item: organization, index }) => (
                <View style={styles.hotelCardContainer}>
                  <HotelStyleCard
                    organization={organization}
                    isSelected={selectedMapOrganization?.id === organization.id}
                    onViewDetails={() => {
                      setSelectedOrganization(organization)
                    }}
                    onSelect={() => {
                      setSelectedMapOrganization(organization)
                      setCurrentStoreIndex(index)
                      // Center map on selected organization
                      if (organization.location) {
                        setSelectedLocationCenter([organization.location.lng, organization.location.lat])
                      }
                    }}
                  />
                </View>
              )}
              keyExtractor={(item) => item.id}
            />
          </View>
        )}
      </View>
    )
  }

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = !statusFilter || org.relationshipStatus === statusFilter || 
      (statusFilter === 'available' && !org.hasRelationship && !org.relationshipStatus)
    return matchesSearch && matchesStatus
  })

  return (
    <SafeAreaView style={styles.container}>

      {/* Content */}
      {showMap ? (
        renderMapView()
      ) : (
        <View style={styles.listContainer}>
          {/* Floating Status Filter Tabs for List View */}
          <View style={styles.listFloatingFilterContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterTabsContent}
            >
              <TouchableOpacity
                style={[
                  styles.filterTab,
                  !statusFilter && styles.filterTabActive
                ]}
                onPress={() => setStatusFilter(null)}
              >
                <Text style={[
                  styles.filterTabText,
                  !statusFilter && styles.filterTabTextActive
                ]}>
                  All
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.filterTab,
                  statusFilter === 'available' && styles.filterTabActive
                ]}
                onPress={() => setStatusFilter('available')}
              >
                <Text style={[
                  styles.filterTabText,
                  statusFilter === 'available' && styles.filterTabTextActive
                ]}>
                  Available
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.filterTab,
                  statusFilter === 'approved' && styles.filterTabActive
                ]}
                onPress={() => setStatusFilter('approved')}
              >
                <Text style={[
                  styles.filterTabText,
                  statusFilter === 'approved' && styles.filterTabTextActive
                ]}>
  {t('Active')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.filterTab,
                  statusFilter === 'pending' && styles.filterTabActive
                ]}
                onPress={() => setStatusFilter('pending')}
              >
                <Text style={[
                  styles.filterTabText,
                  statusFilter === 'pending' && styles.filterTabTextActive
                ]}>
  {t('Pending')}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* List View Header */}
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderTitle}>{t("Organizations")}</Text>
            <TouchableOpacity
              style={styles.listMapToggle}
              onPress={() => setShowMap(!showMap)}
            >
              <Feather name="map" size={20} color="#48C6A8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#48C6A8" />
              <Text style={styles.loadingText}>{t('Loading organizations...')}</Text>
            </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={48} color="#ef4444" />
            <Text style={styles.errorTitle}>{t('Error')}</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={() => {
                if (userLocation) {
                  fetchNearbyOrganizations()
                } else {
                  // Location will be fetched by the context
                  console.log('Waiting for location from context...')
                }
              }}
            >
              <Text style={styles.retryButtonText}>{t('Retry')}</Text>
            </TouchableOpacity>
          </View>
          ) : !userLocation ? (
            <View style={styles.emptyContainer}>
              <Feather name="map-pin" size={48} color="#9ca3af" />
              <Text style={styles.emptyTitle}>{t('Location Required')}</Text>
              <Text style={styles.emptyMessage}>
                {t('We need your location to find nearby organizations. Please enable location services.')}
              </Text>
              <TouchableOpacity 
                style={styles.retryButton} 
              onPress={() => {
                // Location will be fetched by the context
                console.log('Waiting for location from context...')
              }}
              >
                <Text style={styles.retryButtonText}>{t('Enable Location')}</Text>
              </TouchableOpacity>
            </View>
          ) : filteredOrganizations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="search" size={48} color="#9ca3af" />
              <Text style={styles.emptyTitle}>{t('No organizations found')}</Text>
              <Text style={styles.emptyMessage}>
                {searchQuery ? t('Try adjusting your search terms') : t('No organizations found in your area')}
              </Text>
            </View>
          ) : (
            <View style={styles.organizationsList}>
              {filteredOrganizations.map(renderOrganizationCard)}
            </View>
          )}
          </ScrollView>
        </View>
      )}

      {/* Selected Organization Modal */}
      <Modal
        visible={!!selectedOrganization}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedOrganization(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {selectedOrganization && (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedOrganization.name}</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedOrganization(null)}
                >
                  <Feather name="x" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Store Banner */}
                {selectedOrganization.bannerUrl && (
                  <Image
                    source={{ uri: selectedOrganization.bannerUrl }}
                    style={styles.modalBanner}
                    resizeMode="cover"
                  />
                )}
                
                <View style={styles.modalInfo}>
                  {/* Store Logo and Basic Info */}
                  <View style={styles.storeHeader}>
                    <View style={styles.storeLogoContainer}>
                      {selectedOrganization.logoUrl ? (
                        <Image
                          source={{ uri: selectedOrganization.logoUrl }}
                          style={styles.storeLogo}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.storeLogoPlaceholder}>
                          <Text style={styles.storeLogoText}>{selectedOrganization.name.charAt(0)}</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.storeBasicInfo}>
                      <Text style={styles.storeName}>{selectedOrganization.name}</Text>
                      <View style={styles.statusContainer}>
                        <View style={[
                          styles.statusDot, 
                          { backgroundColor: selectedOrganization.relationshipStatus === 'approved' ? '#16a34a' : 
                                           selectedOrganization.relationshipStatus === 'pending' ? '#f59e0b' : '#3b82f6' }
                        ]} />
                        <Text style={styles.statusText}>
                          {selectedOrganization.relationshipStatus === 'approved' ? t('Active') :
                           selectedOrganization.relationshipStatus === 'pending' ? t('Pending') : t('Available')}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Contact Information */}
                  <View style={styles.contactSection}>
                    <Text style={styles.sectionTitle}>Contact Information</Text>
                    <View style={styles.contactItem}>
                      <Feather name="phone" size={16} color="#6b7280" />
                      <Text style={styles.contactText}>
                        {selectedOrganization.phone ? 
                          selectedOrganization.phone.replace(/(\d{3})(\d{3})(\d{3})/, '+216 $1 $2 $3') : 
                          'Phone not available'
                        }
                      </Text>
                    </View>
                    <View style={styles.contactItem}>
                      <Feather name="map-pin" size={16} color="#6b7280" />
                      <Text style={styles.contactText}>{selectedOrganization.address}</Text>
                    </View>
                    <View style={styles.contactItem}>
                      <Feather name="navigation" size={16} color="#6b7280" />
                      <Text style={styles.contactText}>
                        {selectedOrganization.distance.toFixed(1)} km away
                      </Text>
                    </View>
                  </View>
                  
                  {/* Store Statistics */}
                  <View style={styles.statsSection}>
                    <Text style={styles.sectionTitle}>Store Statistics</Text>
                    <View style={styles.modalStats}>
                      <View style={styles.modalStatItem}>
                        <Feather name="package" size={20} color="#48C6A8" />
                        <Text style={styles.modalStatText}>
                          {selectedOrganization.productsCount || 0} Products
                        </Text>
                      </View>
                      <View style={styles.modalStatItem}>
                        <Feather name="folder" size={20} color="#48C6A8" />
                        <Text style={styles.modalStatText}>
                          {selectedOrganization.categoriesCount || 0} Categories
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Featured Products Preview */}
                  {selectedOrganization.preview?.products?.length > 0 && (
                    <View style={styles.previewSection}>
                      <Text style={styles.previewTitle}>{t('Featured Products')}</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {selectedOrganization.preview.products.map((product) => (
                          <View key={product.id} style={styles.productCard}>
                            <Image
                              source={{ uri: product.image }}
                              style={styles.productImage}
                              resizeMode="cover"
                            />
                            <Text style={styles.productName}>{product.name}</Text>
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </ScrollView>
              
              <View style={styles.modalFooter}>
                {/* Show View Categories button for approved stores */}
                {selectedOrganization.relationshipStatus === 'approved' && (
                  <TouchableOpacity
                    style={styles.modalPrimaryButton}
                    onPress={() => {
                      // Navigate to store categories
                      // Structure the data to match what the store page expects
                      const storeData = {
                        organization: {
                          id: selectedOrganization.id,
                          name: selectedOrganization.name,
                          logoUrl: selectedOrganization.logoUrl,
                          bannerUrl: selectedOrganization.bannerUrl,
                          address: selectedOrganization.address,
                          phone: selectedOrganization.phone,
                          email: selectedOrganization.email
                        }
                      }
                      router.push({
                        pathname: `/(app)/store/${selectedOrganization.id}`,
                        params: { store: JSON.stringify(storeData) }
                      })
                      setSelectedOrganization(null)
                    }}
                  >
                    <Feather name="shopping-bag" size={20} color="white" />
                    <Text style={styles.modalPrimaryButtonText}>View Categories</Text>
                  </TouchableOpacity>
                )}
                
                {/* Show Send Request button for available stores */}
                {((!selectedOrganization.hasRelationship && !selectedOrganization.relationshipStatus) || 
                  selectedOrganization.relationshipStatus === 'rejected') && (
                  <TouchableOpacity
                    style={[
                      styles.modalRequestButton, 
                      (isRequestingAccess && requestingOrganizationId === selectedOrganization.id) && styles.disabledButton
                    ]}
                    onPress={() => {
                      handleSendRequest(selectedOrganization)
                      setSelectedOrganization(null)
                    }}
                    disabled={isRequestingAccess && requestingOrganizationId === selectedOrganization.id}
                  >
                    <Text style={styles.modalRequestButtonText}>
                      {(isRequestingAccess && requestingOrganizationId === selectedOrganization.id) 
                        ? t('Sending...') 
                        : t('Send Request')
                      }
                    </Text>
                  </TouchableOpacity>
                )}
                
                {/* Show status message for pending/blocked stores */}
                {selectedOrganization.relationshipStatus === 'pending' && (
                  <View style={styles.modalStatusMessage}>
                    <Feather name="clock" size={20} color="#f59e0b" />
                    <Text style={styles.modalStatusText}>{t('Request Pending')}</Text>
                  </View>
                )}
                
                {selectedOrganization.relationshipStatus === 'blocked' && (
                  <View style={styles.modalStatusMessage}>
                    <Feather name="x-circle" size={20} color="#dc2626" />
                    <Text style={styles.modalStatusText}>{t('Access Blocked')}</Text>
                  </View>
                )}
              </View>
            </>
          )}
        </SafeAreaView>
      </Modal>
      
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#374151',
  },
  mapToggle: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  content: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  mapFallbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    textAlign: 'center',
  },
  mapFallbackSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  calloutContainer: {
    padding: 8,
    minWidth: 120,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  calloutDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  mapErrorDetails: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  switchToListButton: {
    backgroundColor: '#48C6A8',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  switchToListButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  organizationsList: {
    padding: 16,
  },
  organizationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  organizationBanner: {
    width: '100%',
    height: 120,
  },
  organizationInfo: {
    padding: 16,
  },
  organizationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoContainer: {
    marginRight: 12,
  },
  organizationLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  logoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#48C6A8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  organizationDetails: {
    flex: 1,
  },
  organizationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  organizationDistance: {
    fontSize: 14,
    color: '#6b7280',
  },
  organizationStats: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#6b7280',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  pendingButton: {
    backgroundColor: '#f59e0b',
    opacity: 0.8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#48C6A8',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  modalBanner: {
    width: '100%',
    height: 200,
  },
  modalInfo: {
    padding: 20,
  },
  modalAddress: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  modalDistance: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 20,
  },
  modalStats: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  modalStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  modalStatText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  previewSection: {
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  productCard: {
    width: 120,
    marginRight: 12,
  },
  productImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  productName: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  modalRequestButton: {
    backgroundColor: '#48C6A8',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalRequestButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  mapPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1A2A4F',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  mapPinSelected: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A2A4F',
    borderWidth: 3,
    borderColor: '#48C6A8',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  mapPinActive: {
    backgroundColor: '#1A2A4F',
    borderWidth: 2,
    borderColor: '#48C6A8',
  },
  mapPinPending: {
    backgroundColor: '#1A2A4F',
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  mapPinImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  mapPinImageSelected: {
    borderRadius: 20,
  },
  mapPinFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPinFallbackText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#48C6A8',
  },
  mapPinFallbackTextSelected: {
    fontSize: 16,
    color: '#48C6A8',
  },
  storeCardsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    height: 120,
  },
  hotelCardContainer: {
    width: Dimensions.get('window').width - 40,
    marginHorizontal: 20,
  },
  hotelCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    height: 100,
  },
  selectedHotelCard: {
    borderWidth: 2,
    borderColor: '#48C6A8',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  hotelCardContent: {
    flexDirection: 'row',
    height: '100%',
  },
  hotelImageContainer: {
    width: 80,
    height: '100%',
    position: 'relative',
  },
  hotelImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  hotelImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotelImagePlaceholderText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#9ca3af',
  },
  heartIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  hotelInfo: {
    flex: 1,
    padding: 8,
    justifyContent: 'space-between',
  },
  hotelName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  distance: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 1,
  },
  productsCount: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  requestButton: {
    backgroundColor: '#48C6A8',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  requestButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  statusContainer: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusMessage: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '500',
  },
  distanceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  floatingFilterContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 80, // Leave space for the list view toggle button
    zIndex: 1000,
  },
  filterTabsContent: {
    paddingHorizontal: 0,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterTabActive: {
    backgroundColor: '#48C6A8',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterTabTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  listViewToggle: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1000,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listContainer: {
    flex: 1,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapViewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  mapViewToggleText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#48C6A8',
  },
  listFloatingFilterContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 80, // Leave space for the map view toggle button
    zIndex: 1000,
  },
  listHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  listMapToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  storeLogoContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  storeLogo: {
    width: '100%',
    height: '100%',
  },
  storeLogoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5e7eb',
  },
  storeLogoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  storeBasicInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  contactSection: {
    marginBottom: 24,
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    flex: 1,
  },
  modalPrimaryButton: {
    backgroundColor: '#48C6A8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  modalPrimaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalStatusMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  modalStatusText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 8,
  },
})
