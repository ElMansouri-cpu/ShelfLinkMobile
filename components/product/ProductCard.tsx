import React from 'react'
import { useEffect, useRef } from "react"
import { View, Text,  TouchableOpacity, Image, Dimensions, Animated } from "react-native"
import { Feather } from "@expo/vector-icons"
import { useTranslation } from 'react-i18next'

const ProductCard = ({ product, onPress, onAddToCart, onRemoveFromCart, quantity, index }) => {
    const { t } = useTranslation()
    const scale = useRef(new Animated.Value(1)).current
    const opacity = useRef(new Animated.Value(0)).current
    const translateY = useRef(new Animated.Value(20)).current
    const { width } = Dimensions.get("window")
    const PRODUCT_CARD_WIDTH = (width - 48) / 2
    const PRODUCT_CARD_HEIGHT = 220
    
    useEffect(() => {
      // Staggered animation for each card
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          delay: index * 50,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          delay: index * 50,
          useNativeDriver: true,
        }),
      ]).start()
    }, [])
  
    const handlePressIn = () => {
      Animated.spring(scale, {
        toValue: 0.97,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }).start()
    }
  
    const handlePressOut = () => {
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }).start()
    }
  
    return (
      <Animated.View
        style={{
          width: PRODUCT_CARD_WIDTH,
          height: PRODUCT_CARD_HEIGHT,
          marginBottom: 16,
          borderRadius: 16,
          backgroundColor: "white",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
          transform: [{ scale }, { translateY }],
          opacity,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={{ flex: 1 }}
        >
          {/* Promotional Badge */}
          {product.isPromo && (
            <View style={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: '#ef4444',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 12,
              zIndex: 1,
            }}>
              <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                {t('SALE')}
              </Text>
            </View>
          )}
          <View style={{ padding: 12, flex: 1 }}>
            <View style={{ height: 120, alignItems: "center", justifyContent: "center" }}>
              {product.mainImage || product.image ? (
                <Image
                  source={{ uri: product.mainImage || product.image }}
                  style={{ height: 100, width: 100 }}
                  resizeMode="contain"
                  resizeMethod="resize"
                />
              ) : (
                <View style={{ 
                  height: 100, 
                  width: 100, 
                  backgroundColor: '#f3f4f6', 
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Feather name="image" size={32} color="#9ca3af" />
                </View>
              )}
            </View>
  
            <View style={{ flex: 1, justifyContent: "space-between" }}>
              <Text style={{ fontSize: 14, fontWeight: "500", color: "#374151", marginBottom: 4 }} numberOfLines={2}>
                {product.name}
              </Text>
  
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
                <View>
                  {product.isPromo && product.promoPriceTtc ? (
                    <>
                      <Text style={{ fontSize: 14, fontWeight: "500", color: "#6b7280", textDecorationLine: 'line-through' }}>
                        {product.sellPriceTtc} DT
                      </Text>
                      <Text style={{ fontSize: 16, fontWeight: "bold", color: "#ef4444" }}>
                        {product.promoPriceTtc} DT
                      </Text>
                    </>
                  ) : (
                    <Text style={{ fontSize: 16, fontWeight: "bold", color: "#111" }}>
                      {product.sellPriceTtc} DT
                    </Text>
                  )}
                </View>
  
                {quantity > 0 ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#10b981",
                      borderRadius: 20,
                      overflow: "hidden",
                      height: 32,
                    }}
                  >
                    <TouchableOpacity
                      style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}
                      onPress={onRemoveFromCart}
                    >
                      <Feather name="minus" size={16} color="white" />
                    </TouchableOpacity>
  
                    <Text style={{ color: "white", fontWeight: "bold", paddingHorizontal: 4 }}>{quantity}</Text>
  
                    <TouchableOpacity
                      style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}
                      onPress={onAddToCart}
                    >
                      <Feather name="plus" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={{
                      backgroundColor: "#f0fdf4",
                      borderWidth: 1,
                      borderColor: "#10b981",
                      borderRadius: 20,
                      width: 32,
                      height: 32,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onPress={onAddToCart}
                  >
                    <Feather name="plus" size={16} color="#10b981" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    )
  }
  

export default ProductCard