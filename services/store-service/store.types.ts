export interface Store {
    id: string;
    name: string;
    address: string;
    phone: string;
    email: string;
}
export interface ILocation {
    lat: number;
    lng: number;
    address: string;
}
export interface IOrganization {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    address: string | null;
    location: ILocation;
    productsCount: number;
    ordersCount: number;
    logoUrl: string;
    bannerUrl: string;
    status: string;
    ownerId: string;
    qrCode: string;
    createdAt: string;
    updatedAt: string;
}

export interface IClientRelationship {
    id: string;
    phone: string;
    firstName: string;
    lastName: string;
    email: string | null;
    isOnboarded: boolean;
    location: {
        lat: number;
        lng: number;
        address: string;
    } | null;
    role: string;
    status: string;
    phoneVerifiedAt: string | null;
    profileImageUrl: string;
    createdAt: string;
    updatedAt: string;
}

export interface StoreRetailersParams {
    q?: string;
    page?: number;
    limit?: number;
}

export interface StoreRetailersResponse {
    items: IClientRelationship[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
}

