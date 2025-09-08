import { api } from "../../lib/api";
import { Product, ProductsResponse } from "./product.type";

export const productService = {
    getProductsbyCategorie: async (
        storeId: string, 
        categorieId: string, 
        page: number = 1, 
        size: number = 10
    ): Promise<ProductsResponse> => {
        const { data } = await api.get(
            `/organization/${storeId}/products/search?categoryIds=${categorieId}&page=${page}&size=${size}`
        );
        return data;
    },

    getProductsByBrandAndCategorie: async (
        storeId: string, 
        brandId: string, 
        categorieId: string, 
        page: number = 1, 
        size: number = 10
    ): Promise<ProductsResponse> => {
        const { data } = await api.get(
            `/organization/${storeId}/products/search?brandIds=${brandId}&categoryIds=${categorieId}&page=${page}&size=${size}`
        );
        return data;
    },
    
    searchProducts: async (
        storeId: string, 
        query: string, 
        page: number = 1, 
        size: number = 10
    ): Promise<ProductsResponse> => {
        const { data } = await api.get(
            `/organization/${storeId}/products/search?q=${query}&page=${page}&size=${size}`
        );
        return data;
    },

    getPromotionalProducts: async (
        storeId: string, 
        page: number = 1, 
        size: number = 10
    ): Promise<ProductsResponse> => {
        const { data } = await api.get(
            `/organization/${storeId}/products/search?isPromo=true&page=${page}&size=${size}`
        );
        return data;
    }
}


