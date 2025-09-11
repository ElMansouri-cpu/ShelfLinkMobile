import { api } from "../../lib/api";
import { IClientRelationship, StoreRetailersParams, StoreRetailersResponse } from "./store.types"

export const storeService = {
    getAllStores: async (): Promise<IClientRelationship[]> => {
        const { data } = await api.get('/users/client-relationships')
        return data
    },
    getStoreRetailers: async (
        organizationId: string, 
        params: StoreRetailersParams = {}
    ): Promise<StoreRetailersResponse> => {
        const { q, page = 1, limit = 10 } = params;
        
        const queryParams = new URLSearchParams();
        if (q) queryParams.append('q', q);
        queryParams.append('page', page.toString());
        queryParams.append('limit', limit.toString());
        
        const { data } = await api.get(
            `/organization/${organizationId}/clients/search?${queryParams.toString()}`
        );
        return data;
    }
}
