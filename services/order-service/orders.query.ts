import { useQuery } from "@tanstack/react-query";
import { ordersService } from "./orders.service";

export const useGetOrders = (userID: string) => {
    return useQuery({
        queryKey: ['orders', userID],
        queryFn: () => ordersService.getOrders(userID)
    })
}

