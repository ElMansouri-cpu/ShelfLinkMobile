import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getProfile, insertPhone, updatePassword, updatePhone, updateProfile, updateProfileEmail, } from "./user.service"

export const useGetProfile = () => {
  return useQuery({ queryKey: ["profile"], queryFn: getProfile })
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
