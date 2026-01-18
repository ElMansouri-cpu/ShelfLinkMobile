    import { api } from "../../lib/api";
import {IClientRelationship} from "./store.types"

export const storeService = {
    getAllStores: async (): Promise<IClientRelationship[]> => {
        const { data } = await api.get('/users/client-relationships')
        console.log(data);
        return data
    }
}
