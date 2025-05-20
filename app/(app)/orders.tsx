import { useEffect, useState, useRef, useCallback, memo } from "react"
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
  Animated,
  RefreshControl,
  Platform,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useAuth } from "../../context/AuthContext"
import { LinearGradient } from "expo-linear-gradient"
import { useGetOrders } from "../../services/order-service/orders.query"
import { Order } from "../../services/order-service/orders.type"
import Header from "../../components/Header"
import { useTranslation } from "react-i18next"
import "../../i18n"
import { safePush } from "../../utils/navigation"

interface OrderStatusProps {
  status: string;
}

// Memoized Order Status component to prevent unnecessary re-renders
const OrderStatus = memo(({ status }: OrderStatusProps) => {
  const { t } = useTranslation()
  let color = "#10b981"
  let bgColor = "#dcfce7"
  let icon = "check-circle"

  if (status.toLowerCase() === "pending") {
    color = "#f59e0b"
    bgColor = "#fef3c7"
    icon = "clock"
  } else if (status.toLowerCase() === "cancelled") {
    color = "#ef4444"
    bgColor = "#fee2e2"
    icon = "x-circle"
  } else if (status.toLowerCase() === "processing") {
    color = "#3b82f6"
    bgColor = "#dbeafe"
    icon = "refresh-cw"
  }

  return (
    <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
      <Feather name={icon as any} size={12} color={color} style={{ marginRight: 4 }} />
      <Text style={[styles.statusText, { color }]}>{t(status)}</Text>
    </View>
  )
})

interface EmptyStateProps {
  onRefresh: () => void;
}

// Empty state component
const EmptyState = memo(({ onRefresh }: EmptyStateProps) => {
  const { t } = useTranslation()
  return (
    <View style={styles.emptyContainer}>
      <Image
        source={{ uri: "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=500" }}
        style={styles.emptyImage}
      />
      <Text style={styles.emptyTitle}>{t("No orders yet")}</Text>
      <Text style={styles.emptyText}>{t("Your order history will appear here")}</Text>
      <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
        <Feather name="refresh-cw" size={16} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.refreshButtonText}>{t("Refresh")}</Text>
      </TouchableOpacity>
    </View>
  )
})

// Skeleton loading component for order cards
const OrderCardSkeleton = memo(() => {
  const pulseAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: false,
        }),
      ]),
    )

    pulse.start()

    return () => {
      pulse.stop()
    }
  }, [])

  const bgColor = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#f3f4f6", "#e5e7eb"],
  })

  return (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.storeContainer}>
            <Animated.View
              style={[
                styles.storeImage,
                {
                  backgroundColor: bgColor,
                },
              ]}
            />
            <View>
              <Animated.View
                style={{
                  width: 120,
                  height: 16,
                  borderRadius: 4,
                  marginBottom: 6,
                  backgroundColor: bgColor,
                }}
              />
              <Animated.View
                style={{
                  width: 80,
                  height: 12,
                  borderRadius: 4,
                  backgroundColor: bgColor,
                }}
              />
            </View>
          </View>
          <Animated.View
            style={{
              width: 80,
              height: 24,
              borderRadius: 12,
              backgroundColor: bgColor,
            }}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.itemsContainer}>
          {[1, 2].map((_, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Animated.View
                style={[
                  styles.quantityBadge,
                  {
                    backgroundColor: bgColor,
                  },
                ]}
              />
              <Animated.View
                style={{
                  flex: 1,
                  height: 14,
                  borderRadius: 4,
                  backgroundColor: bgColor,
                }}
              />
            </View>
          ))}
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Animated.View
              style={{
                width: 40,
                height: 12,
                borderRadius: 4,
                marginBottom: 6,
                backgroundColor: bgColor,
              }}
            />
            <Animated.View
              style={{
                width: 70,
                height: 18,
                borderRadius: 4,
                backgroundColor: bgColor,
              }}
            />
          </View>

          <Animated.View
            style={{
              width: 90,
              height: 36,
              borderRadius: 8,
              backgroundColor: bgColor,
            }}
          />
        </View>
      </View>
    </View>
  )
})

// Skeleton loading for the entire screen
const SkeletonLoading = memo(() => (
  <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
    {[1, 2, 3].map((_, index) => (
      <OrderCardSkeleton key={index} />
    ))}
  </View>
))

