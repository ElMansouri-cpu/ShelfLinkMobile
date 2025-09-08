export interface Product {
    id: string;
    name: string;
    mainImage: string | null;
    sellPriceTtc: number;
    buyPriceHt: string;
    buyPriceNetHt: string;
    sellPriceHt: string;
    marginPct: string;
    marginType: string;
    isPromo: boolean;
    promoPriceHt: string | null;
    promoPriceTtc: string | null;
    promoType: string;
    promoAmount: string | null;
    promoSavings: string | null;
    promoValue: string | null;
    status: string;
    isVisible: boolean;
    tags: string[] | null;
    brand: {
        id: string;
        name: string;
        logoUrl: string;
        isActive: boolean;
    };
    category: {
        id: string;
        name: string;
        imageUrl: string;
        sortOrder: number;
        isActive: boolean;
    };
    taxes: Array<{
        id: string;
        name: string;
        rate: string;
        isActive: boolean;
    }>;
    createdAt: string;
    updatedAt: string;
    organizationId: string;
    barcode: string | null;
    brandId: string;
    categoryId: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
}

export interface ProductsResponse extends PaginatedResponse<Product> {}