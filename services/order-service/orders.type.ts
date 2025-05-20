export type Order = {
    id: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    items: Array<{
        id: string;
        name: string;
        quantity: number;
        totalAmount: number;
        variant: any;


    }>;
    totalAmount: string;
    latitude: number;
    longitude: number;
    destination: string;
    storeId: string;
    userId: string;
    store: any;
    orderType: string;
    isActive: boolean;

    orderDate: string;






}

