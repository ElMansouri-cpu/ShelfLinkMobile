import { useEffect, useState, useRef, useCallback } from "react"
import { View, Text, ScrollView, TouchableOpacity, Image, Animated, ActivityIndicator, FlatList, Alert } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useCart } from "../../../../../context/CartContext"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Header from "../../../../../components/Header"
import { useGetProductsByCategorie, useGetProductsByBrandAndCategorie, useGetPromotionalProducts } from "../../../../../services/product-service/product.query"
import { useGetBrandsByCategorie } from "../../../../../services/categorie-service/categorie.query"
import ProductDetailsModal from "./product-details-modal"
import ProductCard from "../../../../../components/product/ProductCard"
import CategoryTabsSkeleton from "../../../../../components/product/CategoryTabsSkeleton"
import { useTranslation } from "react-i18next"
import { Feather } from "@expo/vector-icons"

interface Category {
  id: string
  name: string
  imageUrl: string
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
  
  // Add static promotions category
  const allCategories = [
    {
      id: "promotions",
      name: t("Promotions"),
      imageUrl: "https://via.placeholder.com/32x32/10b981/ffffff?text=🎯"
    },
    ...parsedCategories
  ]
  
  const [activeTab, setActiveTab] = useState<string>(selectedCategoryInfo?.id || "")
  const insets = useSafeAreaInsets()
  const bottomPadding = insets.bottom + 70
  const { items, getTotalPrice, addToCart, removeFromCart } = useCart()
  const totalPrice = getTotalPrice()
  const formattedTotal = totalPrice.toFixed(3)
  const router = useRouter()

  // State for product modal
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  
  // State for sorting
  const [sortBy, setSortBy] = useState("default")
  
    // State for brand selection
  const [selectedBrand, setSelectedBrand] = useState<string>("")
  
  // State to prevent multiple rapid navigations
  const [isNavigating, setIsNavigating] = useState(false)
  
  // Check if promotions category is selected
  const isPromotionsCategory = activeTab === "promotions"

  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current

