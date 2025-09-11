import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { invoiceService } from "./invoice.service";
import { PaymentMethod } from "./invoice.type";

export const useGetInvoiceByOrderId = (organizationId: string, orderId: string) => {
    return useQuery({
        queryKey: ['invoice', organizationId, orderId],
        queryFn: () => invoiceService.getInvoiceByOrderId(organizationId, orderId),
    });
}

export const useGeneratePdf = (organizationId: string, invoiceId: string) => {
    return useQuery({
        queryKey: ['invoice-pdf', organizationId, invoiceId],
        queryFn: () => invoiceService.generatePdf(invoiceId, organizationId),
        enabled: !!invoiceId && !!organizationId, // Only run when both IDs are available
    });
}

export const useAddPayment = (organizationId: string, invoiceId: string) => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (paymentData: {
            paymentAmount: number;
            paymentMethod: PaymentMethod;
            note?: string;
        }) => invoiceService.addPayment(organizationId, invoiceId, paymentData),
        onSuccess: () => {
            // Invalidate and refetch invoice data
            queryClient.invalidateQueries({ queryKey: ['invoice', organizationId] });
        },
    });
}
