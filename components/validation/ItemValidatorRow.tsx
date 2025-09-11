import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ItemValidatorRowProps } from '../../types/validation.types';
import { OrderItemStatus, OrderStatus } from '../../services/order-service/orders.type';
import { getNextItemStatus } from '../../types/validation.types';

export const ItemValidatorRow: React.FC<ItemValidatorRowProps> = ({
  item,
  originalOrder,
  onQuantityUpdate,
  onToggleValidation,
  getOriginalItem
}) => {
  const { t } = useTranslation();
  const originalItem = getOriginalItem(item);
  
  const isItemValidated = () => {
    const targetStatus = getNextItemStatus(originalOrder?.status);
    return item.status === targetStatus;
  };

  const isItemCancelled = () => {
    return item.status === OrderItemStatus.CANCELLED;
  };

  const isItemEditable = () => {
    return !isItemCancelled();
  };

  const getStatusColor = () => {
    if (isItemValidated()) return '#16a34a';
    if (isItemCancelled()) return '#dc2626';
    return '#6b7280';
  };

  const getStatusIcon = () => {
    if (isItemValidated()) return 'check-circle';
    if (isItemCancelled()) return 'x-circle';
    return 'clock';
  };

  return (
    <View style={[styles.container, !isItemEditable() && styles.canceledContainer]}>
      {/* Product Image */}
      <View style={styles.imageContainer}>
        {item.variant?.imageUrl ? (
          <Image source={{ uri: item.variant.imageUrl }} style={[styles.productImage, !isItemEditable() && styles.canceledImage]} />
        ) : (
          <View style={[styles.placeholderImage, !isItemEditable() && styles.canceledImage]}>
            <Feather name="package" size={20} color="#9ca3af" />
          </View>
        )}
        {isItemCancelled() && (
          <View style={styles.canceledOverlay}>
            <Feather name="x-circle" size={16} color="#dc2626" />
          </View>
        )}
      </View>

      {/* Product Details */}
      <View style={styles.detailsContainer}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.variant?.name || 'Unknown Product'}
        </Text>
        <Text style={styles.priceText}>
          {item.updatedQuantity} × {parseFloat(item.unitPrice).toFixed(3)} = {parseFloat(item.updatedTotalAmount).toFixed(3)} {t('DT')}
        </Text>
      </View>

      {/* Quantity Controls */}
      <View style={styles.controlsContainer}>
        <View style={[styles.quantityControls, !isItemEditable() && styles.disabledControls]}>
          <TouchableOpacity
            style={[styles.quantityButton, (item.updatedQuantity <= 1 || !isItemEditable()) && styles.disabledButton]}
            onPress={() => isItemEditable() && onQuantityUpdate(item.id, item.updatedQuantity - 1)}
            disabled={item.updatedQuantity <= 1 || !isItemEditable()}
          >
            <Feather name="minus" size={16} color={(item.updatedQuantity <= 1 || !isItemEditable()) ? '#9ca3af' : '#374151'} />
          </TouchableOpacity>
          
          <View style={styles.quantityDisplay}>
            <Text style={[styles.quantityText, !isItemEditable() && styles.disabledText]}>{item.updatedQuantity}</Text>
          </View>
          
          <TouchableOpacity
            style={[styles.quantityButton, !isItemEditable() && styles.disabledButton]}
            onPress={() => isItemEditable() && onQuantityUpdate(item.id, item.updatedQuantity + 1)}
            disabled={!isItemEditable()}
          >
            <Feather name="plus" size={16} color={!isItemEditable() ? '#9ca3af' : '#374151'} />
          </TouchableOpacity>
        </View>

        {/* Validation Switch */}
        <View style={styles.switchContainer}>
          <Switch
            value={isItemValidated()}
            onValueChange={(value) => onToggleValidation(item.id, value)}
            trackColor={{
              false: isItemCancelled() ? '#fee2e2' : '#e5e7eb',
              true: '#16a34a'
            }}
            thumbColor={isItemValidated() ? '#ffffff' : '#ffffff'}
            ios_backgroundColor={isItemCancelled() ? '#fee2e2' : '#e5e7eb'}
            style={styles.validationSwitch}
            disabled={isItemCancelled()}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  imageContainer: {
    marginRight: 12,
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  placeholderImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsContainer: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    lineHeight: 18,
  },
  priceText: {
    fontSize: 12,
    color: '#6b7280',
  },
  controlsContainer: {
    alignItems: 'center',
    gap: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  quantityButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  disabledButton: {
    backgroundColor: '#f3f4f6',
  },
  quantityDisplay: {
    minWidth: 40,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  switchContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  validationSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  disabledControls: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#9ca3af',
  },
  canceledContainer: {
    opacity: 0.7,
    backgroundColor: '#fef2f2',
  },
  canceledImage: {
    opacity: 0.5,
  },
  canceledOverlay: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
