import { useMutation } from "@tanstack/react-query";
import { organizationService, IRequestAccessRequest } from "./organization.service";

export const useRequestAccess = () => {
  return useMutation({
    mutationFn: (data: IRequestAccessRequest) => organizationService.requestAccess(data),
  });
};
