import { useInfiniteQuery } from "@tanstack/react-query";
import { productService } from "./product.service";

export const useGetProductsByCategorie = (storeId: string, categorieId: string, enabled: boolean = true) => {
    return useInfiniteQuery({
        queryKey: ['Products', storeId, categorieId],
        queryFn: ({ pageParam = 1 }) => 
            productService.getProductsbyCategorie(storeId, categorieId, pageParam, 10),
        getNextPageParam: (lastPage) => {
            if (lastPage.page < lastPage.totalPages) {
                return lastPage.page + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
        enabled: enabled && !!storeId && !!categorieId,
    });
}

export const useGetProductsByBrandAndCategorie = (storeId: string, brandId: string, categorieId: string, enabled: boolean = true) => {
    return useInfiniteQuery({
        queryKey: ['Products', storeId, brandId, categorieId],
        queryFn: ({ pageParam = 1 }) => 
            productService.getProductsByBrandAndCategorie(storeId, brandId, categorieId, pageParam, 10),
        getNextPageParam: (lastPage) => {
            if (lastPage.page < lastPage.totalPages) {
                return lastPage.page + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
        enabled: enabled && !!storeId && !!brandId && !!categorieId,
    });
}

export const useSearchProducts = (storeId: string, query: string) => {
    return useInfiniteQuery({
        queryKey: ['Products', storeId, query],
        queryFn: ({ pageParam = 1 }) => 
            productService.searchProducts(storeId, query, pageParam, 10),
        getNextPageParam: (lastPage) => {
            if (lastPage.page < lastPage.totalPages) {
                return lastPage.page + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
        enabled: !!storeId && !!query,
    });
}

export const useGetPromotionalProducts = (storeId: string) => {
    return useInfiniteQuery({
        queryKey: ['Products', storeId, 'promotions'],
        queryFn: ({ pageParam = 1 }) => 
            productService.getPromotionalProducts(storeId, pageParam, 10),
        getNextPageParam: (lastPage) => {
            if (lastPage.page < lastPage.totalPages) {
                return lastPage.page + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
        enabled: !!storeId,
    });
}


