import { useState, useEffect, useRef } from "react"
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, StyleSheet, Animated } from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import Svg, { Circle } from "react-native-svg"
import { MapPin, CreditCard, ShoppingBag, ArrowLeft, Check, Clock } from "lucide-react-native"
import { useCart } from "../../context/CartContext"
import { api } from "../../lib/api"
import { useTranslation } from "react-i18next"
import "../../i18n"

export default function OrderConfirmationScreen() {
  const router = useRouter()
  const { clearCart } = useCart()
  const { t } = useTranslation()
  const {
    address,
    payment,
    items: itemsParam,
    store: storeParam,
    client: clientParam,
    total: totalParam,
    totalProducts: totalProductsParam,
    deliveryFee: deliveryFeeParam,
    serviceFee: serviceFeeParam,
    orderType: orderTypeParam,
    markerPosition: markerPositionParam,
  } = useLocalSearchParams()

  const [timer, setTimer] = useState(15)
  const [orderPayload, setOrderPayload] = useState({})
  const [canCancel, setCanCancel] = useState(true)
  const [isConfirming, setIsConfirming] = useState(false)

  const items = typeof itemsParam === "string" ? JSON.parse(itemsParam) : []
  const store = typeof storeParam === "string" ? JSON.parse(storeParam) : null
  const client = typeof clientParam === "string" ? JSON.parse(clientParam) : null
  const total = typeof totalParam === "string" ? JSON.parse(totalParam) : null
  const totalProducts = typeof totalProductsParam === "string" ? JSON.parse(totalProductsParam) : null
  const deliveryFee = typeof deliveryFeeParam === "string" ? JSON.parse(deliveryFeeParam) : null
  const orderType = typeof orderTypeParam === "string" ? JSON.parse(orderTypeParam) : null
  const serviceFee = typeof serviceFeeParam === "string" ? JSON.parse(serviceFeeParam) : null
  const markerPosition = typeof markerPositionParam === "string" ? JSON.parse(markerPositionParam) : null

  const progressAnim = useRef(new Animated.Value(1)).current
  const scaleAnim = useRef(new Animated.Value(1)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Fade in animation for the entire screen
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start()

    setOrderPayload({
      storeId: store?.id,
      userId: client?.id,
      orderType: orderType,
      destination: address,
      latitude: Number.parseFloat(markerPosition?.latitude),
      longitude: Number.parseFloat(markerPosition?.longitude),
      status: "pending",
      items: items.map((item) => ({
        variantId: item.id,
        quantity: item.quantity,
        totalAmount: item.sellPriceTtc * item.quantity,
      })),
      totalAmount: total,
    })
  }, [])

  useEffect(() => {
    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: timer * 1000,
      useNativeDriver: false,
    }).start()
  }, [])

  const createOrder = async () => {
    try {
      setIsConfirming(true)

      // Button animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start()

      const response = await api.post(`/orders/store/${store?.id}`, orderPayload)

      // Success animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        router.replace({
          pathname: "/(app)/order-details",
          params: {
            order: JSON.stringify(response.data),
          },
        })
      })
    } catch (error) {
      console.log(error)
      setIsConfirming(false)
    }
  }

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000)
      return () => clearInterval(interval)
    } else {
      setCanCancel(false)
      createOrder()
    }
  }, [timer])

  const handleContinue = () => {
    createOrder()
    setCanCancel(false)
    clearCart()
  }

  const handleModify = () => {
    router.replace({
      pathname: "/(app)/cart/cart",
      params: {
        store: JSON.stringify(store),
      },
    })
  }

  const calculateTotal = () => {
    if (total) return Number.parseFloat(total).toFixed(2)

    const subtotal = totalProducts || 0
    const delivery = deliveryFee || 0
    const service = serviceFee || 0
    return (subtotal + delivery + service).toFixed(2)
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.mainContainer, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleModify}>
            <ArrowLeft size={22} color="#10b981" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>{t("Confirming your order")}</Text>
            <Text style={styles.subtitle}>{t("Is everything correct?")}</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Delivery Info Card */}
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <MapPin size={20} color="#10b981" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t("Delivery Address")}</Text>
                <Text style={styles.infoValue}>{address || t("select address")}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <CreditCard size={20} color="#10b981" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t("Payment Method")}</Text>
                <Text style={styles.infoValue}>{t(payment) || t("Pay with cash")}</Text>
              </View>
            </View>
          </View>

          {/* Order Items Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <ShoppingBag size={20} color="#10b981" />
              <Text style={styles.cardTitle}>{t("Order Items")}</Text>
            </View>

            {items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.quantityBadge}>
                  <Text style={styles.quantityText}>{item.quantity}x</Text>
                </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                </View>
                <Text style={styles.itemPrice}>{(item.sellPriceTtc * item.quantity).toFixed(2)} {t("DT")}</Text>
              </View>
            ))}
          </View>

          {/* Order Summary Card */}
          <View style={styles.card}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t("Subtotal")}</Text>
              <Text style={styles.summaryValue}>{totalProducts?.toFixed(2) || "0.00"} {t("DT")}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t("Delivery Fee")}</Text>
              <Text style={styles.summaryValue}>{deliveryFee?.toFixed(2) || "0.00"} {t("DT")}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t("Service Fee")}</Text>
              <Text style={styles.summaryValue}>{serviceFee?.toFixed(2) || "0.00"} {t("DT")}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t("Total")}</Text>
              <Text style={styles.totalValue}>{calculateTotal()} {t("DT")}</Text>
            </View>
          </View>

          {/* Estimated Delivery */}
          <View style={styles.estimatedDelivery}>
            <View style={styles.estimatedDeliveryIcon}>
              <Clock size={16} color="#10b981" />
            </View>
            <Text style={styles.estimatedDeliveryText}>{t("Estimated delivery: 30-45 min")}</Text>
          </View>

          {/* Spacer for bottom buttons */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Timer and Buttons */}
        <View style={styles.bottomContainer}>
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{t("Auto-confirming in")} {timer}s</Text>
            <View style={styles.progressContainer}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.modifyButton, !canCancel && styles.disabledButton]}
              onPress={handleModify}
              disabled={!canCancel || isConfirming}
            >
              <Text style={styles.modifyButtonText}>{t("Modify")}</Text>
            </TouchableOpacity>

            <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: 1 }}>
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  !canCancel && styles.successButton,
                  isConfirming && styles.loadingButton,
                ]}
                onPress={handleContinue}
                disabled={!canCancel || isConfirming}
              >
                {!canCancel ? (
                  <View style={styles.buttonContent}>
                    <Check size={18} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.continueButtonText}>{t("Order confirmed!")}</Text>
                  </View>
                ) : isConfirming ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator />
                    <Text style={styles.continueButtonText}>{t("Processing...")}</Text>
                  </View>
                ) : (
                  <Text style={styles.continueButtonText}>{t("Continue")}</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  )
}

