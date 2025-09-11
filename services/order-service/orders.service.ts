import { api } from "../../lib/api";
import { Order } from "./orders.type";

export const ordersService = {
    getOrders: async ( page: number = 1, size: number = 10, organizationId?: string, status?: string,retailerId?: string): Promise<{
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

        if (retailerId && retailerId !== 'undefined') {
            params.append('retailerId', retailerId);
        }
        

        
        if (status && status !== 'all') {
            params.append('status', status);
        }
        
        const { data } = await api.get(`/organization/${organizationId}/orders/assigned?${params.toString()}`);
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
    },

    // Item validation methods
    validateItem: async (orderID: string, itemID: string, organizationId: string, reason: string = "Item validated"): Promise<void> => {
        await api.post(`/organization/${organizationId}/orders/${orderID}/items/${itemID}/validate`, {
            reason
        });
    },

    cancelItem: async (orderID: string, itemID: string, organizationId: string, reason: string = "Item cancelled"): Promise<void> => {
        await api.post(`/organization/${organizationId}/orders/${orderID}/items/${itemID}/cancel`, {
            reason
        });
    },

    updateItemQuantity: async (orderID: string, itemID: string, organizationId: string, quantity: number, reason: string = "Quantity updated"): Promise<void> => {
        await api.post(`/organization/${organizationId}/orders/${orderID}/items/${itemID}/update-quantity`, {
            quantity,
            reason
        });
    },

    shipItem: async (orderID: string, itemID: string, organizationId: string, reason: string = "Item shipped"): Promise<void> => {
        await api.post(`/organization/${organizationId}/orders/${orderID}/items/${itemID}/ship`, {
            reason
        });
    },

    deliverItem: async (orderID: string, itemID: string, organizationId: string, deliveredQuantity: number, reason: string = "Item delivered"): Promise<void> => {
        await api.post(`/organization/${organizationId}/orders/${orderID}/items/${itemID}/deliver`, {
            deliveredQuantity,
            reason
        });
    },

    // Order status progression methods
    confirmOrder: async (orderID: string, organizationId: string, reason: string = "Order confirmed"): Promise<void> => {
        await api.post(`/organization/${organizationId}/orders/${orderID}/confirm`, {
            reason
        });
    },

    shipOrder: async (orderID: string, organizationId: string, reason: string = "Order shipped"): Promise<void> => {
        await api.post(`/organization/${organizationId}/orders/${orderID}/ship`, {
            reason
        });
    },

    deliverOrder: async (orderID: string, organizationId: string, reason: string = "Order delivered"): Promise<void> => {
        await api.post(`/organization/${organizationId}/orders/${orderID}/deliver`, {
            reason
        });
    },

    completeOrder: async (orderID: string, organizationId: string, reason: string = "Order completed"): Promise<void> => {
        await api.post(`/organization/${organizationId}/orders/${orderID}/complete`, {
            reason
        });
    }
}
