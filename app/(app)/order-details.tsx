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
  return (
    <View style={[styles.orderItem, !isLast && styles.orderItemBorder]}>
      <View style={styles.orderItemQuantity}>
        <Text style={styles.quantityText}>{item.quantity}×</Text>
      </View>

      <View style={styles.orderItemDetails}>
        <Text style={styles.itemName}>{item.variant.name}</Text>
        {item.variant.description && (
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.variant.description}
          </Text>
        )}
      </View>

      <Text style={styles.itemPrice}>{parseFloat(item.totalAmount).toFixed(3)} {t("DT")}</Text>
    </View>
  )
}

export default function OrderDetailsScreen() {
  const { order: orderParam } = useLocalSearchParams()
  const router = useRouter()
  const { t } = useTranslation()
  const orderDetails = JSON.parse(orderParam as string)
  const [clientAddress, setClientAddress] = useState("Loading...")
  const [storeAddress, setStoreAddress] = useState("Loading...")
  const scrollY = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current
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

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start()

    async function fetchAddress() {
      const addr = await getAddressFromCoords(orderDetails.latitude, orderDetails.longitude)
      setClientAddress(addr)
    }
    async function fetchStoreAddress() {
      const addr = await getAddressFromCoords(orderDetails.store.latitude, orderDetails.store.longitude)
      setStoreAddress(addr)
    }

    fetchAddress()
    fetchStoreAddress()
  }, [orderDetails.latitude, orderDetails.longitude])

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
                uri: orderDetails.store.image || "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
              }}
              style={styles.headerImage}
            />
            <Text style={styles.headerTitle}>{orderDetails.store.name}</Text>
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
                  uri: orderDetails.store.image || "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
                }}
                style={styles.storeImage}
              />
              <View style={styles.storeInfo}>
                <Text style={styles.storeName}>{orderDetails.store.name}</Text>
                <TouchableOpacity
                  style={styles.storeButton}
                  onPress={() =>
                      safePush( {pathname: `/(app)/store/${orderDetails.store.id}`, params: { store: JSON.stringify(orderDetails.store) }})
                    }
                  activeOpacity={0.7}
                >
                  <Text style={styles.storeButtonText}>{t("Visit store")}</Text>
                  <Feather name="chevron-right" size={16} color="#059669" />
                </TouchableOpacity>
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

            {orderDetails.items.map((item: any, idx: number) => (
              <OrderItem key={idx} item={item} isLast={idx === orderDetails.items.length - 1} />
            ))}
          </View>

          {/* Delivery Details Card */}
          <View style={styles.card}>
            <View style={styles.cardTitleContainer}>
              <Feather name="map" size={20} color="#059669" style={{ marginRight: 10 }} />
              <Text style={styles.cardTitle}>{t("Delivery Details")}</Text>
            </View>

            <View style={styles.deliveryStepsContainer}>
              <DeliveryStep type="from" address={orderDetails.store.location.address} isFirst={true} isLast={false} />

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
              <Text style={styles.summaryValue}>{orderDetails && (orderDetails.totalAmount - (deliveryFee + serviceFee)).toFixed(3)} {t("DT")}</Text>
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
          <TouchableOpacity style={styles.reorderButton} activeOpacity={0.8}>
            <Feather name="refresh-cw" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.reorderButtonText}>{t("Reorder")}</Text>
          </TouchableOpacity>

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
    backgroundColor: "#f8fafc",
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
  orderItem: {
    flexDirection: "row",
    paddingVertical: 12,
  },
  orderItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  orderItemQuantity: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  quantityText: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#059669",
  },
  orderItemDetails: {
    flex: 1,
    paddingRight: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
    color: "#111827",
  },
  itemDescription: {
    fontSize: 14,
    color: "#6b7280",
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
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
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
    textTransform: "capitalize",
  },
})
