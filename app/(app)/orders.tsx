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
  ScrollView,
  Modal,
  Alert,
  FlatList,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useAuth } from "../../hooks/useAuth"
import { LinearGradient } from "expo-linear-gradient"
import { useGetOrders, useCancelOrder } from "../../services/order-service/orders.query"
import { Order } from "../../services/order-service/orders.type"
import Header from "../../components/Header"
import { useTranslation } from "react-i18next"
import "../../i18n"
import { safePush } from "../../utils/navigation"
import { useNotification } from "../../context/NotificationContext";
import { OrderStatus } from "../../services/order-service/orders.type"
import { useGetAllStores } from "../../services/store-service/store.query"
import { IClientRelationship } from "../../services/store-service/store.types"
interface OrderStatusProps {
  status: string;
}

// Memoized Order Status component to prevent unnecessary re-renders
const OrderStatusBadge = memo(({ status }: OrderStatusProps) => {
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
  onCancelOrder: (orderID: string, organizationId: string) => void;
}>(({ order, index, onPress, onCancelOrder }) => {
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
              source={{ uri: order?.organization?.logoUrl || "https://images.unsplash.com/photo-1504674900247-0877df9cc836" }}
              style={styles.storeImage}
            />
            <View>
                <Text style={styles.storeName}>{order?.organization?.name || "Store"}</Text>
              <Text style={styles.orderDate}>{formatDate(new Date(order.createdAt).toISOString())}</Text>
            </View>
          </View>
          <OrderStatusBadge status={order.status} />
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
          {[OrderStatus.SUBMITTED, OrderStatus.CONFIRMED, OrderStatus.PROCESSING].includes(order.status) && (
            <TouchableOpacity style={styles.cancelButton} activeOpacity={0.8} onPress={() => onCancelOrder(order.id, order.organizationId)}>
              <Feather name="x-circle" size={14} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.cancelText}>{t("Cancel")}</Text>
            </TouchableOpacity>
          )}

          {/* <TouchableOpacity style={styles.reorderButton} activeOpacity={0.8}>
            <Feather name="refresh-cw" size={14} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.reorderText}>{t("Reorder")}</Text>
          </TouchableOpacity> */}
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
  const { user } = useAuth()
  const [activeFilter, setActiveFilter] = useState("all")
  const [selectedOrganization, setSelectedOrganization] = useState<IClientRelationship | null>(null)
  const [showOrganizationModal, setShowOrganizationModal] = useState(false)
  const { data: stores } = useGetAllStores()
  const { 
    data, 
    isLoading, 
    refetch, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useGetOrders(user?.id, selectedOrganization?.organizationId, activeFilter)
  const { lastPayload } = useNotification();
  const { mutate: cancelOrder } = useCancelOrder()

  // Flatten the infinite query data
  const userOrders = data?.pages.flatMap(page => page.items) || []

  // Debug logging for orders list
  useEffect(() => {
    console.log('OrdersScreen - userOrders updated:', {
      userId: user?.id,
      ordersCount: userOrders?.length,
      totalPages: data?.pages.length,
      hasNextPage,
      isLoading,
      error: error?.message,
      lastPayload: lastPayload?.new?.id
    });
  }, [userOrders, isLoading, error, lastPayload, user?.id, data?.pages.length, hasNextPage]);

  const [refreshing, setRefreshing] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState<{id: string, organizationId: string} | null>(null)
  const scrollY = useRef(new Animated.Value(0)).current
  const router = useRouter()
  const { t } = useTranslation()
  useEffect(() => {
    if (lastPayload) {
      refetch();
    }
  }, [lastPayload, refetch]);
  // Animation values
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.9],
    extrapolate: "clamp",
  })

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [100, 52],
    extrapolate: "clamp",
  })

  // Optimized refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  // Load more handler for infinite scroll
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // No need for client-side filtering since backend handles it

  // Memoized handler for order press
  const handleOrderPress = useCallback(
    (order) => {
      safePush( {pathname: "/(app)/order-details", params: { orderId: order.id, organizationId: order.organizationId }})
    },
    [router],
  )

  // Modal handlers
  const handleCancelOrder = (orderID: string, organizationId: string) => {
    setOrderToCancel({ id: orderID, organizationId })
    setShowCancelModal(true)
  }

  const confirmCancelOrder = () => {
    if (orderToCancel) {
      cancelOrder({ orderID: orderToCancel.id, organizationId: orderToCancel.organizationId })
      setShowCancelModal(false)
      setOrderToCancel(null)
    }
  }

  const cancelCancelOrder = () => {
    setShowCancelModal(false)
    setOrderToCancel(null)
  }

  // Organization selection handlers
  const handleOrganizationSelect = (organization: IClientRelationship) => {
    setSelectedOrganization(organization)
    setShowOrganizationModal(false)
  }

  const handleClearOrganizationFilter = () => {
    setSelectedOrganization(null)
  }

  // Render item for FlatList - memoized
  const renderItem = useCallback(
    ({ item, index }) => <OrderCard order={item} index={index} onPress={() => handleOrderPress(item)} onCancelOrder={handleCancelOrder} />,
    [handleOrderPress, handleCancelOrder],
  )

  // Optimized key extractor
  const keyExtractor = useCallback((item) => item.id, [])

  // Filter tabs data
  const filterTabs = [
    { id: "all", label: t("All") },
    { id: "submitted", label: t("Submitted") },
    { id: "confirmed", label: t("CONFIRMED") },
    { id: "processing", label: t("Processing") },
    { id: "shipped", label: t("Shipped") },
    { id: "delivered", label: t("Delivered") },
    { id: "completed", label: t("Completed") },
    { id: "cancelled", label: t("Cancelled") },
  ]


  return (
    <SafeAreaView style={styles.container}>

      {/* Animated Header */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        {/* <LinearGradient colors={["#059669", "#10b981"]} style={StyleSheet.absoluteFillObject} /> */}
        <Header title={t("My Orders")} opacity={1} onBack={() => safePush({pathname: `/(app)/account`})} onSearch={() => {}}  scrollY={scrollY}  />

      </Animated.View>

      {/* Organization Filter */}
      <View style={styles.organizationFilterContainer}>
        {/* <View style={styles.organizationFilterLabelContainer}>
          <Feather name="shopping-bag" size={16} color="#374151" />
          <Text style={styles.organizationFilterLabel}>{t("Filter by Store")}</Text>
        </View> */}
        
        <View style={styles.organizationFilterRow}>
          <TouchableOpacity 
            style={styles.organizationFilterButton}
            onPress={() => setShowOrganizationModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.organizationFilterButtonContent}>
              <View style={styles.organizationFilterButtonLeft}>
                {selectedOrganization?.organization.logoUrl ? (
                  <Image
                    source={{ uri: selectedOrganization.organization.logoUrl }}
                    style={styles.organizationFilterLogo}
                  />
                ) : (
                  <View style={styles.organizationFilterLogoPlaceholder}>
                    <Feather name="shopping-bag" size={14} color="#6b7280" />
                  </View>
                )}
                <View style={styles.organizationFilterTextContainer}>
                  <Text style={styles.organizationFilterText}>
                    {selectedOrganization ? selectedOrganization.organization.name : t("All Stores")}
                  </Text>
                </View>
              </View>
              <Feather name="chevron-down" size={16} color="#6b7280" />
            </View>
          </TouchableOpacity>
          
          {selectedOrganization && (
            <TouchableOpacity 
              style={styles.clearFilterButton}
              onPress={handleClearOrganizationFilter}
              activeOpacity={0.7}
            >
              <Feather name="x" size={16} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {filterTabs.map((tab) => (
            <FilterTab
              key={tab.id}
              label={tab.label}
              isActive={activeFilter === tab.id}
              onPress={() => setActiveFilter(tab.id)}
            />
          ))}
        </ScrollView>
      </View>

      {!user ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, color: '#666' }}>Loading user...</Text>
        </View>
      ) : isLoading && !refreshing ? (
        <SkeletonLoading />
      ) : (
        <Animated.FlatList
          data={userOrders}
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
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.loadingFooter}>
                <Text style={styles.loadingText}>Loading more orders...</Text>
              </View>
            ) : null
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={Platform.OS === "android"}
        />
      )}

      {/* Organization Selection Modal */}
      <Modal
        visible={showOrganizationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOrganizationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowOrganizationModal(false)}
          />
          <View style={styles.organizationModalContent}>
            {/* Modal Handle */}
            <View style={styles.modalHandle} />
            
            <View style={styles.organizationModalHeader}>
              <View style={styles.organizationModalTitleContainer}>
                <Feather name="shopping-bag" size={24} color="#059669" />
                <Text style={styles.organizationModalTitle}>{t("Select Store")}</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setShowOrganizationModal(false)}
                style={styles.closeButton}
              >
                <Feather name="x" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={stores || []}
              keyExtractor={(item) => item.organization.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.organizationItem,
                    selectedOrganization?.organization.id === item.organization.id && styles.selectedOrganizationItem
                  ]}
                  onPress={() => handleOrganizationSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.organizationItemContent}>
                    <View style={styles.organizationItemLeft}>
                      <View style={styles.organizationLogoContainer}>
                        {item.organization.logoUrl ? (
                          <Image
                            source={{ uri: item.organization.logoUrl }}
                            style={styles.organizationLogo}
                          />
                        ) : (
                          <View style={styles.organizationLogoPlaceholder}>
                            <Text style={styles.organizationLogoText}>
                              {item.organization.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.organizationInfo}>
                        <Text style={styles.organizationName}>{item.organization.name}</Text>
                        <Text style={styles.organizationAddress} numberOfLines={1}>
                          {item.organization.address || t("No address available")}
                        </Text>
                        <View style={styles.organizationStats}>
                          <View style={styles.organizationStat}>
                            <Feather name="package" size={12} color="#6b7280" />
                            <Text style={styles.organizationStatText}>
                              {item.organization.productsCount || 0} {t("products")}
                            </Text>
                          </View>
                          <View style={styles.organizationStat}>
                            <Feather name="shopping-cart" size={12} color="#6b7280" />
                            <Text style={styles.organizationStatText}>
                              {item.organization.ordersCount || 0} {t("orders")}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    {selectedOrganization?.organization.id === item.organization.id && (
                      <View style={styles.selectedIndicator}>
                        <Feather name="check-circle" size={24} color="#059669" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              style={styles.organizationList}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.organizationListContent}
            />
          </View>
        </View>
      </Modal>

      {/* Cancel Order Confirmation Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={cancelCancelOrder}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Feather name="alert-triangle" size={24} color="#ef4444" />
              <Text style={styles.modalTitle}>{t("Cancel Order")}</Text>
            </View>
            
            <Text style={styles.modalMessage}>
              {t("Are you sure you want to cancel this order? This action cannot be undone.")}
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelModalButton]} 
                onPress={cancelCancelOrder}
              >
                <Text style={styles.cancelModalButtonText}>{t("Keep Order")}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmModalButton]} 
                onPress={confirmCancelOrder}
              >
                <Text style={styles.confirmModalButtonText}>{t("Cancel Order")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 0,
    paddingTop: Platform.OS === "ios" ? 15 : 0,
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
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  filterScrollContent: {
    paddingHorizontal: 16,
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
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ef4444",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelText: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 12,
    color: "#111",
  },
  modalMessage: {
    fontSize: 16,
    color: "#6b7280",
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelModalButton: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  confirmModalButton: {
    backgroundColor: "#ef4444",
  },
  cancelModalButtonText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 16,
  },
  confirmModalButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#6b7280",
  },
  organizationFilterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  organizationFilterLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  organizationFilterLabel: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  organizationFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  organizationFilterButton: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  organizationFilterButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  organizationFilterButtonLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  organizationFilterLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  organizationFilterLogoPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  organizationFilterTextContainer: {
    flex: 1,
  },
  organizationFilterText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111",
  },
  clearFilterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
  },
  organizationModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "50%",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#d1d5db",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  organizationModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  organizationModalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  organizationModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
    marginLeft: 12,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  organizationList: {
    flex: 1,
  },
  organizationListContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  organizationItem: {
    marginVertical: 4,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  selectedOrganizationItem: {
    backgroundColor: "#f0fdf4",
    borderColor: "#059669",
    borderWidth: 2,
  },
  organizationItemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  organizationItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  organizationLogoContainer: {
    marginRight: 16,
  },
  organizationLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  organizationLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  organizationLogoText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6b7280",
  },
  organizationInfo: {
    flex: 1,
  },
  organizationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    marginBottom: 4,
  },
  organizationAddress: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  organizationStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  organizationStat: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  organizationStatText: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 4,
  },
  selectedIndicator: {
    marginLeft: 12,
  },
})
