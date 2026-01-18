import { api } from "../../lib/api";

export interface IRequestAccessRequest {
  organizationId: string;
  requestMessage: string;
}

export interface IRequestAccessResponse {
  success: boolean;
  message: string;
  requestId?: string;
}

export const organizationService = {
  requestAccess: async (data: IRequestAccessRequest): Promise<IRequestAccessResponse> => {
    const { data: response } = await api.post('/auth/client/request-access', data);
    return response;
  }
};
