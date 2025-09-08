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
    organization: IOrganization;
    retailerId: string;
    approvedBy: string;

    organizationId: string;

    approvedAt: string;
    status: string;
    createdAt: string;
    createdBy: string;
}

