// hooks/useSafeUser.ts
import { useAuth } from './useAuth';

export const useSafeUser = () => {
  const { user, loading, isAuthenticated } = useAuth();

  // Safe user access with fallbacks
  const safeUser = {
    id: user?.id || '',
    phone: user?.phone || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || null,
    isOnboarded: user?.isOnboarded || false,
    location: user?.location || {
      address: '',
      lat: 0,
      lng: 0
    },
    role: user?.role || '',
    status: user?.status || '',
    phoneVerifiedAt: user?.phoneVerifiedAt || null,
    profileImageUrl: user?.profileImageUrl || undefined,
    createdAt: user?.createdAt || '',
    updatedAt: user?.updatedAt || ''
  };

  const isUserReady = isAuthenticated && user && !loading;
  const hasRequiredFields = user?.id && user?.phone;

  return {
    user: safeUser,
    originalUser: user,
    loading,
    isAuthenticated,
    isUserReady,
    hasRequiredFields,
    isLoggedIn: isUserReady && hasRequiredFields
  };
};
