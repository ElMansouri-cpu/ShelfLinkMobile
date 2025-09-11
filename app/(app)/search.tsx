import { useEffect, useState, useRef, useCallback } from "react"
import { View, Text, TouchableOpacity, Image, Animated, ActivityIndicator, FlatList, TextInput } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useCart } from "../../context/CartContext"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useSearchProducts } from "../../services/product-service/product.query"
import ProductCard from "../../components/product/ProductCard"
import ProductDetailsModal from "./store/[id]/categories/product-details-modal"
import { useTranslation } from "react-i18next"
import { Feather } from "@expo/vector-icons"

export default function SearchScreen() {
  const { store: storeParam, categories: categoriesParam, selectedCategory: selectedCategoryParam } = useLocalSearchParams<{
    store: string
    categories: string
    selectedCategory: string
  }>()
  
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const bottomPadding = insets.bottom + 70
  
  const storeInfo = JSON.parse(storeParam || "{}")
  const parsedCategories = JSON.parse(categoriesParam || "[]")
  const selectedCategoryInfo = JSON.parse(selectedCategoryParam || "{}")
  
  // Debug store info
  console.log('Search - Store Param:', storeParam)
  console.log('Search - Store Info:', storeInfo)
  console.log('Search - Store ID:', storeInfo?.organization?.id || storeInfo?.id)
  
  // If store info is empty, try to get it from the URL or show error
  const hasValidStore = storeInfo && (storeInfo.organization?.id || storeInfo.id)
  
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false)
  
  // State for product modal
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  
  const { items, addToCart, removeFromCart, getTotalPrice } = useCart()
  const totalPrice = getTotalPrice()
  const formattedTotal = totalPrice.toFixed(3)
  
  // Get search products
  const {
    data: searchProductsPages,
    error: searchError,
    isLoading: searchLoading,
    isFetchingNextPage: searchIsFetchingNextPage,
    hasNextPage: searchHasNextPage,
    fetchNextPage: searchFetchNextPage,
    refetch: refetchSearchProducts,
  } = useSearchProducts(hasValidStore ? (storeInfo?.organization?.id || storeInfo?.id) : "", searchQuery)

  // Flatten all products from all pages
  const allProducts = searchProductsPages?.pages.flatMap(page => page.items) || []
  const totalProducts = searchProductsPages?.pages[0]?.total || 0

  // Handle infinite scroll
  const handleLoadMore = useCallback(() => {
    if (searchHasNextPage && !searchIsFetchingNextPage) {
      searchFetchNextPage()
    }
  }, [searchHasNextPage, searchIsFetchingNextPage, searchFetchNextPage])

  // Refetch search products when search query changes
  useEffect(() => {
    if (searchQuery && searchQuery.length > 0 && hasValidStore) {
      refetchSearchProducts()
    }
  }, [searchQuery, refetchSearchProducts, hasValidStore])

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

  // Cart management functions
  const handleAddToCart = (product) => {
    // Determine the correct price - use promotional price if available
    const price = product.isPromo && product.promoPriceTtc 
      ? parseFloat(product.promoPriceTtc) 
      : product.sellPriceTtc;
    
    addToCart({
      id: product.id,
      name: product.name,
      sellPriceTtc: price,
      image: product.mainImage || product.image
    })
  }

  const handleRemoveFromCart = (product) => {
    removeFromCart(product.id)
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: 8,
          backgroundColor: "white",
          borderBottomWidth: 1,
          borderBottomColor: "#e5e7eb",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "#f3f4f6",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Feather name="arrow-left" size={20} color="#374151" />
        </TouchableOpacity>
        
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#f3f4f6",
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: isSearchFocused ? "#10b981" : "transparent",
            }}
          >
            <Feather 
              name="search" 
              size={18} 
              color={isSearchFocused ? "#10b981" : "#6b7280"} 
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={{
                flex: 1,
                fontSize: 16,
                color: "#374151",
                padding: 0,
              }}
              placeholder={t("Search products...")}
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              returnKeyType="search"
              autoFocus={true}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={{ marginLeft: 8 }}
              >
                <Feather name="x" size={18} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>


      {/* Search Results */}
      {searchQuery.length > 0 && (
        <>
          {/* Loading indicator */}
          {searchLoading && (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#10b981" />
              <Text style={{ marginTop: 8, color: '#6b7280' }}>{t("Searching products...")}</Text>
            </View>
          )}

          {/* Results Header */}
          {!searchLoading && (
            <View style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: "white",
              marginBottom: 8,
            }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#374151" }}>
                {t("Search Results")} - "{searchQuery}"
              </Text>
              <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
                {t("Found")} {totalProducts} {totalProducts === 1 ? t("product") : t("products")}
              </Text>
            </View>
          )}

          {/* Products List */}
          {!searchLoading && (
            <FlatList
              data={allProducts}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={{ paddingHorizontal: 16 }}
              renderItem={({ item, index }) => (
                <View style={{ 
                  flex: 1, 
                  marginHorizontal: 8, 
                  marginBottom: 16,
                  marginTop: index < 2 ? 16 : 0
                }}>
                  <ProductCard
                    product={item}
                    onPress={() => handleProductPress(item)}
                    onAddToCart={() => handleAddToCart(item)}
                    onRemoveFromCart={() => handleRemoveFromCart(item)}
                    quantity={items.find(cartItem => cartItem.id === item.id)?.quantity || 0}
                    index={index}
                  />
                </View>
              )}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.1}
              ListFooterComponent={() => (
                <View>
                  {/* Loading indicator for next page */}
                  {searchIsFetchingNextPage && (
                    <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                      <ActivityIndicator size="large" color="#10b981" />
                      <Text style={{ marginTop: 8, color: '#6b7280' }}>{t("Loading more products...")}</Text>
                    </View>
                  )}

                  {/* End of list indicator */}
                  {!searchHasNextPage && allProducts.length > 0 && (
                    <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                      <Text style={{ color: '#6b7280', fontSize: 14 }}>
                        {t("All products loaded")} ({allProducts.length} of {totalProducts})
                      </Text>
                    </View>
                  )}
                </View>
              )}
              contentContainerStyle={{ paddingBottom: bottomPadding }}
            />
          )}

          {/* No Results */}
          {!searchLoading && allProducts.length === 0 && searchQuery.length > 0 && (
            <View style={{ 
              flex: 1, 
              alignItems: 'center', 
              justifyContent: 'center',
              paddingHorizontal: 32,
            }}>
              <Feather name="search" size={64} color="#d1d5db" />
              <Text style={{ 
                fontSize: 18, 
                fontWeight: "600", 
                color: "#6b7280", 
                marginTop: 16,
                textAlign: 'center',
              }}>
                {t("No products found")}
              </Text>
              <Text style={{ 
                fontSize: 14, 
                color: "#9ca3af", 
                marginTop: 8,
                textAlign: 'center',
              }}>
                {t("Try adjusting your search terms or browse our categories")}
              </Text>
            </View>
          )}
        </>
      )}

      {/* Initial State - No Search Query */}
      {searchQuery.length === 0 && (
        <View style={{ 
          flex: 1, 
          alignItems: 'center', 
          justifyContent: 'center',
          paddingHorizontal: 32,
        }}>
          {!hasValidStore ? (
            <>
              <Feather name="alert-circle" size={64} color="#ef4444" />
              <Text style={{ 
                fontSize: 18, 
                fontWeight: "600", 
                color: "#ef4444", 
                marginTop: 16,
                textAlign: 'center',
              }}>
                {t("Store not found")}
              </Text>
              <Text style={{ 
                fontSize: 14, 
                color: "#9ca3af", 
                marginTop: 8,
                textAlign: 'center',
              }}>
                {t("Please go back and select a store first")}
              </Text>
            </>
          ) : (
            <>
              <Feather name="search" size={64} color="#d1d5db" />
              <Text style={{ 
                fontSize: 18, 
                fontWeight: "600", 
                color: "#6b7280", 
                marginTop: 16,
                textAlign: 'center',
              }}>
                {t("Search for products")}
              </Text>
              <Text style={{ 
                fontSize: 14, 
                color: "#9ca3af", 
                marginTop: 8,
                textAlign: 'center',
              }}>
                {t("Type in the search bar above to find what you're looking for")}
              </Text>
            </>
          )}
        </View>
      )}

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
        storeId={hasValidStore ? (storeInfo?.organization?.id || storeInfo?.id) : ""}
      />
    </View>
  )
}
