"use client"

import React, { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Animated,
  TextInput,
  Platform,
  ScrollView,
  Easing,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Feather, MaterialIcons, FontAwesome } from "@expo/vector-icons"
import { useCart } from "../../../context/CartContext"
import { LinearGradient } from "expo-linear-gradient"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Header from "../../../components/Header"
import AnimatedPreset, { FadeInDown, FadeOutUp } from "react-native-reanimated"
import { useGetAllCategories } from "../../../services/categorie-service/categorie.query"
import { useTranslation } from 'react-i18next'
import { safePush } from "../../../utils/navigation"
import { useFocusEffect } from '@react-navigation/native';

const BANNER_HEIGHT = 220
const HEADER_HEIGHT = 60

// Skeleton component for store details
const StoreDetailsSkeleton = ({ scrollY, insets }: { scrollY: Animated.Value; insets: any }) => {
  const animatedValue = new Animated.Value(0)

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 800,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
      ]),
    ).start()
  }, [])

  const bgColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["#f3f4f6", "#f9fafb"],
  })

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <Header title="Loading..." scrollY={scrollY}  />
      <ScrollView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
        {/* Banner Skeleton */}
        <Animated.View
          style={{
            height: BANNER_HEIGHT,
            backgroundColor: bgColor,
          }}
        />

        {/* Store Info Card Skeleton */}
        <View style={{ padding: 16 }}>
          <Animated.View
            style={{
              height: 100,
              backgroundColor: bgColor,
              borderRadius: 16,
            }}
          />
        </View>

        {/* Store Info Cards Skeleton */}
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
            <Animated.View
              style={{
                width: "48%",
                height: 80,
                backgroundColor: bgColor,
                borderRadius: 12,
              }}
            />
            <Animated.View
              style={{
                width: "48%",
                height: 80,
                backgroundColor: bgColor,
                borderRadius: 12,
              }}
            />
          </View>
        </View>

        {/* Categories Section Skeleton */}
        <View style={{ paddingHorizontal: 12 }}>
          <View style={{ paddingHorizontal: 4, marginBottom: 12 }}>
            <Animated.View
              style={{
                width: 120,
                height: 24,
                backgroundColor: bgColor,
                borderRadius: 4,
              }}
            />
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((_, index) => (
              <View key={index} style={{ width: "25%", paddingHorizontal: 4, paddingBottom: 12 }}>
                <Animated.View
                  style={{
                    height: 100,
                    backgroundColor: bgColor,
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default function StoreScreen() {
  const { t } = useTranslation();
  const { id, store } = useLocalSearchParams()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(true)
  const { items, getTotalPrice, clearCart } = useCart()
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  });

  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useGetAllCategories(id as string)

  const totalPrice = getTotalPrice()
  const formattedTotal = totalPrice.toFixed(3)
  const storeInfo = JSON.parse(store as string)
  const insets = useSafeAreaInsets()

  // Animation values
  const scrollY = new Animated.Value(0)
  const searchInputRef = useRef(null)

  // Animated values for header
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, BANNER_HEIGHT - HEADER_HEIGHT],
    outputRange: [0, 1],
    extrapolate: "clamp",
    easing: Easing.inOut(Easing.ease),
  })

  const bannerScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.2, 1],
    extrapolate: "clamp",
    easing: Easing.inOut(Easing.ease),
  })

  const bannerOpacity = scrollY.interpolate({
    inputRange: [0, BANNER_HEIGHT - HEADER_HEIGHT, BANNER_HEIGHT],
    outputRange: [1, 0.9, 0],
    extrapolate: "clamp",
    easing: Easing.inOut(Easing.ease),
  })

  // Filter categories based on search query
  const filteredCategories =
    searchQuery.length > 0
      ? categories?.filter((category: any) => category.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : categories

  // Toggle search input
  const toggleSearch = () => {
    setShowSearch(!showSearch)
    setSearchQuery("")
    if (!showSearch) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }

  if (categoriesLoading) {
    return <StoreDetailsSkeleton scrollY={scrollY} insets={insets} />
  }

  if (categoriesError || !store) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "white" }}>
        <Feather name="alert-circle" size={60} color="#ef4444" style={{ marginBottom: 16 }} />
        <Text style={{ color: "#ef4444", fontSize: 16, marginBottom: 24 }}>{categoriesError.message}</Text>
        <TouchableOpacity
          onPress={() => refetchCategories()}
          style={{
            backgroundColor: "#10b981",
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 999,
          }}
        >
          <Text style={{ color: "white", fontWeight: "600" }}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }
  return (
    <>
      <Header title={storeInfo?.name || "Store Name"} scrollY={scrollY}  />
      <Animated.ScrollView
      ref={scrollRef}
        style={{ flex: 1, backgroundColor: "#f9fafb" }}
        contentContainerStyle={{ paddingBottom: items.length > 0 ? 100 : 30 }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* Store Banner */}
        <Animated.View
          style={{
            height: BANNER_HEIGHT,
            transform: [{ scale: bannerScale }],
            opacity: bannerOpacity,
          }}
        >
          <Image
            source={{ uri: storeInfo.image || "https://i.pinimg.com/474x/69/fd/05/69fd053b2e1a09ef8e62b7189233a888.jpg" }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
            resizeMethod="resize"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 120,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: 16,
            }}
          >
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 16,
                padding: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 8 }}>
                {storeInfo?.name || "Store Name"}
              </Text>

              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <MaterialIcons name="delivery-dining" size={18} color="#10b981" />
                <Text style={{ color: "#6b7280", marginLeft: 6 }}>{t('Free delivery')}</Text>
                <Text style={{ color: "#6b7280", marginHorizontal: 6 }}>•</Text>
                <FontAwesome name="star" size={16} color="#f59e0b" />
                <Text style={{ color: "#6b7280", marginLeft: 6 }}>4.8 (200+)</Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    backgroundColor: "#dcfce7",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 12,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: "#10b981", fontWeight: "600", fontSize: 12 }}>{t('Open Now')}</Text>
                </View>
                <Text style={{ color: "#6b7280", fontSize: 13 }}>{t('Closes at')} 22:00</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Search Bar (conditionally rendered) */}
        {showSearch && (
          <AnimatedPreset.View
            style={{
              padding: 16,
              backgroundColor: "white",
              borderBottomWidth: 1,
              borderBottomColor: "#f3f4f6",
            }}
            entering={FadeInDown.duration(300)}
            exiting={FadeOutUp.duration(300)}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#f3f4f6",
                borderRadius: 8,
                paddingHorizontal: 12,
              }}
            >
              <Feather name="search" size={20} color="#9ca3af" />
              <TextInput
                ref={searchInputRef}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 8,
                  fontSize: 16,
                }}
                placeholder={t("Search categories...")}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Feather name="x" size={20} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>
          </AnimatedPreset.View>
        )}

        {/* Store Info Cards */}
        <View style={{ padding: 16 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "white",
                borderRadius: 12,
                padding: 12,
                marginRight: 8,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 1,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    backgroundColor: "#fee2e2",
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 8,
                  }}
                >
                  <Feather name="clock" size={18} color="#ef4444" />
                </View>
                <View>
                  <Text style={{ fontSize: 12, color: "#6b7280" }}>{t('Delivery Time')}</Text>
                  <Text style={{ fontWeight: "bold" }}>20-30 {t('min')}</Text>
                </View>
              </View>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: "white",
                borderRadius: 12,
                padding: 12,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 1,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    backgroundColor: "#dbeafe",
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 8,
                  }}
                >
                  <Feather name="map-pin" size={18} color="#3b82f6" />
                </View>
                <View>
                  <Text style={{ fontSize: 12, color: "#6b7280" }}>{t('Distance')}</Text>
                  <Text style={{ fontWeight: "bold" }}>1.2 {t('km')}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Categories Section */}
        <View style={{ paddingBottom: 20 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 16,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "bold" }}>{t('Categories')}</Text>
            <TouchableOpacity onPress={toggleSearch}>
              <Feather name="search" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Categories Grid */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              paddingHorizontal: 12,
            }}
          >
            {filteredCategories?.map((category: any, index: number) => {
              return (
                <AnimatedPreset.View
                  key={category.id}
                  style={{
                    width: "25%",
                    paddingHorizontal: 4,
                    paddingBottom: 12,
                    opacity: 1,
                    transform: [{ translateY: 0 }],
                  }}
                  entering={FadeInDown.delay(index * 30)
                    .duration(250)
                    .springify()}
                >
                  <TouchableOpacity
                    style={{
                      backgroundColor: "white",
                      borderRadius: 12,
                      padding: 12,
                      alignItems: "center",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 3,
                      elevation: 1,
                      height: 100,
                      justifyContent: "center",
                    }}
                    activeOpacity={0.7}
                    onPress={() =>
                      safePush( {pathname: `/store/${id}/categories/${category.id}`, params: {
                        categories: JSON.stringify(categories),
                        selectedCategory: JSON.stringify(category),
                        store: JSON.stringify(storeInfo),
                      }})
                    }
                  >
                    <Image
                      source={{ uri: `${category.image}?width=128&height=128&quality=70` }}
                      style={{
                        height: 50,
                        width: 50,
                        borderRadius: 25,
                        marginBottom: 8,
                      }}
                      resizeMethod="resize"
                      onError={(e) => {
                        console.warn("Image load failed:", category.image, e.nativeEvent.error)
                      }}
                    />
                    <Text
                      style={{
                        fontWeight: "600",
                        fontSize: 12,
                        textAlign: "center",
                        color: "#374151",
                      }}
                      numberOfLines={1}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                </AnimatedPreset.View>
              )
            })}
          </View>
        </View>
      </Animated.ScrollView>

      {/* Cart Button */}
      {items.length > 0 && (
        <View
          style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            right: 20,
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
              safePush( {pathname: "/(app)/cart/cart", params: { store: JSON.stringify(storeInfo) }})
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

            <Text style={{ color: "white", fontWeight: "bold", fontSize: 18 }}>{formattedTotal} {t("DT")}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Back Button (only visible when scrolled) */}
      <Animated.View
        style={{
          position: "absolute",
          top: Platform.OS === "ios" ? 44 : (StatusBar.currentHeight || 0) -27,
          left: 16,
          width: 40,
          height: 40,

          borderRadius: 20,
          backgroundColor: "rgba(0,0,0,0.3)",
          alignItems: "center",
          justifyContent: "center",
          opacity: Animated.subtract(1, headerOpacity),
          zIndex: 20,
        }}
      >
        <TouchableOpacity onPress={() => {
          clearCart()
          router.back()
          }}>
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
      </Animated.View>
    </>
  )
}
