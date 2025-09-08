import { api } from "../../lib/api";
import { Categorie, Brands } from "./categorie.type";

export const categorieService = {
    getAllCategories: async (id: string): Promise<Categorie[]> => {
        const { data } = await api.get(`/organization/${id}/categories/all`);
        return data;
    },
    getBrandsByCategorie: async (organizationId: string, categorieId: string): Promise<Brands[]> => {
        const { data } = await api.get(`/organization/${organizationId}/brands/category/${categorieId}`);
        return data;
    }
}

