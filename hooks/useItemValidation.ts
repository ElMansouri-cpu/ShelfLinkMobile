import { useCallback } from 'react';
import { ValidatedItem } from '../types/validation.types';
import { OrderItem, Order, OrderItemStatus, OrderStatus } from '../services/order-service/orders.type';
import { StatusReason } from '../types/validation.types';
import { api } from '../lib/api';

export const useItemValidation = (organizationId: string, originalOrder: Order) => {
  const updateItem = useCallback(async (item: ValidatedItem): Promise<ValidatedItem> => {
    if (!organizationId || !originalOrder?.id) {
      throw new Error('Missing required parameters for item update');
    }

    const originalItem = originalOrder.items?.find((i: OrderItem) => i.id === item.id);
    if (!originalItem) {
      throw new Error('Original item not found');
    }

    const baseEndpoint = `/organization/${organizationId}/orders/${originalOrder.id}/items/${item.id}/`;
    const isQuantityUpdated = originalItem.quantity !== item.updatedQuantity;

    let endpoint = baseEndpoint;
    let payload: any = {};

    if (isQuantityUpdated && item.status !== OrderItemStatus.CANCELLED) {
      payload = {
        quantity: item.updatedQuantity,
        reason: StatusReason.QUANTITY_UPDATED
      };
      endpoint += 'update-quantity';
    } else if (item.status === OrderItemStatus.CANCELLED && originalItem.status !== OrderItemStatus.CANCELLED) {
      payload = { reason: StatusReason.ITEM_CANCELLED };
      endpoint += 'cancel';
    } else if (item.status === OrderItemStatus.VALIDATED && originalItem.status !== OrderItemStatus.VALIDATED) {
      payload = { reason: StatusReason.ITEM_CONFIRMED };
      endpoint += 'validate';
    } else if (item.status === OrderItemStatus.SHIPPED && originalItem.status !== OrderItemStatus.SHIPPED) {
      payload = { reason: StatusReason.ITEM_SHIPPED };
      endpoint += 'ship';
    } else if (item.status === OrderItemStatus.DELIVERED && originalItem.status !== OrderItemStatus.DELIVERED) {
      payload = {
        reason: StatusReason.ITEM_DELIVERED,
        deliveredQuantity: item.updatedQuantity
      };
      endpoint += 'deliver';
    } else {
      return { ...item, validationStatus: 'success' };
    }

    try {
      const response = await api.post(endpoint, payload);
      
      if (response.status !== 201 && response.status !== 200) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      return {
        ...item,
        quantity: item.updatedQuantity,
        totalAmount: item.updatedTotalAmount,
        subtotalAmount: item.updatedSubtotalAmount,
        statusChangedAt: new Date(),
        validationStatus: 'success'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to update item: ${errorMessage}`);
    }
  }, [organizationId, originalOrder]);

  const updateOrderStatus = useCallback(async (): Promise<boolean> => {
    if (!organizationId || !originalOrder?.id) {
      throw new Error('Missing required parameters for order update');
    }

    try {
      let endpoint = `/organization/${organizationId}/orders/${originalOrder.id}/`;
      const payload = { reason: 'Items validated successfully' };
      
      switch (originalOrder?.status) {
        case OrderStatus.SUBMITTED:
          endpoint = `/organization/${organizationId}/orders/${originalOrder.id}/confirm`;
          break;
        case OrderStatus.CONFIRMED:
        case OrderStatus.PROCESSING:
          endpoint = `/organization/${organizationId}/orders/${originalOrder.id}/ship`;
          break;
        case OrderStatus.SHIPPED:
          endpoint = `/organization/${organizationId}/orders/${originalOrder.id}/deliver`;
          break;
        default:
          endpoint = `/organization/${organizationId}/orders/${originalOrder.id}/confirm`;
      }

      const response = await api.post(endpoint, payload);

      if (response.status !== 201 && response.status !== 200) {
        throw new Error(`Failed to update order status: ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to update order status:', error);
      throw error;
    }
  }, [organizationId, originalOrder]);

  return { updateItem, updateOrderStatus };
};

