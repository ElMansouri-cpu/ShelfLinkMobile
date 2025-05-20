import { useQuery } from "@tanstack/react-query";
import { categorieService } from "./categorie.service";

export const useGetAllCategories = (id: string) => {
    return useQuery({
        queryKey: ['categories', id],
        queryFn: () => categorieService.getAllCategories(id),
    });
}

