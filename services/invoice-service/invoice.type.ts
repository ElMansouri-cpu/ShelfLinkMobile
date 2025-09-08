// Invoice Domain Types
import { Order } from "../order-service/orders.type";
import { IUser } from "../user-service/user.type";
import { IOrganization } from "../store-service/store.types";

export interface IInvoice {
  id: string;
  createdAt: string;
  updatedAt: string;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: string;
  subtotalAmount: string;
  taxAmount: string;
  discountAmount: string;
  shippingAmount: string;
  status: InvoiceStatus;
  type: InvoiceType;
  paymentStatus: PaymentStatus;
  paidAmount: string;
  remainingAmount: string;
  paymentDate: string;
  paymentMethod: PaymentMethod | null;
  payments: IPaymentTransaction[];
  statusHistory: IStatusHistoryEntry[];
  paymentStatusHistory: IPaymentStatusHistoryEntry[];
  orderId: string;
  retailerId: string;
  organizationId: string;
  order: Order;
  retailer: IUser;
  organization: IOrganization;
  statusChangedAt: string | null;
  statusChangedBy: string | null;
  note: string | null;
}

// Enums
export enum InvoiceStatus {
  UNCOMPLETED = 'uncompleted',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum InvoiceType {
  ORDER = 'order',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment'
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  OVERPAID = 'overpaid'
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  CHECK = 'check',
  MOBILE_PAYMENT = 'mobile_payment',
  CRYPTO = 'crypto'
}

// Payment Transaction
export interface IPaymentTransaction {
  id: string;
  paymentDate: string;
  paymentAmount: number;
  paymentMethod: PaymentMethod;
  createdBy: string;
  createdAt: string;
  note: string | null;
  createdByUser?: IUser;
}

// Status History
export interface IStatusHistoryEntry {
  status: string;
  changedAt: string;
  reason: string;
  changedBy?: string;
}

// Payment Status History
export interface IPaymentStatusHistoryEntry {
  status: string;
  changedAt: string;
  changedBy?: string;
  amount?: number;
  reason: string;
}

// Order Types

// API Request/Response Types
export interface ICreateInvoiceRequest {
  orderId: string;
  retailerId: string;
  organizationId: string;
  invoiceDate: string;
  totalAmount: string;
  subtotalAmount: string;
  taxAmount: string;
  discountAmount: string;
  shippingAmount: string;
  type: InvoiceType;
  note?: string;
}

export interface IUpdateInvoiceRequest {
  status?: InvoiceStatus;
  paymentStatus?: PaymentStatus;
  note?: string;
}

export interface IAddPaymentRequest {
  paymentAmount: number;
  paymentMethod: PaymentMethod;
  note?: string;
}

export interface IInvoiceListResponse {
  items: IInvoice[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface IUpdateInvoiceStatusRequest{
  organizationId: string;
  invoiceId: string;
  data: {
    status: string;
    reason?: string;
  }
}