  const {
    data: productsPages,
    error: productserror,
    isLoading: loading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useGetProductsByCategorie(
    storeInfo.organization.id, 
    activeTab || selectedCategoryInfo.id,
    !isPromotionsCategory // Only enable when not in promotions category
  )

  // Get brands for the selected category - only when not in promotions category
  const {
    data: brands,
    isLoading: brandsLoading,
    refetch: refetchBrands,
  } = useGetBrandsByCategorie(
    storeInfo.organization.id, 
    activeTab || selectedCategoryInfo.id,
    !isPromotionsCategory // Only enable when not in promotions category
  )

  // Get products by brand and category when a brand is selected
  const {
    data: brandProductsPages,
    error: brandProductserror,
    isLoading: brandProductsLoading,
    isFetchingNextPage: brandIsFetchingNextPage,
    hasNextPage: brandHasNextPage,
    fetchNextPage: brandFetchNextPage,
    refetch: refetchBrandProducts,
  } = useGetProductsByBrandAndCategorie(
    storeInfo.organization.id,
    selectedBrand,
    activeTab || selectedCategoryInfo.id,
    !isPromotionsCategory // Only enable when not in promotions category
  )

  // Get promotional products when promotions category is selected
  const {
    data: promotionalProductsPages,
    error: promotionalProductserror,
    isLoading: promotionalProductsLoading,
    isFetchingNextPage: promotionalIsFetchingNextPage,
    hasNextPage: promotionalHasNextPage,
    fetchNextPage: promotionalFetchNextPage,
    refetch: refetchPromotionalProducts,
  } = useGetPromotionalProducts(storeInfo.organization.id)
  
  // Flatten all products from all pages - prioritize promotions, then brand, then category
  const allProducts = isPromotionsCategory
    ? (promotionalProductsPages?.pages.flatMap(page => page.items) || [])
    : selectedBrand 
      ? (brandProductsPages?.pages.flatMap(page => page.items) || [])
      : (productsPages?.pages.flatMap(page => page.items) || [])
  
  const totalProducts = isPromotionsCategory
    ? (promotionalProductsPages?.pages[0]?.total || 0)
    : selectedBrand
      ? (brandProductsPages?.pages[0]?.total || 0)
      : (productsPages?.pages[0]?.total || 0)

  // Handle infinite scroll
  const handleLoadMore = useCallback(() => {
    if (isPromotionsCategory) {
      // Load more promotional products
      if (promotionalHasNextPage && !promotionalIsFetchingNextPage) {
        promotionalFetchNextPage()
      }
    } else if (selectedBrand) {
      // Load more brand products
      if (brandHasNextPage && !brandIsFetchingNextPage) {
        brandFetchNextPage()
      }
    } else {
      // Load more category products
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    }
  }, [isPromotionsCategory, promotionalHasNextPage, promotionalIsFetchingNextPage, promotionalFetchNextPage, selectedBrand, hasNextPage, isFetchingNextPage, fetchNextPage, brandHasNextPage, brandIsFetchingNextPage, brandFetchNextPage])

  useEffect(() => {
    // Find the index of the selected category
    const selectedIndex = allCategories.findIndex((cat) => cat.id === activeTab)
    if (selectedIndex !== -1 && scrollViewRef.current) {
      // Calculate approximate position
      const scrollToX = selectedIndex * 130
      scrollViewRef.current.scrollTo({ x: scrollToX, animated: true })
    }

    // Reset selected brand when category changes
    setSelectedBrand("")

    // When tab changes, show loading state and refetch products and brands
    if (isPromotionsCategory) {
      refetchPromotionalProducts()
    } else {
      refetch()
      refetchBrands()
    }
  }, [activeTab, refetch, refetchBrands, refetchPromotionalProducts, isPromotionsCategory])

  // Refetch brand products when brand selection changes
  useEffect(() => {
    if (selectedBrand) {
      refetchBrandProducts()
    }
  }, [selectedBrand, refetchBrandProducts])



  // Get active category name
  const activeCategoryName = allCategories.find((category) => category.id === activeTab)?.name || "Category"
  
  // Get selected brand name for display
  const selectedBrandName = selectedBrand ? brands?.find(brand => brand.id === selectedBrand)?.name : null

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

  // Cart management functions
  const handleAddToCart = (product) => {
    // Add to cart logic using cart context
    addToCart({
      id: product.id,
      name: product.name,
      sellPriceTtc: product.sellPriceTtc,
      image: product.mainImage || product.image
    })
    // Optional: Show success feedback
  }

  const handleRemoveFromCart = (product) => {
    // Remove from cart logic using cart context
    removeFromCart(product.id)
    // Optional: Show success feedback
  }

  // Sort products based on selected option
  const sortedProducts = allProducts.sort((a, b) => {
    if (sortBy === "price-asc") return a.sellPriceTtc - b.sellPriceTtc
    if (sortBy === "price-desc") return b.sellPriceTtc - a.sellPriceTtc
    if (sortBy === "name") return a.name.localeCompare(b.name)
    return 0 // default
  })

  return (
    <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <Header
         title={selectedBrandName ? `${activeCategoryName} - ${selectedBrandName}` : activeCategoryName}
        onBack={() => router.back()}
        onSearch={() => router.push("/(app)/search")}
        scrollY={scrollY}
      />

             <View style={{ flex: 1 }}>
         {/* Search Input */}
        <View
          style={{
            paddingHorizontal: 16,
             paddingTop: insets.top + 16,
             paddingBottom: 12,
            backgroundColor: "white",
          }}
        >
                       <View
            style={{
              flexDirection: "row",
              alignItems: "center",
                backgroundColor: "#f3f4f6",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: "transparent",
              }}
            >
              <Feather 
                name="search" 
                size={20} 
                color="#6b7280" 
                style={{ marginRight: 12 }}
              />
            <TouchableOpacity
              style={{
                   flex: 1,
                   flexDirection: "row",
                alignItems: "center",
                   opacity: isNavigating ? 0.6 : 1,
                 }}
                 onPress={() => {
                   // Prevent multiple rapid navigations
                   if (isNavigating) return
                   
                   setIsNavigating(true)
                   
                                     router.replace({
                    pathname: "/(app)/search",
                    params: {
                      store: JSON.stringify(storeInfo),
                      categories: categoriesParam,
                      selectedCategory: selectedCategory,
                    },
                  })
                   
                   // Reset navigation state after a short delay
                   setTimeout(() => {
                     setIsNavigating(false)
                   }, 1000)
                 }}
                 disabled={isNavigating}
               >
                 <Text style={{
                   fontSize: 16,
                   color: isNavigating ? "#6b7280" : "#9ca3af",
                 }}>
                   {isNavigating ? t("Opening search...") : t("Search products...")}
                 </Text>
            </TouchableOpacity>

           </View>
         </View>

         {/* Header with Category Tabs */}
         <View
              style={{
             paddingHorizontal: 16,
             paddingTop: 0,
             paddingBottom: 8,
             backgroundColor: "white",
           }}
         >
          {/* Category Tabs */}
           {loading && allCategories.length === 0 ? (
            <CategoryTabsSkeleton />
          ) : (
            <ScrollView
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
            >
               {allCategories.map((category) => (
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
                    source={{ uri: category.imageUrl }}
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

                                   {/* Brand Tabs - Only show when not in promotions category */}
          {activeTab && !isPromotionsCategory && brands && brands.length > 0 && (
           <View
             style={{
               paddingHorizontal: 16,
               paddingVertical: 8,
               backgroundColor: "white",
               marginBottom: 8,
             }}
           >
             {/* <Text style={{ 
               fontSize: 14, 
               fontWeight: "600", 
               color: "#6b7280", 
               marginBottom: 8,
               paddingLeft: 4 
             }}>
               {t("Brands")}
             </Text> */}
             <ScrollView
               horizontal
               showsHorizontalScrollIndicator={false}
               contentContainerStyle={{ paddingRight: 16 }}
             >
               <TouchableOpacity
                 style={{
                   marginRight: 12,
                   backgroundColor: selectedBrand === "" ? "#10b981" : "white",
                   borderRadius: 12,
                   padding: 12,
                   flexDirection: "row",
                   alignItems: "center",
                   borderWidth: 1,
                   borderColor: selectedBrand === "" ? "#10b981" : "#e5e7eb",
                   shadowColor: "#000",
                   shadowOffset: { width: 0, height: 1 },
                   shadowOpacity: selectedBrand === "" ? 0.1 : 0,
                   shadowRadius: 4,
                   elevation: selectedBrand === "" ? 2 : 0,
                 }}
                 onPress={() => setSelectedBrand("")}
               >
                 <Text
                   style={{
                     fontWeight: "600",
                     color: selectedBrand === "" ? "white" : "#4b5563",
                   }}
                 >
                   {t("All")}
                 </Text>
               </TouchableOpacity>
               
               {brands.map((brand) => (
                 <TouchableOpacity
                   key={brand.id}
                   style={{
                     marginRight: 12,
                     backgroundColor: selectedBrand === brand.id ? "#10b981" : "white",
                     borderRadius: 12,
                     padding: 12,
                     flexDirection: "row",
                     alignItems: "center",
                     borderWidth: 1,
                     borderColor: selectedBrand === brand.id ? "#10b981" : "#e5e7eb",
                     shadowColor: "#000",
                   shadowOffset: { width: 0, height: 1 },
                   shadowOpacity: selectedBrand === brand.id ? 0.1 : 0,
                   shadowRadius: 4,
                   elevation: selectedBrand === brand.id ? 2 : 0,
                 }}
                 onPress={() => setSelectedBrand(brand.id)}
               >
                 {brand.image && (
                   <Image
                     source={{ uri: brand.image }}
                     style={{
                       width: 24,
                       height: 24,
                       borderRadius: 12,
                       marginRight: 8,
                       borderWidth: 1,
                       borderColor: selectedBrand === brand.id ? "rgba(255,255,255,0.3)" : "#f3f4f6",
                     }}
                     resizeMode="cover"
                   />
                 )}
                 <Text
                   style={{
                     fontWeight: "600",
                     color: selectedBrand === brand.id ? "white" : "#4b5563",
                   }}
                 >
                   {brand.name}
                 </Text>
               </TouchableOpacity>
             ))}
           </ScrollView>
         </View>
       )}

                 {/* Products with Infinite Scroll */}
         {activeTab && (
           <>
                           {/* Loading indicator for promotional products */}
              {isPromotionsCategory && promotionalProductsLoading && (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#10b981" />
                  <Text style={{ marginTop: 8, color: '#6b7280' }}>{t("Loading promotional products...")}</Text>
                </View>
              )}

              {/* Loading indicator for brand products */}
              {selectedBrand && brandProductsLoading && !isPromotionsCategory && (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#10b981" />
                  <Text style={{ marginTop: 8, color: '#6b7280' }}>{t("Loading brand products...")}</Text>
                </View>
              )}

              {/* Only show sorting and products when not loading */}
              {!promotionalProductsLoading && !brandProductsLoading && (
               <>
                 {/* Sorting Menu */}
                 {/* <View style={{
                   flexDirection: "row",
                   justifyContent: "space-between",
                   alignItems: "center",
                   paddingHorizontal: 16,
                   paddingVertical: 12,
                   backgroundColor: "white",
                   borderRadius: 12,
                   marginHorizontal: 16,
                   marginBottom: 16,
                   shadowColor: "#000",
                   shadowOffset: { width: 0, height: 1 },
                   shadowOpacity: 0.05,
                   shadowRadius: 8,
                   elevation: 2,
                 }}>
                   <Text style={{ fontSize: 16, fontWeight: "600", color: "#374151" }}>
                     {t("Sort")}
                   </Text>
                   <TouchableOpacity
                     style={{
                       backgroundColor: "#f3f4f6",
                       paddingHorizontal: 16,
                       paddingVertical: 8,
                       borderRadius: 20,
                       flexDirection: "row",
                       alignItems: "center",
                     }}
                     onPress={() => {
                       // Show sorting options
                       Alert.alert(
                         t("Sort"),
                         t("Choose sorting option"),
                         [
                           { text: t("Cancel"), style: "cancel" },
                           { 
                             text: t("Name"), 
                             onPress: () => setSortBy("name") 
                           },
                           { 
                             text: t("Price: Low to High"), 
                             onPress: () => setSortBy("price-asc") 
                           },
                           { 
                             text: t("Price: High to Low"), 
                             onPress: () => setSortBy("price-desc") 
                           },
                         ]
                       )
                     }}
                   >
                     <Text style={{ color: "#374151", fontWeight: "500", marginRight: 8 }}>
                       {sortBy === "name" ? t("Name") : 
                        sortBy === "price-asc" ? t("Price: Low to High") : 
                        sortBy === "price-desc" ? t("Price: High to Low") : 
                        t("Sort")}
                     </Text>
                     <Feather name="chevron-down" size={16} color="#6b7280" />
                   </TouchableOpacity>
                 </View> */}

                 <FlatList
                   data={sortedProducts}
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
                       {(isPromotionsCategory ? promotionalIsFetchingNextPage :
                         selectedBrand ? brandIsFetchingNextPage : isFetchingNextPage) && (
                         <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                           <ActivityIndicator size="large" color="#10b981" />
                           <Text style={{ marginTop: 8, color: '#6b7280' }}>{t("Loading more products...")}</Text>
                         </View>
                       )}

                       {/* End of list indicator */}
                       {!(isPromotionsCategory ? promotionalHasNextPage :
                         selectedBrand ? brandHasNextPage : hasNextPage) && allProducts.length > 0 && (
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
               </>
             )}
           </>
          )}
        </View>

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
        storeId={storeInfo.organization.id}
      />
    </View>
  )
}
