import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { storeService } from "./store.service";
import { StoreRetailersParams } from "./store.types";

export const useGetAllStores = () => {
    return useQuery({
        queryKey: ['stores'],
        queryFn: storeService.getAllStores
    })
}

export const useGetStoreRetailers = (
    organizationId: string,
    params: Omit<StoreRetailersParams, 'page'> = {}
) => {
    return useInfiniteQuery({
        queryKey: ['store-retailers', organizationId, params.q],
        queryFn: async ({ pageParam = 1 }) => {
            try {
                const result = await storeService.getStoreRetailers(organizationId, {
                    ...params,
                    page: pageParam
                });
                
                // Log the response structure for debugging
                console.log('Store retailers API response:', {
                    page: pageParam,
                    hasItems: !!result?.items,
                    itemsLength: result?.items?.length,
                    total: result?.total,
                    totalPages: result?.totalPages,
                    currentPage: result?.page
                });
                
                return result;
            } catch (error) {
                console.error('Error fetching store retailers:', error);
                throw error;
            }
        },
        getNextPageParam: (lastPage) => {
            // Check if there are more pages based on the actual API response structure
            if (!lastPage) {
                console.log('No lastPage data:', lastPage);
                return undefined;
            }
            
            // Use the actual API response structure: page < totalPages means there are more pages
            return lastPage.page < lastPage.totalPages 
                ? lastPage.page + 1 
                : undefined;
        },
        initialPageParam: 1,
        enabled: !!organizationId,
    });
}
