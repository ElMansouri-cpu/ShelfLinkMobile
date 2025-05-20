import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Animated,
  Alert,
  StyleSheet
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useCart } from "../../../context/CartContext";
import { useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Header from "../../../components/Header";
import { useTranslation } from "react-i18next";
import { safePush } from "../../../utils/navigation";


export default function CartScreen() {
  const { t } = useTranslation()
  const router = useRouter();
  const { items, addToCart, removeFromCart, clearCart, getTotalPrice } = useCart();
  const { store } = useLocalSearchParams();
  const storeInfo = JSON.parse(store as string);
  const totalPrice = getTotalPrice();
  const formattedTotal = totalPrice.toFixed(3);
  const deliveryFee = 0;
  const serviceFee = 0;
  const formattedDeliveryFee = deliveryFee.toFixed(3);
  const formattedServiceFee = serviceFee.toFixed(3);
  const formattedGrandTotal = (totalPrice + deliveryFee + serviceFee).toFixed(3);
  const insets = useSafeAreaInsets();
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Animated values for header shadow
  const headerShadowOpacity = scrollY.interpolate({
    inputRange: [0, 20],
    outputRange: [0, 0.2],
    extrapolate: 'clamp'
  });
  const fadeAnimations = useRef(items.map(() => new Animated.Value(0))).current;
  const translateAnimations = useRef(items.map(() => new Animated.Value(20))).current;

  useEffect(() => {
    const animations = items.map((_, index) =>
      Animated.parallel([
        Animated.timing(fadeAnimations[index], {
          toValue: 1,
          duration: 300,
          delay: index * 100,
          useNativeDriver: true,
        }),
        Animated.timing(translateAnimations[index], {
          toValue: 0,
          duration: 300,
          delay: index * 100,
          useNativeDriver: true,
        }),
      ])
    );

    Animated.stagger(100, animations).start();
  }, [items]); // Run whenever items change

  // Fade in animation for cart items
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true
    }).start();
  }, []);
  
  // Confirm clear cart
  const handleClearCart = () => {
    Alert.alert(
      t("Clear Cart"),
      t("Are you sure you want to remove all items from your cart?"),
      [
        {
          text: t("Cancel"),
          style: "cancel"
        },
        {
          text: t("Clear"),
          onPress: clearCart,
          style: "destructive"
        }
      ]
    );
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {/* <StatusBar barStyle="dark-content" backgroundColor="#fff" /> */}
        <Header title={t("Your Cart")} onBack={() => router.back()} opacity={1}  scrollY={scrollY}   />
        {/* Header */}
        {/* <Animated.View style={[
          styles.header,
          {
            shadowOpacity: headerShadowOpacity,
            paddingTop: insets.top > 0 ? insets.top : 16
          }
        ]}>
          <TouchableOpacity 
            style={styles.backButton}
            className="mt-4 flex items-center "
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={22} color="#333" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Your Cart</Text>
          
          <View style={{ width: 40 }} />
        </Animated.View> */}

        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Feather name="shopping-bag" size={64} color="#10b981" />
          </View>
          <Text style={styles.emptyTitle}>{t("Your cart is empty")}</Text>
          <Text style={styles.emptySubtitle}>
            {t("Add items to your cart to see them here")}
          </Text>

          <TouchableOpacity 
            style={styles.continueButton}
            onPress={() => router.back()}
          >
            <Text style={styles.continueButtonText}>{t("Continue Shopping")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Your Cart" onBack={() => router.back()} opacity={1}  scrollY={scrollY} clearCart={handleClearCart} />
      {/* Header */}
      {/* <Animated.View style={[
        styles.header,
        {
          shadowOpacity: headerShadowOpacity,
          paddingTop: insets.top > 0 ? insets.top : 16
        }
      ]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={22} color="#333" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Your Cart</Text>
        
        <TouchableOpacity 
          style={styles.clearButton}
          onPress={handleClearCart}
        >
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </Animated.View> */}

      <Animated.ScrollView
        style={{ flex: 1 ,marginTop: 20}}
        contentContainerStyle={{ paddingBottom: 20 ,paddingTop: 70}}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Store Info */}
        <View style={styles.storeContainer}>
          <Image
            source={{ uri: storeInfo.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80" }}
            style={styles.storeImage}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.storeName}>{storeInfo.name}</Text>
            <View style={styles.storeInfoRow}>
              <Feather name="map-pin" size={14} color="#6b7280" style={{ marginRight: 4 }} />
              <Text style={styles.storeInfoText} numberOfLines={1}>
                {storeInfo.location?.address || "Store location"}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.storeButton}
            onPress={() => safePush({
              pathname: `/(app)/store/${storeInfo.id}`,
              params: { store: JSON.stringify(storeInfo) }
            })}
          >
            <Text style={styles.storeButtonText}>{t("View")}</Text>
          </TouchableOpacity>
        </View>

        {/* Cart Items */}
        <View style={styles.cartItemsContainer}>
          <Text style={styles.sectionTitle}>{t("Cart Items")}</Text>

          {items.map((item, index) => {
            // Create staggered animation for each item
         

            return (
              <Animated.View
                key={item.id}
                style={[
                  styles.cartItem,
                  {
                    opacity: fadeAnimations[index],
                    transform: [{ translateY: translateAnimations[index] }],
                    borderBottomWidth: index === items.length - 1 ? 0 : 1
                  }
                ]}
              >
                <Image
                  source={{ uri: item.image || "https://via.placeholder.com/100" }}
                  style={styles.itemImage}
                  resizeMode="contain"
                />

                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>

                  <View style={styles.itemPriceRow}>
                    <Text style={styles.itemPrice}>{item.quantity}x {item.sellPriceTtc} {t("DT")}</Text>
                  
                  </View>
                </View>
                <View className="flex flex-col justify-between items-end">
                <View style={styles.quantityControl}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => removeFromCart(item.id)}
                  >
                    <Feather name="minus" size={16} color="#fff" />
                  </TouchableOpacity>

                  <Text style={styles.quantityText}>{item.quantity}</Text>

                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => addToCart(item)}
                  >
                    <Feather name="plus" size={16} color="#fff" />
                  </TouchableOpacity>
                  
                </View>
                <Text style={styles.itemTotalPrice}>
                      {(item.sellPriceTtc * item.quantity).toFixed(3)} {t("DT")}
                    </Text>
                </View>
               
             
              </Animated.View>
            );
          })}
        </View>

        {/* Promo Code */}
        <View style={styles.promoContainer}>
          <View style={styles.promoInputContainer}>
            <Feather name="tag" size={20} color="#9ca3af" style={{ marginRight: 8 }} />
            <Text style={styles.promoPlaceholder}>{t("Add promo code")}</Text>
          </View>
          <TouchableOpacity style={styles.promoButton}>
            <Text style={styles.promoButtonText}>{t("Apply")}</Text>
          </TouchableOpacity>
        </View>

        {/* Order Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>{t("Order Summary")}</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t("Subtotal")}</Text>
            <Text style={styles.summaryValue}>{formattedTotal} {t("DT")}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t("Delivery Fee")}</Text>
            <Text style={styles.summaryValue}>{formattedDeliveryFee} {t("DT")}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t("Service Fee")}</Text>
            <Text style={styles.summaryValue}>{formattedServiceFee} {t("DT")}</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t("Total")}</Text>
            <Text style={styles.totalValue}>{formattedGrandTotal} {t("DT")}</Text>
          </View>
        </View>

        {/* Fees information */}
        <TouchableOpacity style={styles.feesInfoButton}>
          <Feather name="info" size={16} color="#9ca3af" />
          <Text style={styles.feesInfoText}>{t("Fees information")}</Text>
        </TouchableOpacity>
      </Animated.ScrollView>

      {/* Checkout button */}
      <View style={[styles.checkoutContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.9)', '#ffffff']}
          style={styles.checkoutGradient}
        />
        
        <TouchableOpacity 
          style={styles.checkoutButton}
          activeOpacity={0.8}
          onPress={() => safePush( {
            pathname: "/checkout",
            params: {
              items: JSON.stringify(items),
              total: formattedGrandTotal,
              store: JSON.stringify(storeInfo)
            }
          })}
        >
          <View style={styles.checkoutButtonContent}>
            <View style={styles.checkoutItems}>
              <Text style={styles.checkoutItemsText}>
                {items.reduce((sum, item) => sum + item.quantity, 0)} {t("items")}
              </Text>
            </View>
            
            <Text style={styles.checkoutButtonText}>
              {t("Checkout")}
            </Text>
            
            <Text style={styles.checkoutPrice}>
              {formattedGrandTotal} {t("DT")}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111'
  },
  clearButton: {
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  clearButtonText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 14
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111'
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32
  },
  continueButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12
  },
  continueButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  storeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1
  },
  storeImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 4
  },
  storeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  storeInfoText: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1
  },
  storeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 8
  },
  storeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563'
  },
  cartItemsContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 16
  },
  cartItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomColor: '#f3f4f6'
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#f9fafb'
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between'
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111',
    marginBottom: 8
  },
  itemPriceRow: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  itemPrice: {
    fontSize: 14,
    color: '#6b7280'
  },
  itemTotalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111'
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    borderRadius: 20,
    height: 36,
    marginLeft: 12,
    alignSelf: 'flex-start'
  },
  quantityButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center'
  },
  quantityText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    paddingHorizontal: 8
  },
  promoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16
  },
  promoInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginRight: 8
  },
  promoPlaceholder: {
    color: '#9ca3af',
    fontSize: 14
  },
  promoButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8
  },
  promoButtonText: {
    color: '#4b5563',
    fontWeight: '600',
    fontSize: 14
  },
  summaryContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  summaryLabel: {
    fontSize: 15,
    color: '#6b7280'
  },
  summaryValue: {
    fontSize: 15,
    color: '#111',
    fontWeight: '500'
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginTop: 4
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111'
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981'
  },
  feesInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 8
  },
  feesInfoText: {
    color: '#9ca3af',
    marginLeft: 6,
    fontSize: 14
  },
  checkoutContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: 'transparent',
    position: 'relative'
  },
  checkoutGradient: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    height: 40
  },
  checkoutButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  checkoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16
  },
  checkoutItems: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  checkoutItemsText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14
  },
  checkoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18
  },
  checkoutPrice: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  }
});