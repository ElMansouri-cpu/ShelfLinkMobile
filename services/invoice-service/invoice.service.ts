import { api } from '../../lib/api';
import { InvoiceResponse, InvoiceFilters, Invoice } from './invoice.type';

export const invoiceService = {
  // Get all invoices with optional filters
  async getInvoices(filters: InvoiceFilters = {}): Promise<InvoiceResponse> {
    console.log('📄 InvoiceService - getInvoices called with filters:', filters);
    
    const params = new URLSearchParams();
    
    if (filters.paymentStatus) {
      params.append('paymentStatus', filters.paymentStatus);
    }
    
    if (filters.organizationId) {
      params.append('organizationId', filters.organizationId);
    }
    
    if (filters.page) {
      params.append('page', filters.page.toString());
    }
    
    if (filters.size) {
      params.append('size', filters.size.toString());
    }

    const queryString = params.toString();
    const url = `/users/invoices${queryString ? `?${queryString}` : ''}`;
    
    console.log('📄 InvoiceService - Making API request to:', url);
    
    const { data } = await api.get(url);
    
    console.log('📄 InvoiceService - getInvoices response:', {
      totalInvoices: data?.invoices || 0,
      total: data?.total || 0,
      page: data?.page || 0,
      size: data?.size || 0,
      hasNext: data?.hasNext || false,
      hasPrevious: data?.hasPrevious || false
    });
    
    return data;
  },

  // Get all unpaid invoices
  async getUnpaidInvoices(page: number = 1, size: number = 20): Promise<InvoiceResponse> {
    console.log('📄 InvoiceService - getUnpaidInvoices called with page:', page, 'size:', size);
    return this.getInvoices({
      paymentStatus: 'unpaid',
      page,
      size
    });
  },

  // Get invoices from specific organization
  async getInvoicesByOrganization(
    organizationId: string, 
    paymentStatus?: 'paid' | 'unpaid' | 'partially_paid',
    page: number = 1,
    size: number = 20
  ): Promise<InvoiceResponse> {
    console.log('📄 InvoiceService - getInvoicesByOrganization called with:', {
      organizationId,
      paymentStatus,
      page,
      size
    });
    return this.getInvoices({
      organizationId,
      paymentStatus,
      page,
      size
    });
  },

  // Get invoice by order ID
  async getInvoiceByOrderId(organizationId: string, orderId: string): Promise<Invoice> {
    console.log('📄 InvoiceService - getInvoiceByOrderId called with organizationId:', organizationId, 'orderId:', orderId);
    const { data } = await api.get(`/organization/${organizationId}/invoices/order/${orderId}`);
    console.log('📄 InvoiceService - getInvoiceByOrderId response:', {
      invoiceId: data?.id,
      invoiceNumber: data?.invoiceNumber,
      amount: data?.amount,
      paymentStatus: data?.paymentStatus
    });
    return data;
  },

  // Generate PDF for invoice
  async generatePdf(organizationId: string, invoiceId: string): Promise<any> {
    console.log('📄 InvoiceService - generatePdf called with organizationId:', organizationId, 'invoiceId:', invoiceId);
    
    try {
      const response = await api.get(`/organization/${organizationId}/invoices/${invoiceId}/pdf`, {
        responseType: 'blob' // This ensures we get the binary data
      });
      
      console.log('📄 InvoiceService - generatePdf response type:', typeof response.data);
      console.log('📄 InvoiceService - generatePdf response constructor:', response.data?.constructor?.name);
      console.log('📄 InvoiceService - generatePdf response size:', response.data?.size || 'unknown');
      
      return response.data;
    } catch (error) {
      console.error('📄 InvoiceService - generatePdf error:', error);
      throw error;
    }
  },

  // Validate payment
  async validatePayment(organizationId: string, invoiceId: string, paymentId: string, validationStatus: 'pending' | 'approved' | 'rejected', validationNote?: string): Promise<{ success: boolean }> {
    console.log('💳 InvoiceService - validatePayment called with:', {
      organizationId,
      invoiceId,
      paymentId,
      validationStatus,
      validationNote
    });
    const { data } = await api.post(`/organization/${organizationId}/invoices/${invoiceId}/payments/${paymentId}/validate`, {
      validationStatus,
      validationNote
    });
    console.log('💳 InvoiceService - validatePayment response:', data);
    return data;
  },



};