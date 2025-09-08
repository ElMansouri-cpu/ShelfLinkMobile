import { api } from "../../lib/api";
import { IInvoice } from "./invoice.type";

export const invoiceService = {
    getInvoiceByOrderId: async (organizationId: string, orderId: string): Promise<IInvoice> => {
        const { data } = await api.get(`/organization/${organizationId}/invoices/order/${orderId}`);
        console.log(data);
        return data;
    },
     generatePdf: async (id: string,organizationId: string): Promise<Blob> => {
        const response = await api.get(`/organization/${organizationId}/invoices/${id}/pdf`, { responseType: 'blob' });
        return response.data;
    }
}