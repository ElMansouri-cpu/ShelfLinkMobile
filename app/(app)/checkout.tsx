import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Image,
  StyleSheet,
  Modal,
  Animated,
  StatusBar,
} from 'react-native'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { useLocation } from '../../context/LocationContext'
import { Feather } from '@expo/vector-icons'
import { useRouter, useLocalSearchParams } from 'expo-router'
import Mapbox from '@rnmapbox/maps'
import * as Location from 'expo-location'
import Pin from '../../assets/pin.svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import Header from '../../components/Header'
import Constants from 'expo-constants'

async function getAddressFromCoords(lat, lng, t) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ar`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'YourAppName/1.0 (your@email.com)'
      }
    });
    const data = await response.json();
    if (data && data.display_name) {
      return data.display_name;
    }
  } catch (e) {}
  return t("Unknown address");
}

export enum OrderType {
  DELIVERY = 'delivery',
  PICKUP = 'pickup'
}

export default function CheckoutScreen() {
  // Initialize Mapbox with error handling

  const { t } = useTranslation();

  const { items, getTotalPrice } = useCart()
  const { user } = useAuth()
  const { location: userLocation, loading: locationLoading } = useLocation()
  const router = useRouter()
  const { store: storeParam } = useLocalSearchParams()
  const storeData = storeParam ? JSON.parse(storeParam as string) : { organization: { name: t("Store"), address: t("Store location") } }
  const store = storeData.organization || storeData
  const [address, setAddress] = useState('select address')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [orderType, setOrderType] = useState<OrderType>(OrderType.DELIVERY)
  
  const deliveryFee = 0
  const serviceFee = 0
  const totalProducts = getTotalPrice()
  const total = totalProducts + (orderType === OrderType.DELIVERY ? deliveryFee : 0) + serviceFee
  const mapRef = useRef<Mapbox.MapView>(null)
  const modalMapRef = useRef<Mapbox.MapView>(null)
  const [tempModalRegion, setTempModalRegion] = useState<[number, number] | null>(null)
  const [mapRegion, setMapRegion] = useState<[number, number]>([10.16579, 36.81897]) // [longitude, latitude] - Default Tunis coordinates
  const scrollY = new Animated.Value(0);
  const insets = useSafeAreaInsets();
  const [mapModalVisible, setMapModalVisible] = useState(false)
  const [isMapReady, setIsMapReady] = useState(false)
  const [isModalMapReady, setIsModalMapReady] = useState(false)
  const [mapKey, setMapKey] = useState(0) // Key to force remount when needed
  const [isMapboxInitialized, setIsMapboxInitialized] = useState(false)
  const [shouldRenderMap, setShouldRenderMap] = useState(false)
  const [mapEnabled, setMapEnabled] = useState(true) // Enable maps with safe rendering
  const [mapError, setMapError] = useState<string | null>(null)
  const [isProduction, setIsProduction] = useState(false)
  
  // Retry map initialization
  const retryMapInitialization = () => {
    setMapError(null)
    setIsMapReady(false)
    setIsModalMapReady(false)
    setMapKey(prev => prev + 1) // Force remount
  }
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.9],
    extrapolate: 'clamp'
  });
  useEffect(() => {
    let isMounted = true
    
    const initializeMapbox = async () => {
      try {
        // Check if we're in production build
        const isProductionBuild = !__DEV__
        setIsProduction(isProductionBuild)
        
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
          setMapError(t('Failed to initialize Mapbox'))
          console.error('Failed to initialize Mapbox:', error)
        }
      }
    }

    initializeMapbox()

    return () => {
      isMounted = false
    }
  }, [])

  // Update map region and address when user location is available
  useEffect(() => {
    if (userLocation) {
      const region: [number, number] = [userLocation.lng, userLocation.lat] // [longitude, latitude] for Mapbox
      setMapRegion(region)
      setAddress(userLocation.address)
    }
  }, [userLocation])

  // Placeholder addresses


  useEffect(() => {
    if (mapModalVisible) {
      // Reset temp region when opening modal
      setTempModalRegion(null)
      
      // Ensure modal map shows the same region as main map
      // The camera will be set via the Camera component in the MapView
    }
  }, [mapModalVisible])

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clean up map references when component unmounts
      if (mapRef.current) {
        mapRef.current = null
      }
      if (modalMapRef.current) {
        modalMapRef.current = null
      }
      setIsMapReady(false)
      setIsModalMapReady(false)
    }
  }, [])


  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("Payment")}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Delivery Details Header */}
      <View style={styles.deliveryDetailsHeader}>
        <Text style={styles.deliveryDetailsTitle}>{t("Delivery details")}</Text>
      </View>

      {/* Full Screen Map */}
      <View style={styles.mapContainer}>
        {mapEnabled && mapRegion && isMapboxInitialized && shouldRenderMap && !mapError ? (
          <TouchableOpacity 
            onPress={() => setMapModalVisible(true)} 
            style={{ width: '100%', height: '100%' }}
          >
            <Mapbox.MapView
              key={`map-${mapKey}`}
              ref={(ref) => {
                if (ref) {
                  mapRef.current = ref
                }
              }}
              style={{ width: '100%', height: '100%' }}
              styleURL={Mapbox.StyleURL.Street}
              zoomEnabled={false}
              scrollEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
              onDidFinishLoadingMap={() => {
                console.log('Main map loaded successfully')
                setIsMapReady(true)
              }}
              onDidFailLoadingMap={() => {
                console.error('Main map failed to load')
                setIsMapReady(false)
                setMapError(t('Map failed to load'))
              }}
            >
              <Mapbox.Camera
                centerCoordinate={mapRegion}
                zoomLevel={15}
                animationMode="none"
              />
              {isMapReady && (
                <Mapbox.PointAnnotation
                  id="delivery-location"
                  coordinate={mapRegion}
                  title={t("Delivery Location")}
                >
                  <Mapbox.Callout title={t("Delivery Location")} />
                </Mapbox.PointAnnotation>
              )}
            </Mapbox.MapView>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            onPress={() => {
              if (mapError) {
                retryMapInitialization()
              } else {
                setMapModalVisible(true)
              }
            }} 
            style={styles.mapPlaceholder}
          >
            <Feather name="map-pin" size={48} color="#10b981" style={{ marginBottom: 12 }} />
            <Text style={styles.mapPlaceholderText}>
              {address}
            </Text>
            <Text style={styles.mapPlaceholderSubtext}>
              {mapError ? t("Map error - tap to retry") : 
               isMapboxInitialized && shouldRenderMap ? t("Loading map...") : t("Tap to change location")}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Address Display */}
      <View style={styles.addressContainer}>
        <Text style={styles.addressText}>{address}</Text>
      </View>

      {/* Bottom Sheet - Order Summary */}
      <View style={styles.bottomSheet}>
        <View style={styles.bottomSheetHandle} />
        <Text style={styles.summaryTitle}>{t("Summary")}</Text>
        
        <View style={styles.productInfo}>
          <Text style={styles.productText}>
            {items.length} {t("products from")} <Text style={styles.storeName}>{store.name || t("Store")}</Text>
          </Text>
        </View>

        <View style={styles.costBreakdown}>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>{t("Total Amount")}</Text>
            <Text style={styles.costValue}>{totalProducts.toFixed(3)} DT</Text>
          </View>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>{t("Delivery Fee")}</Text>
            <Text style={styles.costValue}>{deliveryFee.toFixed(3)} DT</Text>
          </View>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>
              {t("Services")} <Feather name="info" size={16} color="#888" />
            </Text>
            <Text style={styles.costValue}>{serviceFee.toFixed(3)} DT</Text>
          </View>
        </View>

        {/* Confirm Order Button */}
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => {
            router.replace({
              pathname: '/(app)/order-confirmation',
              params: {
                address: address,
                payment: paymentMethod || 'Pay with cash',
                items: JSON.stringify(items),
                total: total,
                markerPosition: JSON.stringify({ latitude: mapRegion[1], longitude: mapRegion[0] }),
                totalProducts: totalProducts,
                deliveryFee: deliveryFee,
                serviceFee: serviceFee,
                store: JSON.stringify({ organization: store }),
                client: JSON.stringify(user),
                orderType: JSON.stringify(OrderType.DELIVERY),
              },
            });
          }}
        >
          <Text style={styles.confirmButtonText}>
            {t('Confirm order')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Map Modal for address selection */}
      <Modal visible={mapModalVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
          <View style={{ flex: 1 }}>
            {isMapboxInitialized && shouldRenderMap && !mapError ? (
              <Mapbox.MapView
                key={`modal-map-${mapKey + 1000}`}
                ref={(ref) => {
                  if (ref) {
                    modalMapRef.current = ref
                  }
                }}
                style={{ flex: 1 }}
                styleURL={Mapbox.StyleURL.Street}
                onCameraChanged={(state) => {
                  // Store changes temporarily without updating the main map yet
                  if (state.properties.center) {
                    setTempModalRegion([state.properties.center[0], state.properties.center[1]])
                  }
                }}
                onDidFinishLoadingMap={() => {
                  console.log('Modal map loaded successfully')
                  setIsModalMapReady(true)
                }}
                onDidFailLoadingMap={() => {
                  console.error('Modal map failed to load')
                  setIsModalMapReady(false)
                }}
              >
                <Mapbox.Camera
                  centerCoordinate={mapRegion}
                  zoomLevel={15}
                  animationMode="flyTo"
                  animationDuration={1000}
                />
              </Mapbox.MapView>
            ) : (
              <View style={{ flex: 1, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#6b7280', marginBottom: 16 }}>
                  {mapError ? t("Map error - please try again") : t("Loading map...")}
                </Text>
                {mapError && (
                  <TouchableOpacity
                    onPress={retryMapInitialization}
                    style={{
                      backgroundColor: '#10b981',
                      paddingHorizontal: 20,
                      paddingVertical: 10,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: '600' }}>
                      {t("Retry")}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            {/* Center pin */}
            <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: '45%', alignItems: 'center' }}>
              <Pin width={48} height={48} />
            </View>
            {/* Close */}
            <TouchableOpacity
              onPress={() => {
                setMapModalVisible(false)
                setTempModalRegion(null)
                // Force map remount to prevent view tag conflicts
                setMapKey(prev => prev + 1)
              }}
              style={{ position: 'absolute', top: 40, left: 20, backgroundColor: 'white', borderRadius: 20, padding: 8 }}
            >
              <Feather name="x" size={28} color="#222" />
            </TouchableOpacity>
            {/* Confirm */}
            <TouchableOpacity
              style={styles.modalConfirmButton}
              onPress={async () => {
                // Only update the main map region when user confirms
                if (tempModalRegion) {
                  setMapRegion(tempModalRegion)
                  const addr = await getAddressFromCoords(tempModalRegion[1], tempModalRegion[0], t) // [longitude, latitude] -> [latitude, longitude]
                  setAddress(addr)
                }
                setMapModalVisible(false)
                setTempModalRegion(null)
                // Force map remount to prevent view tag conflicts
                setMapKey(prev => prev + 1)
              }}
            >
              <Text style={styles.modalConfirmButtonText}>{t("Confirm location")}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: 'rgba(0,0,0,0.3)',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  deliveryDetailsHeader: {
    position: 'absolute',
    top: 70,
    left: 20,
    zIndex: 10,
  },
  deliveryDetailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  mapContainer: {
    flex: 1,
    height: '65%',
  },
  mapPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10b981',
    borderStyle: 'dashed',
  },
  mapPlaceholderText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  mapPlaceholderSubtext: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  addressContainer: {
    position: 'absolute',
    bottom: '42%',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressText: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 22,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: '40%',
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  productInfo: {
    marginBottom: 16,
  },
  productText: {
    fontSize: 16,
    color: '#6b7280',
  },
  storeName: {
    fontWeight: 'bold',
    color: '#1f2937',
  },
  costBreakdown: {
    marginBottom: 20,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  costLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  costValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#48C6A8',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#48C6A8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalConfirmButton: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    backgroundColor: '#48C6A8',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#48C6A8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalConfirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});