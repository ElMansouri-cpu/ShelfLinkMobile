import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  StyleSheet,
  PanResponder,
  StatusBar,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useCart } from "../../../../../context/CartContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
const { width, height } = Dimensions.get("window");
const MODAL_HEIGHT = height * 0.9;
const DRAG_THRESHOLD = 50;

interface ProductDetailsModalProps {
  product: any;
  visible: boolean;
  onClose: () => void;
  storeId: string;
}

const ProductDetailsModal = ({ product, visible, onClose, storeId }: ProductDetailsModalProps) => {
  const { addToCart, removeFromCart, items } = useCart();
  const [quantity, setQuantity] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  // Animation values
  const slideAnim = useRef(new Animated.Value(height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  
  // Update quantity when items change
  useEffect(() => {
    if (product) {
      const item = items.find(item => item.id === product.id);
      setQuantity(item ? item.quantity : 0);
    }
  }, [items, product]);
  
  // Handle visibility changes
  useEffect(() => {
    if (visible) {
      StatusBar.setBarStyle('light-content');
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      StatusBar.setBarStyle('dark-content');
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: height,
          tension: 50,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);
  
  // Pan responder for swipe down to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > DRAG_THRESHOLD) {
          onClose();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 50,
            friction: 10,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;
  
  if (!product) return null;
  
  // Product images (assuming product has multiple images)
  const productImages = [product.image];
  if (product.images && Array.isArray(product.images)) {
    productImages.push(...product.images);
  }
  
  // Handle add to cart
  const handleAddToCart = () => {
    addToCart(product);
  };
  
  // Handle remove from cart
  const handleRemoveFromCart = () => {
    removeFromCart(product.id);
  };
  
  return (
    <>
      {/* Backdrop */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: 'rgba(0,0,0,0.5)',
            opacity: backdropOpacity,
            zIndex: 999,
          },
        ]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>
      
      {/* Modal Content */}
      <Animated.View
        style={[
          styles.modalContainer,
          {
            transform: [{ translateY: slideAnim }],
            paddingBottom: insets.bottom,
            height: MODAL_HEIGHT + insets.bottom,
            zIndex: 1000,
          },
        ]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        {/* Drag Handle */}
        <View style={styles.dragHandleContainer} {...panResponder.panHandlers}>
          <View style={styles.dragHandle} />
        </View>
        
        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
        >
          <Feather name="x" size={24} color="#374151" />
        </TouchableOpacity>
        
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Product Images */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: productImages[selectedImage] }}
              style={styles.productImage}
              resizeMode="contain"
            />
            
            {/* Image Selector */}
            {productImages.length > 1 && (
              <View style={styles.imageSelectorContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                >
                  {productImages.map((image, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.thumbnailContainer,
                        selectedImage === index && styles.selectedThumbnail,
                      ]}
                      onPress={() => setSelectedImage(index)}
                    >
                      <Image
                        source={{ uri: image }}
                        style={styles.thumbnail}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
          
          {/* Product Info */}
          <View style={styles.productInfoContainer}>
            <Text style={styles.productName}>{product.name}</Text>
            
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{product.sellPriceTtc} {t("DT")}</Text>
              
              {product.originalPrice && (
                <Text style={styles.originalPrice}>{product.originalPrice} {t("DT")}</Text>
              )}
            </View>
            
            {/* Description */}
            <View style={styles.descriptionContainer}>
              <Text style={styles.sectionTitle}>{t("Description")}</Text>
              <Text style={styles.description}>
                {product.description || "No description available for this product."}
              </Text>
            </View>
            
            {/* Additional Info */}
            {product.details && (
              <View style={styles.detailsContainer}>
                <Text style={styles.sectionTitle}>Details</Text>
                {Object.entries(product.details).map(([key, value]) => (
                  <View key={key} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{key}</Text>
                    <Text style={styles.detailValue}>{String(value)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
        
        {/* Bottom Action Bar */}
        <View style={styles.bottomBar}>
          {quantity > 0 ? (
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={handleRemoveFromCart}
              >
                <Feather name="minus" size={20} color="white" />
              </TouchableOpacity>
              
              <Text style={styles.quantityText}>{quantity}</Text>
              
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={handleAddToCart}
              >
                <Feather name="plus" size={20} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addToCartButton}
              onPress={handleAddToCart}
            >
              <Feather name="shopping-cart" size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.addToCartText}>{t("Add to Cart")}</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  dragHandleContainer: {
    width: '100%',
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E0',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  productImage: {
    width: width * 0.7,
    height: 220,
  },
  imageSelectorContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
  },
  thumbnailContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginHorizontal: 6,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  selectedThumbnail: {
    borderColor: '#10B981',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  productInfoContainer: {
    padding: 20,
  },
  productName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 18,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4B5563',
  },
  detailsContainer: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 5,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    height: 50,
  },
  quantityButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    paddingHorizontal: 20,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    height: 50,
  },
  addToCartText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default ProductDetailsModal;
