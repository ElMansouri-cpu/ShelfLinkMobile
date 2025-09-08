import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { ordersService } from "./orders.service";

export const useGetOrders = (userID: string | undefined, organizationId?: string, status?: string) => {
    return useInfiniteQuery({
        queryKey: ['orders', userID, organizationId, status],
        queryFn: ({ pageParam = 1 }) => {
            if (!userID) {
                throw new Error('User ID is required');
            }
            return ordersService.getOrders(userID, pageParam, 10, organizationId, status);
        },
        getNextPageParam: (lastPage) => {
            if (lastPage.page < lastPage.totalPages) {
                return lastPage.page + 1;
            }
            return undefined;
        },
        enabled: !!userID && userID !== 'undefined',
        initialPageParam: 1,
    })
}

export const useCancelOrder = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ orderID, organizationId }: { orderID: string; organizationId: string }) => 
            ordersService.cancelOrder(orderID, organizationId),
        onSuccess: (_, { organizationId }) => {
            queryClient.invalidateQueries({ queryKey: ['orders', organizationId] });
        }
    });
}

export const useFetchOrderDetails = (orderID: string | undefined, organizationId: string | undefined) => {
    return useQuery({
        queryKey: ['order-details', orderID, organizationId],
        queryFn: () => {
            if (!orderID || !organizationId) {
                throw new Error('Order ID and Organization ID are required');
            }
            return ordersService.fetchOrderDetails(orderID, organizationId);
        },
        enabled: !!orderID && !!organizationId && orderID !== 'undefined' && organizationId !== 'undefined'
    })
}
