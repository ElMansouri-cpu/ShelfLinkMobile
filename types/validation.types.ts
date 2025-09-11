import { OrderItem, Order, OrderItemStatus, OrderStatus } from "../services/order-service/orders.type";

// Validation status for individual items during processing
export type ValidationStatus = 'pending' | 'success' | 'error';

// Extended OrderItem with validation-specific properties
export interface ValidatedItem extends OrderItem {
  updatedQuantity: number;
  updatedTotalAmount: string;
  updatedSubtotalAmount: string;
  validationStatus?: ValidationStatus;
  errorMessage?: string;
}

// Summary of validation results
export interface ValidationSummary {
  totalItems: number;
  validatedItems: number;
  cancelledItems: number;
  totalAmount: number;
  originalAmount: number;
  amountDifference: number;
}

// Validation completion callback data
export interface ValidationCompleteData {
  validatedItems: ValidatedItem[];
  summary: ValidationSummary;
}

// Props for ItemsValidator component
export interface ItemsValidatorProps {
  isOpen: boolean;
  onClose: () => void;
  items: OrderItem[];
  onValidationComplete?: (data: ValidationCompleteData) => void;
  originalOrder: Order;
}

// Props for individual item validator row
export interface ItemValidatorRowProps {
  item: ValidatedItem;
  originalOrder: Order;
  onQuantityUpdate: (itemId: string, newQuantity: number) => void;
  onToggleValidation: (itemId: string, isValidated: boolean) => void;
  getOriginalItem: (item: ValidatedItem) => OrderItem | undefined;
}

// Validation progress dialog props
export interface ValidationProgressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  validatedItems: ValidatedItem[];
  validationComplete: boolean;
  onProcessMore: () => void;
}

// Status reason enum for validation actions
export enum StatusReason {
  ITEM_CONFIRMED = 'item_confirmed',
  ITEM_CANCELLED = 'item_cancelled',
  QUANTITY_UPDATED = 'quantity_updated',
  ITEM_SHIPPED = 'item_shipped',
  ITEM_DELIVERED = 'item_delivered'
}

// Order status progression mapping
export const getNextItemStatus = (currentOrderStatus: OrderStatus): OrderItemStatus => {
  switch (currentOrderStatus) {
    case OrderStatus.SUBMITTED:
      return OrderItemStatus.VALIDATED;
    case OrderStatus.CONFIRMED:
    case OrderStatus.PROCESSING:
      return OrderItemStatus.SHIPPED;
    case OrderStatus.SHIPPED:
      return OrderItemStatus.DELIVERED;
    default:
      return OrderItemStatus.VALIDATED;
  }
};

// Check if order status allows validation
export const canValidateOrder = (status: OrderStatus): boolean => {
  return [
    OrderStatus.SUBMITTED,
    OrderStatus.CONFIRMED,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED
  ].includes(status);
};

// Get validation button text based on order status
export const getValidationButtonText = (status: OrderStatus): string => {
  switch (status) {
    case OrderStatus.SUBMITTED:
      return 'validation.validate_items';
    case OrderStatus.CONFIRMED:
    case OrderStatus.PROCESSING:
      return 'validation.ship_items';
    case OrderStatus.SHIPPED:
      return 'validation.deliver_items';
    default:
      return 'validation.validate_items';
  }
};
