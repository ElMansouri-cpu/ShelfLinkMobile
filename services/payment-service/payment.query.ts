import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { paymentService } from './payment.service';
import { PaymentFilters } from '../invoice-service/invoice.type';

export const useGetPayments = (filters: PaymentFilters = {}) => {
  console.log('💳 PaymentQuery - useGetPayments hook called with filters:', filters);
  
  return useQuery({
    queryKey: ['payments', filters],
    queryFn: () => {
      console.log('💳 PaymentQuery - useGetPayments executing queryFn');
      return paymentService.getPayments(filters);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useGetPaymentsByOrganization = (
  organizationId: string,
  page: number = 1,
  size: number = 50
) => {
  console.log('💳 PaymentQuery - useGetPaymentsByOrganization hook called with:', {
    organizationId,
    page,
    size
  });
  
  return useQuery({
    queryKey: ['payments', 'organization', organizationId, page, size],
    queryFn: () => {
      console.log('💳 PaymentQuery - useGetPaymentsByOrganization executing queryFn');
      return paymentService.getPaymentsByOrganization(organizationId, page, size);
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Infinite scroll hooks for payments
export const useGetPaymentsInfinite = (filters: PaymentFilters = {}) => {
  console.log('💳 PaymentQuery - useGetPaymentsInfinite hook called with filters:', filters);
  
  return useInfiniteQuery({
    queryKey: ['payments', 'infinite', filters],
    queryFn: ({ pageParam = 1 }) => {
      console.log('💳 PaymentQuery - useGetPaymentsInfinite executing queryFn with pageParam:', pageParam);
      return paymentService.getPayments({
        ...filters,
        page: pageParam,
        size: 20
      });
    },
    getNextPageParam: (lastPage) => {
      console.log('💳 PaymentQuery - useGetPaymentsInfinite getNextPageParam:', {
        hasNext: lastPage?.hasNext,
        currentPage: lastPage?.page,
        nextPage: lastPage?.hasNext ? (lastPage.page || 1) + 1 : undefined
      });
      return lastPage?.hasNext ? (lastPage.page || 1) + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    initialPageParam: 1,
  });
};
