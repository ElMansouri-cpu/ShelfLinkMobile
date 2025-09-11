import { useMemo } from 'react';
import { ValidatedItem, ValidationSummary } from '../types/validation.types';
import { OrderItem, Order, OrderItemStatus, OrderStatus } from '../services/order-service/orders.type';

export const useValidationSummary = (
  validatedItems: ValidatedItem[], 
  originalItems: OrderItem[], 
  originalOrder: Order
): ValidationSummary => {
  return useMemo(() => {
    const totalItems = validatedItems.length;
    
    let targetValidatedStatus: OrderItemStatus;
    switch (originalOrder?.status) {
      case OrderStatus.SUBMITTED:
        targetValidatedStatus = OrderItemStatus.VALIDATED;
        break;
      case OrderStatus.CONFIRMED:
      case OrderStatus.PROCESSING:
        targetValidatedStatus = OrderItemStatus.SHIPPED;
        break;
      case OrderStatus.SHIPPED:
        targetValidatedStatus = OrderItemStatus.DELIVERED;
        break;
      default:
        targetValidatedStatus = OrderItemStatus.VALIDATED;
    }
    
    const validatedItemsCount = validatedItems.filter(item => {
      return item.status === targetValidatedStatus;
    }).length;
    
    const cancelledItemsCount = validatedItems.filter(
      item => item.status === OrderItemStatus.CANCELLED
    ).length;
    
    const originalAmount = originalItems.reduce((sum, item) => {
      return sum + parseFloat(item.totalAmount || '0');
    }, 0);
    
    const totalAmount = validatedItems.reduce((sum, item) => {
      if (item.status === targetValidatedStatus) {
        return sum + parseFloat(item.updatedTotalAmount || '0');
      }
      return sum;
    }, 0);

    return {
      totalItems,
      validatedItems: validatedItemsCount,
      cancelledItems: cancelledItemsCount,
      totalAmount,
      originalAmount,
      amountDifference: totalAmount - originalAmount
    };
  }, [validatedItems, originalItems, originalOrder?.status]);
};

