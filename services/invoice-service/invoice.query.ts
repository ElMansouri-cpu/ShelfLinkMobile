import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { invoiceService } from './invoice.service';
import { InvoiceFilters } from './invoice.type';

export const useGetInvoices = (filters: InvoiceFilters = {}) => {
  console.log('📄 InvoiceQuery - useGetInvoices hook called with filters:', filters);
  
  return useQuery({
    queryKey: ['invoices', filters],
    queryFn: () => {
      console.log('📄 InvoiceQuery - useGetInvoices executing queryFn');
      return invoiceService.getInvoices(filters);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useGetUnpaidInvoices = (page: number = 1, size: number = 20) => {
  console.log('📄 InvoiceQuery - useGetUnpaidInvoices hook called with page:', page, 'size:', size);
  
  return useQuery({
    queryKey: ['invoices', 'unpaid', page, size],
    queryFn: () => {
      console.log('📄 InvoiceQuery - useGetUnpaidInvoices executing queryFn');
      return invoiceService.getUnpaidInvoices(page, size);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useGetInvoicesByOrganization = (
  organizationId: string,
  paymentStatus?: 'paid' | 'unpaid' | 'partially_paid',
  page: number = 1,
  size: number = 20
) => {
  console.log('📄 InvoiceQuery - useGetInvoicesByOrganization hook called with:', {
    organizationId,
    paymentStatus,
    page,
    size
  });
  
  return useQuery({
    queryKey: ['invoices', 'organization', organizationId, paymentStatus, page, size],
    queryFn: () => {
      console.log('📄 InvoiceQuery - useGetInvoicesByOrganization executing queryFn');
      return invoiceService.getInvoicesByOrganization(organizationId, paymentStatus, page, size);
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useGetInvoiceByOrderId = (organizationId: string, orderId: string) => {
  console.log('📄 InvoiceQuery - useGetInvoiceByOrderId hook called with organizationId:', organizationId, 'orderId:', orderId);
  
  return useQuery({
    queryKey: ['invoice', 'order', organizationId, orderId],
    queryFn: () => {
      console.log('📄 InvoiceQuery - useGetInvoiceByOrderId executing queryFn');
      return invoiceService.getInvoiceByOrderId(organizationId, orderId);
    },
    enabled: !!organizationId && !!orderId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useGeneratePdf = (organizationId: string, invoiceId: string) => {
  console.log('📄 InvoiceQuery - useGeneratePdf hook called with organizationId:', organizationId, 'invoiceId:', invoiceId);
  console.log('📄 InvoiceQuery - useGeneratePdf enabled check:', {
    organizationId: !!organizationId,
    invoiceId: !!invoiceId,
    enabled: !!(organizationId && invoiceId)
  });
  
  return useQuery({
    queryKey: ['invoice', 'pdf', organizationId, invoiceId],
    queryFn: () => {
      console.log('📄 InvoiceQuery - useGeneratePdf executing queryFn');
      return invoiceService.generatePdf(organizationId, invoiceId);
    },
    enabled: !!organizationId && !!invoiceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useValidatePayment = () => {
  const queryClient = useQueryClient();
  
  console.log('💳 InvoiceQuery - useValidatePayment hook called');
  
  return useMutation({
    mutationFn: ({ organizationId, invoiceId, paymentId, validationStatus, validationNote }: { organizationId: string; invoiceId: string; paymentId: string; validationStatus: 'pending' | 'approved' | 'rejected'; validationNote?: string }) => {
      console.log('💳 InvoiceQuery - useValidatePayment executing mutationFn');
      return invoiceService.validatePayment(organizationId, invoiceId, paymentId, validationStatus, validationNote);
    },
    onSuccess: () => {
      console.log('💳 InvoiceQuery - useValidatePayment mutation successful, invalidating payments queries');
      // Invalidate payments queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error) => {
      console.error('💳 InvoiceQuery - useValidatePayment mutation failed:', error);
    },
  });
};

// Infinite scroll hooks
export const useGetInvoicesInfinite = (filters: InvoiceFilters = {}) => {
  console.log('📄 InvoiceQuery - useGetInvoicesInfinite hook called with filters:', filters);
  
  return useInfiniteQuery({
    queryKey: ['invoices', 'infinite', filters],
    queryFn: ({ pageParam = 1 }) => {
      console.log('📄 InvoiceQuery - useGetInvoicesInfinite executing queryFn with pageParam:', pageParam);
      return invoiceService.getInvoices({
        ...filters,
        page: pageParam,
        size: 20
      });
    },
    getNextPageParam: (lastPage) => {
      console.log('📄 InvoiceQuery - useGetInvoicesInfinite getNextPageParam:', {
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

export const useGetAllInvoicesInfinite = () => {
  console.log('📄 InvoiceQuery - useGetAllInvoicesInfinite hook called (no status filter)');
  
  return useInfiniteQuery({
    queryKey: ['invoices', 'infinite', 'all'],
    queryFn: ({ pageParam = 1 }) => {
      console.log('📄 InvoiceQuery - useGetAllInvoicesInfinite executing queryFn with pageParam:', pageParam);
      return invoiceService.getInvoices({
        page: pageParam,
        size: 20
        // No paymentStatus filter to get all invoices
      });
    },
    getNextPageParam: (lastPage) => {
      console.log('📄 InvoiceQuery - useGetAllInvoicesInfinite getNextPageParam:', {
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