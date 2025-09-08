import { api } from "../../lib/api";
import { Order } from "./orders.type";

export const ordersService = {
    getOrders: async (userID: string, page: number = 1, size: number = 10, organizationId?: string, status?: string): Promise<{
        items: Order[];
        total: number;
        page: number;
        size: number;
        totalPages: number;
    }> => {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
        });
        
        if (organizationId) {
            params.append('organizationId', organizationId);
        }
        
        if (status && status !== 'all') {
            params.append('status', status);
        }
        
        const { data } = await api.get(`/users/orders/${userID}?${params.toString()}`);
        return data;
    },
    cancelOrder: async (orderID: string,organizationId: string): Promise<void> => {
        await api.post(`/organization/${organizationId}/orders/${orderID}/cancel`,{
            reason: "Cancelled by retailer"
        });
    },
    fetchOrderDetails: async (orderID: string,organizationId: string): Promise<Order> => {
        const { data } = await api.get(`/organization/${organizationId}/orders/${orderID}`);
        return data;
    }

}
