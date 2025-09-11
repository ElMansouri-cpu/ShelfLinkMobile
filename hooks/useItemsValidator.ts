import { useState, useEffect, useCallback, useMemo } from 'react';
import { OrderItem, Order, OrderItemStatus } from '../services/order-service/orders.type';
import { ValidatedItem, ValidationSummary } from '../types/validation.types';

export const useItemsValidator = (
  items: OrderItem[], 
  originalOrder: Order,
  isOpen: boolean
) => {
  const [validatedItems, setValidatedItems] = useState<ValidatedItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidationProgress, setShowValidationProgress] = useState(false);
  const [validationComplete, setValidationComplete] = useState(false);

  const isValidProps = useMemo(() => {
    return originalOrder && items.length > 0;
  }, [originalOrder, items.length]);

  // Initialize validated items when modal opens
  useEffect(() => {
    if (isOpen && isValidProps) {
      const initialValidatedItems: ValidatedItem[] = items.map(item => ({
        ...item,
        updatedQuantity: item.quantity,
        updatedTotalAmount: item.totalAmount,
        updatedSubtotalAmount: item.subtotalAmount,
        status: item.status || OrderItemStatus.PENDING_VALIDATION
      }));
      setValidatedItems(initialValidatedItems);
    } else if (!isOpen) {
      // Reset state when modal closes
      setValidatedItems([]);
      setIsSubmitting(false);
      setShowValidationProgress(false);
      setValidationComplete(false);
    }
  }, [isOpen, items, isValidProps]);

  const resetState = useCallback(() => {
    setValidatedItems([]);
    setIsSubmitting(false);
    setShowValidationProgress(false);
    setValidationComplete(false);
  }, []);

  return {
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
  };
};
