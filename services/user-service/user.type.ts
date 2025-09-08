
export interface IUser   {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'suspended';
  profileImageUrl?: string;
  phone?: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
  }
}


export enum UserRole {
    WHOLESALER_OWNER = 'wholesaler_owner',
    TEAM_MEMBER = 'team_member',
    RETAILER = 'retailer'
  }
  

  export enum RequestStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    CANCELLED = 'cancelled',
  }