import { api } from '../../lib/api';
import { PaymentResponse, PaymentFilters } from '../invoice-service/invoice.type';

export const paymentService = {
  // Get all payments with optional filters
  async getPayments(filters: PaymentFilters = {}): Promise<PaymentResponse> {
    console.log('💳 PaymentService - getPayments called with filters:', filters);
    
    const params = new URLSearchParams();
    
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
    const url = `/users/payments${queryString ? `?${queryString}` : ''}`;
    
    console.log('💳 PaymentService - Making API request to:', url);
    
    const { data } = await api.get(url);
    
    console.log('💳 PaymentService - getPayments response:', {
      totalPayments: data?.payments || 0,
      total: data?.total || 0,
      page: data?.page || 0,
      size: data?.size || 0,
      hasNext: data?.hasNext || false,
      hasPrevious: data?.hasPrevious || false
    });
    
    return data;
  },

  // Get payments from specific organization
  async getPaymentsByOrganization(
    organizationId: string,
    page: number = 1,
    size: number = 50
  ): Promise<PaymentResponse> {
    console.log('💳 PaymentService - getPaymentsByOrganization called with:', {
      organizationId,
      page,
      size
    });
    return this.getPayments({
      organizationId,
      page,
      size
    });
  }
};
