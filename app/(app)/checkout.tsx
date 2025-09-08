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
import { Feather } from '@expo/vector-icons'
import { useRouter, useLocalSearchParams } from 'expo-router'
import Mapbox from '@rnmapbox/maps'
import * as Location from 'expo-location'
import Pin from '../../assets/pin.svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import Header from '../../components/Header'

async function getAddressFromCoords(lat, lng) {
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
  return "Unknown address";
}

export enum OrderType {
  DELIVERY = 'delivery',
  PICKUP = 'pickup'
}

export default function CheckoutScreen() {
  // Initialize Mapbox with error handling


  const { items, getTotalPrice } = useCart()
  const { session } = useAuth()
  const router = useRouter()
  const { store: storeParam } = useLocalSearchParams()
  const store = storeParam ? JSON.parse(storeParam as string) : { name: "Store", address: "Store location" }
  const [address, setAddress] = useState('select address')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [orderType, setOrderType] = useState<OrderType>(OrderType.DELIVERY)
  
  const deliveryFee = 0
  const serviceFee = 0
  const totalProducts = getTotalPrice()
  const total = totalProducts + (orderType === OrderType.DELIVERY ? deliveryFee : 0) + serviceFee
  const mapRef = useRef<Mapbox.MapView>(null)
  const [tempModalRegion, setTempModalRegion] = useState<[number, number] | null>(null)
  const [mapRegion, setMapRegion] = useState<[number, number]>([10.16579, 36.81897]) // [longitude, latitude]
  // Map marker state (Tunis coordinates as default)
  const scrollY = new Animated.Value(0);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [mapModalVisible, setMapModalVisible] = useState(false)
  const [isMapReady, setIsMapReady] = useState(false)
  const [mapKey, setMapKey] = useState(0) // Key to force remount when needed
  const [isMapboxInitialized, setIsMapboxInitialized] = useState(false)
  const [shouldRenderMap, setShouldRenderMap] = useState(false)
  const [mapEnabled, setMapEnabled] = useState(true) // Enable maps with safe rendering
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.9],
    extrapolate: 'clamp'
  });
  useEffect(() => {
    try {
      const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoieGdoYXNlMTQiLCJhIjoiY21mNDhxMXRxMDB3eTJrczRwZTR5dnlydSJ9.-iWoOkmS7QXZqhqwTMLAAA'
      if (token) {
        Mapbox.setAccessToken(token)
        setIsMapboxInitialized(true)
        // Delay map rendering to ensure token is fully processed
        setTimeout(() => {
          setShouldRenderMap(true)
        }, 500)
      } else {
        console.error('Mapbox token not found')
      }
    } catch (error) {
      console.error('Failed to initialize Mapbox token:', error)
    }
  }, [])

  // Get user location on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') return

      const location = await Location.getCurrentPositionAsync({})
      const { latitude, longitude } = location.coords

      const region: [number, number] = [longitude, latitude] // [longitude, latitude] for Mapbox

      setMapRegion(region)
      const addr = await getAddressFromCoords(latitude, longitude)
      setAddress(addr)
    })()
  }, [])

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
      // Clean up map reference when component unmounts
      if (mapRef.current) {
        mapRef.current = null
      }
    }
  }, [])

  // Reset map state when order type changes
  useEffect(() => {
    if (orderType === OrderType.PICKUP) {
      // Close modal if open when switching to pickup
      setMapModalVisible(false)
      setTempModalRegion(null)
    }
    // Force map remount when switching between delivery and pickup
    setMapKey(prev => prev + 1)
  }, [orderType])

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
        <Header  scrollY={scrollY} title={t("Checkout")} onBack={() => router.back()} opacity={1}  />
   
      <Animated.ScrollView         
      style={{ flex: 1 }}
        contentContainerStyle={{  paddingTop: insets.top }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
>
        {orderType === OrderType.DELIVERY && (
          <View style={{  marginBottom: 8, marginTop: 50 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>{t("Delivery details")}</Text>
            {/* MapView with marker and zoom controls */}
            <View style={{ height: 200, borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
              {mapEnabled && mapRegion && isMapboxInitialized && shouldRenderMap ? (
                <TouchableOpacity 
                  onPress={() => setMapModalVisible(true)} 
                  style={{ width: '100%', height: '100%' }}
                >
                  <Mapbox.MapView
                    key={`map-${mapKey}`}
                    ref={mapRef}
                    style={{ width: '100%', height: '100%' }}
                    styleURL={Mapbox.StyleURL.Street}
                    zoomEnabled={false}
                    scrollEnabled={false}
                    pitchEnabled={false}
                    rotateEnabled={false}
                    onDidFinishLoadingMap={() => {
                      setIsMapReady(true)
                    }}
                    onDidFailLoadingMap={() => {
                      console.error('Main map failed to load')
                      setIsMapReady(false)
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
                        title="Delivery Location"
                      >
                        <Mapbox.Callout title="Delivery Location" />
                      </Mapbox.PointAnnotation>
                    )}
                  </Mapbox.MapView>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  onPress={() => setMapModalVisible(true)} 
                  style={{ width: '100%', height: '100%', backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#10b981', borderStyle: 'dashed' }}
                >
                  <Feather name="map-pin" size={48} color="#10b981" style={{ marginBottom: 12 }} />
                  <Text style={{ color: '#10b981', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
                    {address}
                  </Text>
                  <Text style={{ color: '#6b7280', fontSize: 14, marginTop: 4, textAlign: 'center' }}>
                    {isMapboxInitialized && shouldRenderMap ? 'Loading map...' : 'Tap to change location'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {/* Address selection */}
            <TouchableOpacity 
              onPress={() => setMapModalVisible(true)} 
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                marginBottom: 8,
                opacity: 1
              }}
            >
              <Text style={{ fontSize: 16, marginLeft: 8 }}>{address}</Text>
              <Feather name={'chevron-right'} size={18} color="#888" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          
          </View>
        )}

        {/* Pickup details - Show if pickup is selected */}
        {orderType === OrderType.PICKUP && (
          <View style={{ paddingHorizontal: 20, marginBottom: 16, marginTop: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>Pickup details</Text>
            <View style={{ backgroundColor: '#f0fdf4', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center',overflow: 'hidden' }}>
              <Feather name="map-pin" size={24} color="#10b981" style={{ marginRight: 12 }} />
              <View>
                <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{store.name || "Store"}</Text>
                <Text style={{ color: '#4b5563' }} numberOfLines={1}>{store.location?.address || store.address || "Store location"}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Payment method */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          {/* Order Type Selection */}
          <View style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity 
                style={[
                  styles.orderTypeCard,
                  orderType === OrderType.DELIVERY && styles.orderTypeCardSelected
                ]}
                onPress={() => setOrderType(OrderType.DELIVERY)}
              >
                <View style={styles.orderTypeIcon}>
                  <Feather name="truck" size={24} color={orderType === OrderType.DELIVERY ? '#10b981' : '#10b981'} />
                </View>
                <Text style={[
                  styles.orderTypeText,
                  orderType === OrderType.DELIVERY && styles.orderTypeTextSelected
                ]}>{t('Delivery')}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.orderTypeCard,
                  orderType === OrderType.PICKUP && styles.orderTypeCardSelected
                ]}
                onPress={() => setOrderType(OrderType.PICKUP)}
              >
                <View style={styles.orderTypeIcon}>
                  <Feather name="shopping-bag" size={24} color={orderType === OrderType.PICKUP ? '#10b981' : '#10b981'} />
                </View>
                <Text style={[
                  styles.orderTypeText,
                  orderType === OrderType.PICKUP && styles.orderTypeTextSelected
                ]}>{t("Pickup")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Summary */}
  
      </Animated.ScrollView>
      <View style={{ backgroundColor: '#f9fafb', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, marginTop: 8,marginBottom: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>{t("Summary")}</Text>
          <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, marginTop: 4 }}>
            {items.length} {t("products from")} <Text style={{ fontWeight: 'bold' }}>{store.name || "Store"}</Text>
          </Text>
        </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: '#444', fontSize: 16 }}>{t("Total Amount")}</Text>
            <Text style={{ color: '#444', fontSize: 16 }}>{totalProducts.toFixed(3)} DT</Text>
          </View>
          {orderType === OrderType.DELIVERY && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: '#444', fontSize: 16 }}>{t("Delivery Fee")}</Text>
              <Text style={{ color: '#444', fontSize: 16 }}>{deliveryFee.toFixed(3)} DT</Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: '#444', fontSize: 16 }}>{t("Services")} <Feather name="info" size={16} color="#888" /></Text>
            <Text style={{ color: '#444', fontSize: 16 }}>{serviceFee.toFixed(3)} DT</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 20 }}>{t("TOTAL")}</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 20 }}>{total.toFixed(3)} DT</Text>
          </View>
        </View>

      {/* Map Modal for address selection - Only available in delivery mode */}
      <Modal visible={mapModalVisible && orderType === OrderType.DELIVERY} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
          <View style={{ flex: 1 }}>
            {isMapboxInitialized && shouldRenderMap ? (
              <Mapbox.MapView
                key={`modal-map-${mapKey + 1000}`}
                style={{ flex: 1 }}
                styleURL={Mapbox.StyleURL.Street}
                onCameraChanged={(state) => {
                  // Store changes temporarily without updating the main map yet
                  if (state.properties.center) {
                    setTempModalRegion([state.properties.center[0], state.properties.center[1]])
                  }
                }}
                onDidFinishLoadingMap={() => {
                }}
                onDidFailLoadingMap={() => {
                  console.error('Modal map failed to load')
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
                <Text style={{ color: '#6b7280' }}>Loading map...</Text>
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
              style={{ position: 'absolute', bottom: 40, left: 40, right: 40, backgroundColor: '#10b981', borderRadius: 999, paddingVertical: 16, alignItems: 'center' }}
              onPress={async () => {
                // Only update the main map region when user confirms
                if (tempModalRegion) {
                  setMapRegion(tempModalRegion)
                  const addr = await getAddressFromCoords(tempModalRegion[1], tempModalRegion[0]) // [longitude, latitude] -> [latitude, longitude]
                  setAddress(addr)
                }
                setMapModalVisible(false)
                setTempModalRegion(null)
                // Force map remount to prevent view tag conflicts
                setMapKey(prev => prev + 1)
              }}
            >
              <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>{t("Confirm location")}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
      {/* Pay to order button */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: 'white' }}>
        <TouchableOpacity
          style={{ backgroundColor: '#10b981', borderRadius: 12, shadowColor: '#10b981', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 ,paddingVertical: 16,alignItems: 'center'}}
          onPress={() => {
            router.replace({
              pathname: '/(app)/order-confirmation',
              params: {
                address: orderType === OrderType.DELIVERY ? address : store.address || "Store location",
                payment: paymentMethod || 'Pay with cash',
                items: JSON.stringify(items),
                total: total,
                markerPosition: JSON.stringify({ latitude: mapRegion[1], longitude: mapRegion[0] }),
                totalProducts: totalProducts,
                deliveryFee: deliveryFee,
                serviceFee: serviceFee,
                store: JSON.stringify(store),
                client: JSON.stringify(session?.user),
                orderType: JSON.stringify(orderType),
              },
            });
          }}
        >
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
            {orderType === OrderType.DELIVERY ? t('Confirm order') : t('Confirm pickup')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    height: 120,
    zIndex: 10,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

headerTitle: {
  fontSize: 24,
  fontWeight: 'bold',
  color: '#fff',
},
  orderTypeCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  orderTypeCardSelected: {
    borderColor: '#10b981',
    backgroundColor: '#10b981',
  },
  orderTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  orderTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  orderTypeTextSelected: {
    color: '#fff',
  },
});