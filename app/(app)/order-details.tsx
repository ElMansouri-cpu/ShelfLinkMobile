"use client"

import { useEffect, useState, useRef } from "react"
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
  Platform,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { useTranslation } from "react-i18next"
import "../../i18n"
import { safePush } from "../../utils/navigation"
import { useFetchOrderDetails } from "../../services/order-service/orders.query"

const { width } = Dimensions.get("window")
const HEADER_HEIGHT = 220
const COMPACT_HEADER_HEIGHT = 100

async function getAddressFromCoords(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ar`
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "YourAppName/1.0 (your@email.com)",
      },
    })
    const data = await response.json()
    if (data && data.display_name) {
      return data.display_name
    }
  } catch (e) {}
  return "Unknown address"
}

// Status badge component with animation
const StatusBadge = ({ status }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current
  const { t } = useTranslation()

  useEffect(() => {
    if (status.toLowerCase() === "pending") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start()
    }
  }, [status])

  let bgColor = "#10b981"
  let icon = "check-circle"

  if (status.toLowerCase() === "pending") {
    bgColor = "#f59e0b"
    icon = "clock"
  } else if (status.toLowerCase() === "cancelled") {
    bgColor = "#ef4444"
    icon = "x-circle"
  } else if (status.toLowerCase() === "processing") {
    bgColor = "#3b82f6"
    icon = "refresh-cw"
  }

  return (
    <Animated.View
      style={[
        styles.statusBadge,
        {
          backgroundColor: bgColor,
          transform: [{ scale: status.toLowerCase() === "pending" ? pulseAnim : 1 }],
        },
      ]}
    >
      <Feather name={icon as any} size={16} color="white" style={{ marginRight: 6 }} />
      <Text style={styles.statusBadgeText}>{t(status)}</Text>
    </Animated.View>
  )
}

// Delivery step component
const DeliveryStep = ({ type, address, isFirst, isLast }) => {
  const { t } = useTranslation()
  const bgColor = type === "from" ? "#fef3c7" : "#dcfce7"
  const iconColor = type === "from" ? "#f59e0b" : "#10b981"

  return (
    <View style={styles.deliveryStep}>
      <View style={[styles.deliveryIcon, { backgroundColor: bgColor }]}>
        <Feather name="map-pin" size={18} color={iconColor} />
      </View>

      <View style={styles.deliveryInfo}>
        <Text style={styles.deliveryLabel}>{type === "from" ? t("From") : t("To")}</Text>
        <Text style={styles.deliveryAddress}>{address}</Text>
      </View>

      {!isLast && (
        <View style={styles.deliveryConnector}>
          <View style={styles.connectorLine} />
          <View style={styles.connectorDot} />
        </View>
      )}
    </View>
  )
}

// Order item component
const OrderItem = ({ item, isLast }) => {
  const { t } = useTranslation()
  
  // Get status badge styling with cleaner colors
  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'pending_validation':
        return { 
          backgroundColor: '#fef3c7', 
          color: '#d97706',
          icon: 'clock'
        }
      case 'validated':
        return { 
          backgroundColor: '#dcfce7', 
          color: '#16a34a',
          icon: 'check-circle'
        }
      case 'quantity_updated':
        return { 
          backgroundColor: '#dbeafe', 
          color: '#2563eb',
          icon: 'edit-3'
        }
      case 'replaced':
        return { 
          backgroundColor: '#e0e7ff', 
          color: '#7c3aed',
          icon: 'refresh-cw'
        }
      case 'delivered':
        return { 
          backgroundColor: '#dcfce7', 
          color: '#16a34a',
          icon: 'truck'
        }
      case 'returned':
        return { 
          backgroundColor: '#fee2e2', 
          color: '#dc2626',
          icon: 'undo'
        }
      case 'refunded':
        return { 
          backgroundColor: '#fee2e2', 
          color: '#dc2626',
          icon: 'dollar-sign'
        }
      case 'cancelled':
        return { 
          backgroundColor: '#f3f4f6', 
          color: '#6b7280',
          icon: 'x-circle'
        }
      case 'shipped':
        return { 
          backgroundColor: '#dbeafe', 
          color: '#2563eb',
          icon: 'package'
        }
      default:
        return { 
          backgroundColor: '#f3f4f6', 
          color: '#6b7280',
          icon: 'help-circle'
        }
    }
  }

  const statusStyle = getStatusBadgeStyle(item.status)
  
  return (
    <View style={[styles.orderItem, !isLast && styles.orderItemBorder]}>
      <View style={styles.orderItemQuantity}>
        <Text style={styles.quantityText}>{item.quantity}×</Text>
      </View>

      <View style={styles.orderItemDetails}>
        <View style={styles.itemNameContainer}>
          <Text style={styles.itemName}>{item.variant.name}</Text>
          {item.variant.description && (
            <Text style={styles.itemDescription} numberOfLines={1}>
              {item.variant.description}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.rightSection}>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
          <Feather name={statusStyle.icon as any} size={10} color={statusStyle.color} style={{ marginRight: 3 }} />
          <Text style={[styles.statusText, { color: statusStyle.color }]}>
            {t(item.status.toUpperCase())}
          </Text>
        </View>
        <Text style={styles.itemPrice}>{parseFloat(item.totalAmount).toFixed(3)} {t("DT")}</Text>
      </View>
    </View>
  )
}

export default function OrderDetailsScreen() {
  const { order: orderParam, orderId, organizationId } = useLocalSearchParams()
  const router = useRouter()
  const { t } = useTranslation()
  
  // Extract order ID and organization ID
  const extractedOrderId = orderId as string || (orderParam ? JSON.parse(orderParam as string)?.id : undefined)
  const extractedOrgId = organizationId as string || (orderParam ? JSON.parse(orderParam as string)?.organizationId : undefined)

  // Use the hook to fetch order details
  const { data: orderDetails, isLoading, error, refetch } = useFetchOrderDetails(
    extractedOrderId,
    extractedOrgId
  )

  // Debug logging for order details
  useEffect(() => {
    console.log('OrderDetailsScreen - orderDetails updated:', {
      extractedOrderId,
      extractedOrgId,
      id: orderDetails?.id,
      status: orderDetails?.status,
      organizationId: orderDetails?.organizationId,
      isLoading,
      error: error?.message || null
    });
  }, [orderDetails, isLoading, error, extractedOrderId, extractedOrgId]);
  
  const [clientAddress, setClientAddress] = useState("Loading...")
  const [storeAddress, setStoreAddress] = useState("Loading...")
  const scrollY = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  // All useEffect hooks must be called before any conditional returns
  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start()

    async function fetchAddress() {
      try {
        if (orderDetails?.latitude && orderDetails?.longitude) {
          const addr = await getAddressFromCoords(orderDetails.latitude, orderDetails.longitude)
          setClientAddress(addr)
        } else {
          setClientAddress("Address not available")
        }
      } catch (error) {
        setClientAddress("Address not available")
      }
    }
    async function fetchStoreAddress() {
      try {
        if (orderDetails?.organization?.location?.lat && orderDetails?.organization?.location?.lng) {
          const addr = await getAddressFromCoords(orderDetails.organization?.location?.lat, orderDetails.organization?.location?.lng)
          setStoreAddress(addr)
        } else {
          setStoreAddress("Store address not available")
        }
      } catch (error) {
        setStoreAddress("Store address not available")
      }
    }

    if (orderDetails) {
      fetchAddress()
      fetchStoreAddress()
    }
  }, [orderDetails?.latitude, orderDetails?.longitude, orderDetails?.organization?.location?.lat, orderDetails?.organization?.location?.lng])

  // Missing parameters state
  if (!extractedOrderId || !extractedOrgId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, color: '#666' }}>Missing order information</Text>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={{ marginTop: 20, backgroundColor: '#10b981', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, color: '#666' }}>Loading order details...</Text>
      </SafeAreaView>
    )
  }

  // Error state
  if (error || !orderDetails || isLoading === false && !orderDetails) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, color: '#666' }}>Order details not found</Text>
        <Text style={{ fontSize: 14, color: '#999', marginTop: 8 }}>{error?.message || 'An error occurred'}</Text>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={{ marginTop: 20, backgroundColor: '#10b981', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }
  // Format date nicely
  const orderDate = new Date(orderDetails.createdAt)
  const formattedDate = orderDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  const formattedTime = orderDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })


  // Calculate total items
  const totalItems = orderDetails.items.reduce((sum, item) => sum + item.quantity, 0)

  // Header animations
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [HEADER_HEIGHT, COMPACT_HEADER_HEIGHT],
    extrapolate: "clamp",
  })

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80, 120],
    outputRange: [1, 0.5, 0],
    extrapolate: "clamp",
  })

  const titleOpacity = scrollY.interpolate({
    inputRange: [0, 80, 120],
    outputRange: [0, 0.5, 1],
    extrapolate: "clamp",
  })

  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.2, 1],
    extrapolate: "clamp",
  })

  // Calculate subtotal and total
  const deliveryFee = 0
  const serviceFee = 0

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <Animated.View style={[styles.mainContainer, { opacity: fadeAnim }]}>
        {/* Animated Header */}
        <Animated.View style={[styles.header, { height: headerHeight }]}>
          <LinearGradient
            colors={["#10b981", "#059669"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          <TouchableOpacity className="mt-2" style={styles.backBtn} onPress={() => safePush({pathname: `/(app)/orders`})} activeOpacity={0.7}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.headerContent,
              {
                opacity: headerOpacity,
                transform: [{ scale: imageScale }],
              },
            ]}
          >
            <Image
              source={{
                uri: orderDetails?.organization?.logoUrl || "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
              }}
              style={styles.headerImage}
            />  
            <Text style={styles.headerTitle}>{orderDetails.organization?.name || "Store"}</Text>
            <StatusBadge status={orderDetails.status} />
          </Animated.View>

          <Animated.View style={[styles.compactHeader, { opacity: titleOpacity }]}>
            <Text className="mb-2 mr-4" style={styles.compactTitle}>{t("Order")} #{orderDetails.id.substring(0, 8)}</Text>
            <StatusBadge status={orderDetails.status} />
          </Animated.View>
        </Animated.View>

        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
          scrollEventThrottle={16}
        >
          {/* Order Info Card */}
          <View style={styles.card}>
            <View style={styles.orderInfoHeader}>
              <View style={styles.orderDateContainer}>
                <Feather name="calendar" size={18} color="#059669" style={{ marginRight: 8 }} />
                <Text style={styles.orderDate}>
                  {formattedDate} • {formattedTime}
                </Text>
              </View>
              <Text style={styles.orderId}>#{orderDetails.id.substring(0, 8)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.storeInfoContainer}>
              <Image
                source={{
                  uri: orderDetails.organization?.logoUrl || "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
                }}
                style={styles.storeImage}
              />
              <View style={styles.storeInfo}>
                <Text style={styles.storeName}>{orderDetails.organization?.name || "Store"}</Text>
                <View style={styles.storeButtonsContainer}>
                  <TouchableOpacity
                    style={styles.storeButton}
                    onPress={() =>
                        safePush( {pathname: `/(app)/store/${orderDetails.organizationId}`, params: { store: JSON.stringify({ 
                          organization: {
                            id: orderDetails.organizationId,
                            name: orderDetails.organization?.name || "Store",
                            bannerUrl: orderDetails.organization?.bannerUrl || null,
                            logoUrl: orderDetails.organization?.logoUrl || null,
                            address: orderDetails.organization?.address || null
                          }
                        }) }})
                      }
                    activeOpacity={0.7}
                  >
                    <Text style={styles.storeButtonText}>{t("Visit store")}</Text>
                    <Feather name="chevron-right" size={16} color="#059669" />
                  </TouchableOpacity>
                  
                  {orderDetails.status === 'completed' && (
                    <TouchableOpacity
                      style={styles.invoiceButton}
                      onPress={() =>
                          safePush( {pathname: `/invoice`, params: { orderId: orderDetails.id, organizationId: orderDetails.organizationId }})
                        }
                      activeOpacity={0.7}
                    >
                      <Text style={styles.invoiceButtonText}>{t("View Invoice")}</Text>
                      <Feather name="file-text" size={16} color="#059669" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Order Items Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <Feather name="shopping-bag" size={20} color="#059669" style={{ marginRight: 10 }} />
                <Text style={styles.cardTitle}>{t("Order Items")}</Text>
              </View>
              <View style={styles.itemCountBadge}>
                <Text style={styles.itemCountText}>{totalItems} {t("items")}</Text>
              </View>
            </View>

            <View style={styles.itemsListContainer}>
              {orderDetails.items.map((item: any, idx: number) => (
                <OrderItem key={idx} item={item} isLast={idx === orderDetails.items.length - 1} />
              ))}
            </View>
          </View>

          {/* Delivery Details Card */}
          <View style={styles.card}>
            <View style={styles.cardTitleContainer}>
              <Feather name="map" size={20} color="#059669" style={{ marginRight: 10 }} />
              <Text style={styles.cardTitle}>{t("Delivery Details")}</Text>
            </View>

            <View style={styles.deliveryStepsContainer}>
              <DeliveryStep type="from" address={orderDetails.organization?.location?.address || "Store address"} isFirst={true} isLast={false} />

              <DeliveryStep type="to" address={clientAddress} isFirst={false} isLast={true} />
            </View>

            <View style={styles.estimatedDelivery}>
              <Feather name="clock" size={16} color="#6b7280" />
              <Text style={styles.estimatedDeliveryText}>{t("Estimated delivery: 30-45 min")}</Text>
            </View>
          </View>

          {/* Payment Summary Card */}
          <View style={styles.card}>
            <View style={styles.cardTitleContainer}>
              <Feather name="credit-card" size={20} color="#059669" style={{ marginRight: 10 }} />
              <Text style={styles.cardTitle}>{t("Payment Summary")}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t("Products")}</Text>
              <Text style={styles.summaryValue}>{orderDetails && (Number(orderDetails.totalAmount) - (deliveryFee + serviceFee)).toFixed(3)} {t("DT")}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t("Delivery Fee")}</Text>
              <Text style={styles.summaryValue}>{deliveryFee.toFixed(3)} {t("DT")}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t("Service Fee")}</Text>
              <Text style={styles.summaryValue}>{serviceFee.toFixed(3)} {t("DT")}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t("Total")}</Text>
              <Text style={styles.totalValue}>{orderDetails && parseFloat(orderDetails?.totalAmount)?.toFixed(3)} {t("DT")}</Text>
            </View>

            <View style={styles.paymentMethod}>
              <Feather name="credit-card" size={18} color="#6b7280" style={{ marginRight: 8 }} />
              <Text style={styles.paymentMethodText}>{t("Paid with cash")}</Text>
            </View>
          </View>

          {/* Reorder Button */}
          {/* <TouchableOpacity style={styles.reorderButton} activeOpacity={0.8}>
            <Feather name="refresh-cw" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.reorderButtonText}>{t("Reorder")}</Text>
          </TouchableOpacity> */}

          {/* Support Button */}
          <TouchableOpacity style={styles.supportButton}>
            <Feather name="help-circle" size={18} color="#6b7280" style={{ marginRight: 8 }} />
            <Text style={styles.supportButtonText}>{t("Need help with this order?")}</Text>
          </TouchableOpacity>
        </Animated.ScrollView>
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  mainContainer: {
    flex: 1,
  },
  header: {
    height: HEADER_HEIGHT,
    width: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: "hidden",
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Platform.OS === "ios" ? 20 : 40,
  },
  headerImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
    textShadowColor: "rgba(0,0,0,0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  compactHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: COMPACT_HEADER_HEIGHT,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 60,
    paddingTop: Platform.OS === "ios" ? 10 : 40,
  },
  compactTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  backBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 10 : 40,
    left: 16,
    zIndex: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
    marginTop: COMPACT_HEADER_HEIGHT,
  },
  scrollContent: {
    paddingTop: HEADER_HEIGHT - COMPACT_HEADER_HEIGHT + 10,
    paddingBottom: 30,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
  },
  itemCountBadge: {
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemCountText: {
    color: "#059669",
    fontWeight: "600",
    fontSize: 12,
  },
  orderInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  orderDateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderDate: {
    fontSize: 14,
    color: "#4b5563",
  },
  orderId: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 16,
  },
  storeInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  storeImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#111827",
  },
  storeButtonsContainer: {
    gap: 8,
  },
  storeButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  storeButtonText: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
    marginRight: 4,
  },
  invoiceButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  invoiceButtonText: {
    fontSize: 14,
    color: "#f59e0b",
    fontWeight: "600",
    marginRight: 4,
  },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    marginHorizontal: 0,
    marginVertical: 3,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  orderItemBorder: {
    // Removed border, using card-style design instead
  },
  orderItemQuantity: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#dcfce7",
  },
  quantityText: {
    fontWeight: "400",
    fontSize: 12,
    color: "#059669",
  },
  orderItemDetails: {
    flex: 1,
    paddingRight: 10,
    justifyContent: "center",
  },
  itemNameContainer: {
    flex: 1,
    justifyContent: "center",
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  rightSection: {
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  itemDescription: {
    fontSize: 11,
    color: "#6b7280",
    lineHeight: 14,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
  itemsListContainer: {
    paddingVertical: 6,
    paddingHorizontal: 0,
  },
  deliveryStepsContainer: {
    marginBottom: 16,
  },
  deliveryStep: {
    flexDirection: "row",
    marginBottom: 8,
    position: "relative",
  },
  deliveryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 2,
  },
  deliveryAddress: {
    fontSize: 15,
    color: "#111827",
    lineHeight: 22,
  },
  deliveryConnector: {
    position: "absolute",
    left: 20,
    top: 40,
    bottom: -20,
    width: 1,
    alignItems: "center",
  },
  connectorLine: {
    width: 1,
    height: "100%",
    backgroundColor: "#d1d5db",
  },
  connectorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#059669",
    position: "absolute",
    top: "50%",
    marginTop: -3,
  },
  estimatedDelivery: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9fafb",
    paddingVertical: 10,
    borderRadius: 8,
  },
  estimatedDeliveryText: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: "#4b5563",
  },
  summaryValue: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#059669",
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  paymentMethodText: {
    fontSize: 14,
    color: "#6b7280",
  },
  reorderButton: {
    backgroundColor: "#059669",
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  reorderButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  supportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginBottom: 16,
  },
  supportButtonText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  statusBadgeText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
    textTransform: "capitalize",
  },
})