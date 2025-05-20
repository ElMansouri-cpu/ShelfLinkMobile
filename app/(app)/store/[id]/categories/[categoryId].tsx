import { useEffect, useState, useRef } from "react"
import { View, Text, ScrollView, TouchableOpacity, Image, Animated } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useCart } from "../../../../../context/CartContext"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Header from "../../../../../components/Header"
import { useGetProductsByCategorie } from "../../../../../services/product-service/product.query"
import ProductDetailsModal from "./product-details-modal"
import ProductGrid from "../../../../../components/product/ProductGrid"
import CategoryTabsSkeleton from "../../../../../components/product/CategoryTabsSkeleton"
import { useTranslation } from "react-i18next"


interface Category {
  id: string
  name: string
  image: string
}
export default function CategoryScreen() {
  const {
    selectedCategory,
    categories: categoriesParam,
    store: storeParam,
  } = useLocalSearchParams<{
    id: string
    selectedCategory: string
    categories: string
    store: string
  }>()
  const { t } = useTranslation()
  const scrollViewRef = useRef<ScrollView>(null)
  const parsedCategories: Category[] = JSON.parse(categoriesParam || "[]")
  const selectedCategoryInfo = JSON.parse(selectedCategory as string)
  const storeInfo = JSON.parse(storeParam as string)
  const [activeTab, setActiveTab] = useState<string>(selectedCategoryInfo?.id || "")
  const insets = useSafeAreaInsets()
  const bottomPadding = insets.bottom + 70
  const { items, getTotalPrice } = useCart()
  const totalPrice = getTotalPrice()
  const formattedTotal = totalPrice.toFixed(3)
  const router = useRouter()

  // State for product modal
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)

  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current

  const {
    data: products,
    error: productserror,
    isLoading: loading,
    refetch,
  } = useGetProductsByCategorie(storeInfo.id, activeTab || selectedCategoryInfo.id)

  useEffect(() => {
    // Find the index of the selected category
    const selectedIndex = parsedCategories.findIndex((cat) => cat.id === activeTab)
    if (selectedIndex !== -1 && scrollViewRef.current) {
      // Calculate approximate position
      const scrollToX = selectedIndex * 130
      scrollViewRef.current.scrollTo({ x: scrollToX, animated: true })
    }

    // When tab changes, show loading state and refetch products

  }, [activeTab, refetch])

  // Get active category name
  const activeCategoryName = parsedCategories.find((category) => category.id === activeTab)?.name || "Category"

  // Handle tab change with animation
  const handleTabChange = (categoryId) => {
    // Only change if it's a different tab
    if (categoryId !== activeTab) {
      setActiveTab(categoryId)
    }
  }

  // Handle product press to show modal
  const handleProductPress = (product) => {
    setSelectedProduct(product)
    setModalVisible(true)
  }

  // Handle modal close
  const handleCloseModal = () => {
    setModalVisible(false)
    // Optional: clear selected product after animation completes
    setTimeout(() => {
      setSelectedProduct(null)
    }, 300)
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <Header
        title={activeCategoryName}
        onBack={() => router.back()}
        onSearch={() => router.push("/(app)/search")}
        scrollY={scrollY}
      />

      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomPadding, paddingTop: insets.top }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 8,
            backgroundColor: "white",
          }}
        >
          {/* <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "#f3f4f6",
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={() => router.back()}
            >
              <Feather name="arrow-left" size={22} color="#111" />
            </TouchableOpacity>

            <Text style={{ fontSize: 20, fontWeight: "bold", color: "#111" }}>{activeCategoryName}</Text>

            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "#f3f4f6",
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={() => router.push("/(app)/search")}
            >
              <Feather name="search" size={22} color="#111" />
            </TouchableOpacity>
          </View> */}

          {/* Category Tabs */}
          {loading && parsedCategories.length === 0 ? (
            <CategoryTabsSkeleton />
          ) : (
            <ScrollView
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
            >
              {parsedCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={{
                    marginRight: 12,
                    backgroundColor: activeTab === category.id ? "#10b981" : "white",
                    borderRadius: 12,
                    padding: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: activeTab === category.id ? "#10b981" : "#e5e7eb",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: activeTab === category.id ? 0.1 : 0,
                    shadowRadius: 4,
                    elevation: activeTab === category.id ? 2 : 0,
                  }}
                  onPress={() => handleTabChange(category.id)}
                >
                  <Image
                    source={{ uri: category.image }}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      marginRight: 8,
                      borderWidth: 1,
                      borderColor: activeTab === category.id ? "rgba(255,255,255,0.3)" : "#f3f4f6",
                    }}
                    resizeMode="cover"
                    resizeMethod="resize"
                  />
                  <Text
                    style={{
                      fontWeight: "600",
                      color: activeTab === category.id ? "white" : "#4b5563",
                    }}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Products Grid */}
        <View style={{ flex: 1, paddingTop: 16 }}>
          {activeTab && (
            <ProductGrid
              storeID={String(storeInfo.id)}
              error={productserror}
              loading={loading }
              products={products}
              refetch={refetch}
              onProductPress={handleProductPress}
            />
          )}
        </View>
      </Animated.ScrollView>

      {/* Cart Button */}
      {items.length > 0 && (
        <View
          style={{
            position: "absolute",
            bottom: insets.bottom > 0 ? insets.bottom : 16,
            left: 16,
            right: 16,
          }}
        >
          <TouchableOpacity
            style={{
              backgroundColor: "#10b981",
              borderRadius: 16,
              paddingVertical: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              shadowColor: "#10b981",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
            }}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: "/(app)/cart/cart",
                params: {
                  store: JSON.stringify(storeInfo),
                },
              })
            }
          >
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>
                {items.reduce((sum, item) => sum + item.quantity, 0)}
              </Text>
            </View>

            <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>{t("View Cart")}</Text>

            <Text style={{ color: "white", fontWeight: "bold", fontSize: 18 }}>{formattedTotal} DT</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Product Details Modal */}
      <ProductDetailsModal
        product={selectedProduct}
        visible={modalVisible}
        onClose={handleCloseModal}
        storeId={storeInfo.id}
      />
    </View>
  )
}
