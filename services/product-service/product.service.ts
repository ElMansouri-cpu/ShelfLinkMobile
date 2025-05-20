import { api } from "../../lib/api";
import { Product } from "./product.type";

export const productService ={
 getProductsbyCategorie:async (storeId,categorieId):Promise<Product[]>=>{
    const {data} = await api.get(`/stores/${storeId}/categories/${categorieId}/products`)
    return data
 }   
}