import { Product } from "../product-service/product.type";
import { IUser } from "../user-service/user.type";

export interface ILocation {
    lat: number;
    lng: number;
    address: string;
  }

export interface IOrganization {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    address: string | null;
    location: ILocation;
    productsCount: number;
    ordersCount: number;
    logoUrl: string;
    bannerUrl: string;
    status: string;
    ownerId: string;
    qrCode: string;
    createdAt: string;
    updatedAt: string;
  }
export enum UpdateReason {
    MISSING_PRODUCT = 'missing_product',
    WRONG_PRODUCT = 'wrong_product',
    ADDED_PRODUCT = 'added_product',
    REMOVED_PRODUCT = 'removed_product',
    UPDATED_QUANTITY = 'updated_quantity',
    UNAVAILABLE_QUANTITY = 'unavailable_quantity', // Fixed typo
    CUSTOMER_REQUEST = 'customer_request',
    INVENTORY_SHORTAGE = 'inventory_shortage',
    OTHER = 'other'
  }
export interface Order  {
    id:any;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    // Basic information
    orderReferenceNumber: string;
    retailerId: string;
    organizationId: string;
    assignedTo?: string;
    createdBy?: string;
    isBackofficeCreated: boolean;

    // Financial information
    totalAmount: string;
    subtotalAmount: string;
    discountAmount: string;
    taxAmount: string;
    shippingAmount: string;

    // Order details
    orderType: OrderType;
    destination: string;
    latitude: string;
    longitude: string;
    updateReason?: UpdateReason;
    isUpdated: boolean;
    status: OrderStatus;

    // Dates
    orderDate: Date;
    estimatedDeliveryDate?: Date;
    actualDeliveryDate?: Date;

    // Notes
    note?: string;
    customerInstructions?: string;

    // Audit fields
    statusChangedAt?: Date;
    statusChangedBy?: string;
    statusHistory?: OrderStatusHistory[];

    // Relationships
    retailer?: IUser;
    assignedToUser?: IUser;
    organization?: IOrganization;
    items?: OrderItem[];

    // Computed properties
    isDeliverable: boolean;
    isPending: boolean;
    isCompleted: boolean;
    isCancellable: boolean;
}
export interface OrderItem  {
    id: string;
    orderId: string;
    variantId: string;
    quantity: number;
    fulfilledQuantity: number;
    refundedQuantity: number;
    status: OrderItemStatus;

    // Pricing
    unitPrice: string;
    discountAmount: string;
    taxAmount: string;
    totalAmount: string;
    discountPercentage?: string;
    taxPercentage?: string;

    // Replacement tracking
    replacedWithVariantId?: string;
    replacementForItemId?: string;

    // Notes and reasons
    note?: string;
    statusReason?: string;

    // Audit fields
    statusChangedAt?: Date;
    statusChangedBy?: string;
    statusHistory?: OrderItemStatusHistory[];

    // Relationships
    variant?: Product;
    replacedWithVariant?: Product;
    replacementForItem?: OrderItem;

    // Computed properties
    remainingQuantity: number;
    isFullyFulfilled: boolean;
    isPartiallyFulfilled: boolean;
    isRefunded: boolean;
    isCancelled: boolean;
    isReplaced: boolean;
    subtotalAmount: string;
    finalAmount: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;

}

export enum OrderItemStatus {
    PENDING_VALIDATION = 'pending_validation',  // When order is submitted
    VALIDATED = 'validated',                    // Stock confirmed and price locked
    QUANTITY_UPDATED = 'quantity_updated',      // Wholesaler adjusts available stock
    REPLACED = 'replaced',                      // Substituted with alternative
    DELIVERED = 'delivered',                    // Item delivered to retailer
    RETURNED = 'returned',                      // After delivery, retailer returns item
    REFUNDED = 'refunded',                      // Return accepted, credit note issued
    CANCELLED = 'cancelled',                    // Item cancelled
    SHIPPED = 'shipped'                         // Item shipped
  }

export enum OrderStatus {
    SUBMITTED = 'submitted',            // Retailer confirms and sends to wholesaler
    CONFIRMED = 'confirmed',            // Wholesaler accepts (stock & pricing validated)
    PROCESSING = 'processing',          // Items being picked/packed
    SHIPPED = 'shipped',                // Order dispatched
    DELIVERED = 'delivered',            // Retailer receives goods
    COMPLETED = 'completed',            // No more changes
    CANCELLED = 'cancelled'             // Order cancelled before shipping
  }

  export enum OrderType {
    DELIVERY = 'delivery',
    PICKUP = 'pickup'
}


export interface OrderItemStatusHistory {
    status: OrderItemStatus;
    changedAt: Date;
    changedBy?: string;
    reason?: string;
    quantity?: number;
}

export interface OrderStatusHistory {
    status: OrderStatus;
    changedAt: Date;
    changedBy?: string;
    reason?: string;
}