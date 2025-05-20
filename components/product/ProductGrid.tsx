import React, { useState } from 'react'
import { useCart } from '../../context/CartContext'
import { View, TouchableOpacity, Animated ,Text,Image} from 'react-native'
import ProductCard from './ProductCard'
import ProductGridSkeleton from './ProductGridSkeleton'
import { Feather } from "@expo/vector-icons"
import { useTranslation } from 'react-i18next'


const ProductGrid = ({
    products,
    loading,
    error,
    refetch,
    storeID,
    onProductPress,
  }: {
    products: any
    loading
    error
    refetch
    storeID
    onProductPress: (product: any) => void
  }) => {
    const [sortBy, setSortBy] = useState("default")
    const { addToCart, removeFromCart, items } = useCart()
    const { t } = useTranslation()
  
  
    const getItemQuantity = (productId: string) => {
      const item = items.find((item) => item.id === productId)
      return item ? item.quantity : 0
    }
  
    // Sort products based on selected option
    const sortedProducts =
      products !== undefined &&
      [...products].sort((a, b) => {
        if (sortBy === t("price-asc")) return a.sellPriceTtc - b.sellPriceTtc
        if (sortBy === t("price-desc")) return b.sellPriceTtc - a.sellPriceTtc
        if (sortBy === t("name")) return a.name.localeCompare(b.name)
        return 0 // default
      })
  
    if (loading) {
      return <ProductGridSkeleton />
    }
  
    if (error) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 }}>
          <Feather name="alert-circle" size={48} color="#ef4444" style={{ marginBottom: 16 }} />
          <Text style={{ color: "#ef4444", fontSize: 16, marginBottom: 16 }}>{error.message}</Text>
          <TouchableOpacity
            style={{
              backgroundColor: "#10b981",
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 8,
            }}
            onPress={() => refetch()}
          >
            <Text style={{ color: "white", fontWeight: "600" }}>{t("Retry")}</Text>
          </TouchableOpacity>
        </View>
      )
    }
  
    if (products.length === 0) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 }}>
          <Image
            source={require("../../assets/shopping-bag.png")}
            style={{ width: 200, height: 200, borderRadius: 60, marginBottom: 24 }}
            resizeMethod="resize"
          />
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>{t("No products found")}</Text>
          <Text style={{ color: "#6b7280", textAlign: "center", paddingHorizontal: 32 }}>
                {t("There are no products available in this category at the moment.")}
              </Text>
        </View>
      )
    }
  
    return (
      <View style={{ flex: 1 }}>
        <Animated.View
          style={{
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
            shadowRadius: 5,
            elevation: 1,
          }}
        
        >
          <Text style={{ fontSize: 14, color: "#6b7280" }}>
            {products.length} {products.length === 1 ? t("product") : t("products")}
          </Text>
  
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center" }}
            onPress={() => {
              // Simple sort toggle between options
              if (sortBy === "default") setSortBy("price-asc")
              else if (sortBy === "price-asc") setSortBy("price-desc")
              else if (sortBy === "price-desc") setSortBy("name")
              else setSortBy("default")
            }}
          >
            <Text style={{ fontSize: 14, color: "#10b981", marginRight: 4 }}>
              {sortBy === "default" && t("Sort")}
              {sortBy === "price-asc" && t("Price: Low to High")}
              {sortBy === "price-desc" && t("Price: High to Low")}
              {sortBy === "name" && t("Name")}
            </Text>
            <Feather name="sliders" size={16} color="#10b981" />
          </TouchableOpacity>
        </Animated.View>
  
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            paddingHorizontal: 16,
          }}
        >
          {sortedProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              quantity={getItemQuantity(product.id)}
              onPress={() => onProductPress(product)}
              onAddToCart={() => addToCart(product)}
              onRemoveFromCart={() => removeFromCart(product.id)}
            />
          ))}
        </View>
      </View>
    )
  }

export default ProductGrid