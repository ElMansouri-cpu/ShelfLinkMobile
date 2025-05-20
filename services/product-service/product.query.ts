import { useQuery } from "@tanstack/react-query";
import { productService } from "./product.service";

export const useGetProductsByCategorie=(storeId:string,categorieId:string)=>{
    return useQuery({
        queryKey:['Products',storeId,categorieId],
        queryFn:()=>productService.getProductsbyCategorie(storeId,categorieId)
    })
}