    import { api } from "../../lib/api";
import {Store} from "./store.types"

export const storeService = {
    getAllStores: async (): Promise<Store[]> => {
        const { data } = await api.get('/stores/all')
        return data
    }
}
