import { api } from "../../lib/api";
import { Order } from "./orders.type";

export const ordersService = {
    getOrders: async (userID: string): Promise<Order[]> => {
        const { data } = await api.get(`/orders/user/${userID}`);
        return data;
    }
}