// Memoized Order Card component
const OrderCard = memo<{
  order: Order;
  index: number;
  onPress: () => void;
}>(({ order, index, onPress }) => {
  const { t } = useTranslation()
  // Format date function
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }, [])

  // Animation for each card - only run once on mount
  const translateY = useRef(new Animated.Value(50)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        delay: index * 80, // Reduced delay for faster appearance
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  return (
    <Animated.View style={[styles.cardContainer, { transform: [{ translateY }], opacity }]}>
      <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
        <View style={styles.cardHeader}>
          <View style={styles.storeContainer}>
            <Image
              source={{ uri: order.store.image || "https://images.unsplash.com/photo-1504674900247-0877df9cc836" }}
              style={styles.storeImage}
            />
            <View>
              <Text style={styles.storeName}>{order.store.name}</Text>
              <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
            </View>
          </View>
          <OrderStatus status={order.status} />
        </View>

        <View style={styles.divider} />

        <View style={styles.itemsContainer}>
          {order.items.slice(0, 2).map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <View style={styles.quantityBadge}>
                <Text style={styles.quantityText}>{item.quantity}</Text>
              </View>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.variant.name}
              </Text>
            </View>
          ))}

          {order.items.length > 2 && <Text style={styles.moreItems}>+{order.items.length - 2} {t("more items")}</Text>}
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.totalLabel}>{t("Total")}</Text>
            <Text style={styles.totalPrice}>{parseFloat(order.totalAmount).toFixed(3)} {t("DT")}</Text>
          </View>

          <TouchableOpacity style={styles.reorderButton} activeOpacity={0.8}>
            <Feather name="refresh-cw" size={14} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.reorderText}>{t("Reorder")}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
})

interface FilterTabProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

const FilterTab = memo(({ label, isActive, onPress }: FilterTabProps) => (
  <TouchableOpacity
    style={[styles.filterTab, isActive && styles.activeFilterTab]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.filterText, isActive && styles.activeFilterText]}>{label}</Text>
  </TouchableOpacity>
))

export default function OrdersScreen() {
  const { session } = useAuth()
  const { data: userOrders, isLoading, refetch } = useGetOrders(session?.user.id)
  const [refreshing, setRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState("all")
  const scrollY = useRef(new Animated.Value(0)).current
  const router = useRouter()
  const { t } = useTranslation()

  // Animation values
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.9],
    extrapolate: "clamp",
  })

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [120, 80],
    extrapolate: "clamp",
  })

  // Optimized refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  // Filter orders based on active filter - memoized to prevent recalculation
  const filteredOrders = useCallback(() => {
    if (!userOrders) return []

    return userOrders.filter((order) => {
      if (activeFilter === "all") return true
      return order.status.toLowerCase() === activeFilter.toLowerCase()
    })
  }, [userOrders, activeFilter])

  // Memoized handler for order press
  const handleOrderPress = useCallback(
    (order) => {
      safePush( {pathname: "/(app)/order-details", params: { order: JSON.stringify(order) }})
    },
    [router],
  )

  // Render item for FlatList - memoized
  const renderItem = useCallback(
    ({ item, index }) => <OrderCard order={item} index={index} onPress={() => handleOrderPress(item)} />,
    [handleOrderPress],
  )

  // Optimized key extractor
  const keyExtractor = useCallback((item) => item.id, [])

  // Filter tabs data
  const filterTabs = [
    { id: "all", label: t("All") },
    { id: "pending", label: t("Pending") },
    { id: "delivered", label: t("Delivered") },
    { id: "cancelled", label: t("Cancelled") },
  ]

  return (
    <SafeAreaView style={styles.container}>

      {/* Animated Header */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient colors={["#059669", "#10b981"]} style={StyleSheet.absoluteFillObject} />
        <Header title={t("My Orders")} opacity={1} onBack={() => safePush({pathname: `/(app)/account`})} onSearch={() => {}}  scrollY={scrollY}  />

      </Animated.View>


      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {filterTabs.map((tab) => (
          <FilterTab
            key={tab.id}
            label={tab.label}
            isActive={activeFilter === tab.id}
            onPress={() => setActiveFilter(tab.id)}
          />
        ))}
      </View>

      {isLoading && !refreshing ? (
        <SkeletonLoading />
      ) : (
        <Animated.FlatList
          data={filteredOrders()}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#059669"]}
              tintColor="#059669"
            />
          }
          ListEmptyComponent={<EmptyState onRefresh={handleRefresh} />}
          initialNumToRender={5}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={Platform.OS === "android"}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    width: "100%",
    height: 100,
    zIndex: 10,
  },
  headerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 15 : 30,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fff",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
  },
  activeFilterTab: {
    backgroundColor: "#059669",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4b5563",
  },
  activeFilterText: {
    color: "#fff",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  cardContainer: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  storeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  storeImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  storeName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111",
  },
  orderDate: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginVertical: 12,
  },
  itemsContainer: {
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  quantityBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  quantityText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#4b5563",
  },
  itemName: {
    fontSize: 14,
    color: "#4b5563",
    flex: 1,
  },
  moreItems: {
    fontSize: 13,
    color: "#059669",
    fontWeight: "500",
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 2,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
  },
  reorderButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#059669",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  reorderText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 24,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#059669",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
})
