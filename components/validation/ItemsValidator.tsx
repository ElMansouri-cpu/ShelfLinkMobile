import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ItemsValidatorProps, ValidatedItem, ValidationSummary } from '../../types/validation.types';
import { OrderItem, OrderItemStatus, OrderStatus } from '../../services/order-service/orders.type';
import { useItemsValidator } from '../../hooks/useItemsValidator';
import { useItemCalculations } from '../../hooks/useItemCalculations';
import { useValidationSummary } from '../../hooks/useValidationSummary';
import { useItemValidation } from '../../hooks/useItemValidation';
import { StatusReason, getNextItemStatus } from '../../types/validation.types';
import { ValidatorSummary } from './ValidatorSummary';
import { ItemValidatorRow } from './ItemValidatorRow';
import { ValidationProgressDialog } from './ValidationProgressDialog';

const ItemsValidator: React.FC<ItemsValidatorProps> = ({
  isOpen,
  onClose,
  items = [],
  onValidationComplete,
  originalOrder
}) => {
  const { t } = useTranslation();
  
  const {
    validatedItems,
    setValidatedItems,
    isSubmitting,
    setIsSubmitting,
    showValidationProgress,
    setShowValidationProgress,
    validationComplete,
    setValidationComplete,
    isValidProps,
    resetState
  } = useItemsValidator(items, originalOrder, isOpen);

  const { calculateItemTotals } = useItemCalculations();
  const summary = useValidationSummary(validatedItems, items, originalOrder);
  const { updateItem, updateOrderStatus } = useItemValidation(originalOrder.organizationId, originalOrder);

  const handleClose = () => {
    resetState();
    onClose();
  };

  // The useItemsValidator hook already handles state reset

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setValidatedItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const totals = calculateItemTotals(item, newQuantity);
        return {
          ...item,
          updatedQuantity: newQuantity,
          updatedSubtotalAmount: totals.subtotalAmount,
          updatedTotalAmount: totals.totalAmount
        };
      }
      return item;
    }));
  };

  const toggleItemValidation = (itemId: string, isValidated: boolean) => {
    setValidatedItems(prev => prev.map(item => {
      if (item.id === itemId) {
        let newStatus: OrderItemStatus;
        let newStatusReason: StatusReason;
        
        if (isValidated) {
          newStatus = getNextItemStatus(originalOrder?.status);
          newStatusReason = StatusReason.ITEM_CONFIRMED;
        } else {
          // Switch off = Cancel the item
          newStatus = OrderItemStatus.CANCELLED;
          newStatusReason = StatusReason.ITEM_CANCELLED;
        }
        
        return {
          ...item,
          status: newStatus,
          statusReason: newStatusReason
        };
      }
      return item;
    }));
  };

  const validateAllItems = () => {
    setValidatedItems(prev => prev.map(item => {
      // Only validate items that are not already canceled
      if (item.status === OrderItemStatus.CANCELLED) {
        return item; // Keep canceled items as they are
      }
      
      const newStatus = getNextItemStatus(originalOrder?.status);
      return {
        ...item,
        status: newStatus,
        statusReason: StatusReason.ITEM_CONFIRMED
      };
    }));
  };

  const handleValidationComplete = async () => {
    if (!isValidProps) {
      Alert.alert(t('Error'), t('Invalid configuration for validation'));
      return;
    }

    setIsSubmitting(true);
    // Don't show progress dialog immediately - process items first
    // setShowValidationProgress(true);
    
    try {
      // Auto-cancel untouched items
      const updatedItemsWithAutoCancellation = validatedItems.map(item => {
        const originalItem = originalOrder.items?.find((i: OrderItem) => i.id === item.id);
        if (!originalItem) return item;
        
        let shouldAutoCancel = false;
        
        switch (originalOrder?.status) {
          case OrderStatus.SUBMITTED:
            shouldAutoCancel = originalItem.status === OrderItemStatus.PENDING_VALIDATION && 
                              item.status === OrderItemStatus.PENDING_VALIDATION;
            break;
          case OrderStatus.CONFIRMED:
          case OrderStatus.PROCESSING:
            shouldAutoCancel = (originalItem.status === OrderItemStatus.PENDING_VALIDATION || 
                              originalItem.status === OrderItemStatus.VALIDATED) && 
                              item.status === originalItem.status;
            break;
          case OrderStatus.SHIPPED:
            shouldAutoCancel = (originalItem.status === OrderItemStatus.PENDING_VALIDATION || 
                              originalItem.status === OrderItemStatus.VALIDATED ||
                              originalItem.status === OrderItemStatus.SHIPPED) && 
                              item.status === originalItem.status;
            break;
          default:
            shouldAutoCancel = originalItem.status === OrderItemStatus.PENDING_VALIDATION && 
                              item.status === OrderItemStatus.PENDING_VALIDATION;
        }
        
        if (shouldAutoCancel) {
          return {
            ...item,
            status: OrderItemStatus.CANCELLED,
            statusReason: StatusReason.ITEM_CANCELLED
          };
        }
        return item;
      });

      setValidatedItems(updatedItemsWithAutoCancellation);

      // Process items that need updates
      const itemsToProcess = updatedItemsWithAutoCancellation.filter(item => {
        const originalItem = originalOrder.items?.find((i: OrderItem) => i.id === item.id);
        if (!originalItem) return false;
        
        const hasQuantityChange = originalItem.quantity !== item.updatedQuantity;
        const hasStatusChange = originalItem.status !== item.status;
        
        return hasQuantityChange || hasStatusChange;
      });

      if (itemsToProcess.length === 0) {
        Alert.alert(t('Info'), t('No changes detected to process'));
        setIsSubmitting(false);
        setShowValidationProgress(false);
        return;
      }

      // Set processing items to pending
      setValidatedItems(prev => prev.map(item => {
        const isBeingProcessed = itemsToProcess.some(p => p.id === item.id);
        return isBeingProcessed 
          ? { ...item, validationStatus: 'pending' }
          : item;
      }));

      // Now show the progress dialog
      setShowValidationProgress(true);

      // Process items
      const processedResults = await Promise.allSettled(
        itemsToProcess.map(item => updateItem(item))
      );

      // Update items with validation results
      const updatedItems = updatedItemsWithAutoCancellation.map(item => {
        const processIndex = itemsToProcess.findIndex(p => p.id === item.id);
        
        if (processIndex === -1) {
          return item;
        }

        const result = processedResults[processIndex];
        
        if (result.status === 'fulfilled') {
          return { ...item, ...result.value };
        } else {
          const errorMessage = result.reason instanceof Error 
            ? result.reason.message 
            : 'Processing failed';
          
          return { 
            ...item, 
            validationStatus: 'error' as const, 
            errorMessage 
          };
        }
      });

      setValidatedItems(updatedItems);
      setValidationComplete(true);

      // Analyze results and provide feedback
      const successfulItems = updatedItems.filter(item => item.validationStatus === 'success' || item.validationStatus === undefined);
      const failedItems = updatedItems.filter(item => item.validationStatus === 'error');
      
      if (successfulItems.length > 0) {
        try {
          await updateOrderStatus();
          
          let message = '';
          if (failedItems.length === 0) {
            message = t('All items validated successfully! Order status updated.');
          } else {
            message = t('{{count}} items processed successfully, {{failed}} failed. Order status updated.', {
              count: successfulItems.length,
              failed: failedItems.length
            });
          }
          Alert.alert(t('Success'), message);
        } catch (orderError) {
          const message = t('Items processed but failed to update order status: {{error}}', {
            error: orderError instanceof Error ? orderError.message : 'Unknown error'
          });
          Alert.alert(t('Warning'), message);
        }
      } else {
        const message = t('All {{count}} items failed to process. Please review and try again.', {
          count: itemsToProcess.length
        });
        Alert.alert(t('Error'), message);
      }

      // Calculate final summary
      const finalSummary: ValidationSummary = {
        ...summary,
        totalItems: updatedItems.length,
        validatedItems: updatedItems.filter(item => {
          const targetStatus = getNextItemStatus(originalOrder?.status);
          return item.status === targetStatus;
        }).length,
        cancelledItems: updatedItems.filter(item => item.status === OrderItemStatus.CANCELLED).length,
      };

      onValidationComplete?.({ validatedItems: updatedItems, summary: finalSummary });
      
    } catch (error) {
      console.error('Validation process failed:', error);
      Alert.alert(t('Error'), t('Validation process failed. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOriginalItem = (item: ValidatedItem) => {
    return originalOrder.items?.find((i: OrderItem) => i.id === item.id);
  };

  const handleProcessMore = () => {
    setShowValidationProgress(false);
    setValidationComplete(false);
  };

  // Show invalid config
  if (!isValidProps && isOpen) {
    return (
      <Modal visible={isOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.errorModal}>
            <Text style={styles.errorTitle}>{t('Invalid Configuration')}</Text>
            <Text style={styles.errorMessage}>{t('Unable to validate items due to missing data')}</Text>
            <TouchableOpacity style={styles.errorButton} onPress={handleClose}>
              <Text style={styles.errorButtonText}>{t('Close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Show validation progress
  if (showValidationProgress) {
    return (
      <ValidationProgressDialog
        isOpen={isOpen}
        onClose={handleClose}
        validatedItems={validatedItems}
        validationComplete={validationComplete}
        onProcessMore={handleProcessMore}
      />
    );
  }

  // Main validator screen
  return (
    <Modal visible={isOpen} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>{t('Items Validator')}</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Feather name="x" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ValidatorSummary summary={summary} />
          </View>
          
          {/* Items List */}
          <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
            {validatedItems.map((item) => (
              <ItemValidatorRow
                key={item.id}
                item={item}
                originalOrder={originalOrder}
                onQuantityUpdate={updateItemQuantity}
                onToggleValidation={toggleItemValidation}
                getOriginalItem={getOriginalItem}
              />
            ))}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton]} 
                onPress={validateAllItems}
                disabled={isSubmitting || validatedItems.length === 0}
              >
                <Text style={styles.secondaryButtonText}>{t('Validate All')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton]} 
                onPress={handleClose} 
                disabled={isSubmitting}
              >
                <Text style={styles.secondaryButtonText}>{t('Cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton]} 
                onPress={handleValidationComplete} 
                disabled={isSubmitting || (summary.validatedItems === 0 && originalOrder?.status === OrderStatus.SUBMITTED)}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {t('Process {{count}} Items', { count: summary.validatedItems })}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '70%',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  itemsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#10b981',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 14,
  },
  errorModal: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  errorButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default ItemsValidator;
