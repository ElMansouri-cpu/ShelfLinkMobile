export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: string;
  subtotalAmount: string;
  taxAmount: string;
  discountAmount: string;
  shippingAmount: string;
  status: 'completed' | 'uncompleted';
  type: 'order';
  paymentStatus: 'paid' | 'unpaid' | 'partially_paid';
  paidAmount: string;
  remainingAmount: string;
  paymentDate?: string;
  paymentMethod?: string;
  payments: PaymentDetail[];
  statusHistory: StatusHistory[];
  paymentStatusHistory: PaymentStatusHistory[];
  order: OrderDetail;
  organization: {
    id: string;
    name: string;
    logoUrl?: string;
    location?: {
      lat: number;
      lng: number;
      address: string;
    };
  };
  statusChangedAt?: string;
  statusChangedBy?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  // Legacy fields for backward compatibility
  amount?: number;
  dueDate?: Date;
  items?: Array<{
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export interface PaymentDetail {
  id: string;
  paymentDate: string;
  paymentAmount: number;
  paymentMethod: string;
  createdBy: string;
  createdAt: string;
  validationStatus: string;
  createdByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: string;
  };
  validatedBy?: string;
  validatedAt?: string;
  validatedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: string;
  };
}

export interface StatusHistory {
  status: string;
  changedAt: string;
  reason: string;
  changedBy?: string;
}

export interface PaymentStatusHistory {
  status: string;
  changedAt: string;
  reason: string;
  changedBy?: string;
  amount?: number;
  changedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: string;
  };
}

export interface OrderDetail {
  id: string;
  createdAt: string;
  updatedAt: string;
  orderReferenceNumber: string;
  retailerId: string;
  organizationId: string;
  assignedTo: string;
  createdBy: string;
  isBackofficeCreated: boolean;
  totalAmount: string;
  subtotalAmount: string;
  discountAmount: string;
  taxAmount: string;
  shippingAmount: string;
  orderType: string;
  destination: string;
  latitude: string;
  longitude: string;
  updateReason: string;
  isUpdated: boolean;
  status: string;
  orderDate: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  note?: string;
  customerInstructions?: string;
  statusChangedAt: string;
  statusChangedBy: string;
  statusHistory: StatusHistory[];
  deletedAt?: string;
}

export interface InvoiceResponse {
  invoices: Invoice[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  validatedBy?: string;
  validatedAt?: string;
  validationStatus: string;
  organization: {
    id: string;
    name: string;
    logoUrl: string;
  };
}

export interface PaymentResponse {
  payments: Payment[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface InvoiceFilters {
  paymentStatus?: 'paid' | 'unpaid' | 'partially_paid';
  organizationId?: string;
  page?: number;
  size?: number;
}

export interface PaymentFilters {
  organizationId?: string;
  page?: number;
  size?: number;
}