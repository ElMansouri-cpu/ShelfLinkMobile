import { api } from "../../lib/api";
import { Categorie } from "./categorie.type";

export const categorieService = {
    getAllCategories: async (id: string): Promise<Categorie[]> => {
        const { data } = await api.get(`/stores/${id}/categories`);
        return data;
    }
}

