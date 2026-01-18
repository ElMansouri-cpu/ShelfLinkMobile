import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getProfile, insertPhone, OTPAuthentication, OTPVerification, SignupAuthentication, SignupVerification, updatePassword, updatePhone, updateProfile, updateProfileEmail, updateUserProfile } from "./user.service"

export const useGetProfile = () => {
  return useQuery({ 
    queryKey: ["profile"], 
    queryFn: getProfile,
    enabled: true, // Enable the query
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2, // Retry twice on failure
    retryDelay: 1000 // 1 second delay between retries
  })
}

export const useUpdateProfile = () => {
    
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: updateProfile ,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] })
    }
  })
}

export const useUpdateProfileEmail = () => {
  const queryClient = useQueryClient()

  return useMutation({ mutationFn: updateProfileEmail ,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] })
    }
  })
}

export const useUpdatePassword = () => {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: updatePassword ,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] })
    }
  })
}

export const useUpdatePhone = () => {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: updatePhone ,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] })
    }
  })
}

export const useInsertPhone = () => {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: insertPhone ,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] })
    }
  })
}

export const useOTPAuthentication = () => {
  return useMutation({ mutationFn: OTPAuthentication })
}

export const useOTPVerification = () => {
  return useMutation({ 
    mutationFn: ({ phone, code }: { phone: string; code: string }) => OTPVerification(phone, code) 
  })
}

export const useSignupAuthentication = () => {
  return useMutation({ mutationFn: SignupAuthentication })
}

export const useSignupVerification = () => {
  return useMutation({ 
    mutationFn: ({ phone, code }: { phone: string; code: string }) => SignupVerification(phone, code) 
  })
}

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient()
  return useMutation({ 
    mutationFn: updateUserProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] })
    }
  })
}