import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { invoiceService } from "./invoice.service";

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
