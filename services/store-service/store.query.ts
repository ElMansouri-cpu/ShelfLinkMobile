import { useQuery } from "@tanstack/react-query";
import { storeService } from "./store.service";

export const useGetAllStores = () => {
    return useQuery({
        queryKey: ['stores'],
        queryFn: storeService.getAllStores
    })
}
