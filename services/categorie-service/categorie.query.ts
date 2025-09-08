import { useQuery } from "@tanstack/react-query";
import { categorieService } from "./categorie.service";

export const useGetAllCategories = (id: string) => {
    return useQuery({
        queryKey: ['categories', id],
        queryFn: () => categorieService.getAllCategories(id),
    });
}

export const useGetBrandsByCategorie = (organizationId: string, categorieId: string, enabled: boolean = true) => {
    return useQuery({
        queryKey: ['brands', organizationId, categorieId],
        queryFn: () => categorieService.getBrandsByCategorie(organizationId, categorieId),
        enabled: enabled,
    });
}