// Custom Activity Indicator component
const ActivityIndicator = () => {
  const spinValue = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ).start()
  }, [])

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  })

  return (
    <Animated.View style={{ marginRight: 8, transform: [{ rotate: spin }] }}>
      <Svg height={18} width={18} viewBox="0 0 24 24">
        <Circle cx="12" cy="12" r="10" stroke="#ffffff" strokeWidth="4" strokeDasharray="60 30" fill="none" />
      </Svg>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  mainContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 12,
    backgroundColor: "#f8f9fa",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ecfdf5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  quantityBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ecfdf5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10b981",
  },
  itemDetails: {
    flex: 1,
    paddingRight: 8,
  },
  itemName: {
    fontSize: 16,
    color: "#111827",
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: "#6b7280",
  },
  summaryValue: {
    fontSize: 15,
    color: "#111827",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#10b981",
  },
  estimatedDelivery: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingVertical: 8,
  },
  estimatedDeliveryIcon: {
    marginRight: 6,
  },
  estimatedDeliveryText: {
    fontSize: 14,
    color: "#6b7280",
  },
  bottomContainer: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  timerContainer: {
    marginBottom: 16,
  },
  timerText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 8,
  },
  progressContainer: {
    height: 4,
    backgroundColor: "#e5e7eb",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#10b981",
    borderRadius: 2,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modifyButton: {
    flex: 1,
    height: 56,
    borderWidth: 2,
    borderColor: "#10b981",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  modifyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10b981",
  },
  continueButton: {
    flex: 1,
    height: 56,
    backgroundColor: "#10b981",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    marginRight: 6,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  disabledButton: {
    opacity: 0.5,
  },
  successButton: {
    backgroundColor: "#059669",
  },
  loadingButton: {
    backgroundColor: "#10b981",
    opacity: 0.8,
  },
})
