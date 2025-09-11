import { useMemo } from 'react';
import { useGetStoreRetailers } from '../services/store-service/store.query';
import { IClientRelationship } from '../services/store-service/store.types';

interface UseStoreRetailersInfiniteProps {
  organizationId: string;
  searchQuery?: string;
  limit?: number;
}

export const useStoreRetailersInfinite = ({
  organizationId,
  searchQuery = '',
  limit = 10
}: UseStoreRetailersInfiniteProps) => {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useGetStoreRetailers(organizationId, {
    q: searchQuery,
    limit,
  });

  // Flatten all pages into a single array of retailers
  const retailers = useMemo(() => {
    if (!data?.pages) return [];
    
    return data.pages.reduce<IClientRelationship[]>((acc, page) => {
      return [...acc, ...(page?.items || [])];
    }, []);
  }, [data?.pages]);

  // Get pagination info from the last page
  const pagination = useMemo(() => {
    if (!data?.pages?.length) return null;
    
    const lastPage = data.pages[data.pages.length - 1];
    if (!lastPage) return null;
    
    // Transform the API response to match our expected pagination structure
    return {
      page: lastPage.page,
      limit: lastPage.size,
      total: lastPage.total,
      totalPages: lastPage.totalPages,
      hasNext: lastPage.page < lastPage.totalPages,
      hasPrev: lastPage.page > 1
    };
  }, [data?.pages]);

  // Calculate total items loaded
  const totalLoaded = retailers.length;

  // Check if we have more data to load
  const canLoadMore = hasNextPage && !isFetchingNextPage;

  return {
    // Data
    retailers,
    pagination,
    totalLoaded,
    
    // Loading states
    isLoading,
    isFetching,
    isFetchingNextPage,
    isError,
    error,
    
    // Actions
    loadMore: fetchNextPage,
    canLoadMore,
    refetch,
    
    // Computed states
    isEmpty: !isLoading && retailers.length === 0,
    hasData: retailers.length > 0,
  };
};
