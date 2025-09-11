import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useStoreRetailersInfinite } from '../hooks/useStoreRetailersInfinite';
import { IClientRelationship } from '../services/store-service/store.types';

interface StoreRetailersListProps {
  organizationId: string;
  onRetailerSelect?: (retailer: IClientRelationship) => void;
}

export const StoreRetailersList: React.FC<StoreRetailersListProps> = ({
  organizationId,
  onRetailerSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const {
    retailers,
    isLoading,
    isFetchingNextPage,
    isError,
    error,
    loadMore,
    canLoadMore,
    refetch,
    isEmpty,
    hasData,
  } = useStoreRetailersInfinite({
    organizationId,
    searchQuery,
    limit: 20,
  });

  const handleLoadMore = () => {
    if (canLoadMore) {
      loadMore();
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  const renderRetailerItem = ({ item }: { item: IClientRelationship }) => (
    <TouchableOpacity
      style={styles.retailerItem}
      onPress={() => onRetailerSelect?.(item)}
      activeOpacity={0.7}
    >
      <View style={styles.retailerInfo}>
        <Text style={styles.retailerName}>{item.organization.name}</Text>
        <Text style={styles.retailerAddress}>{item.organization.address}</Text>
        <Text style={styles.retailerPhone}>{item.organization.phone}</Text>
        <View style={styles.statusContainer}>
          <Text style={[
            styles.statusText,
            { color: item.status === 'approved' ? '#10B981' : '#F59E0B' }
          ]}>
            {item.status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {searchQuery ? 'No retailers found matching your search' : 'No retailers available'}
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>
        Error: {error?.message || 'Failed to load retailers'}
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  if (isError) {
    return renderError();
  }

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search retailers..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Retailers List */}
      <FlatList
        data={retailers}
        keyExtractor={(item) => item.id}
        renderItem={renderRetailerItem}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
        contentContainerStyle={[
          styles.listContainer,
          isEmpty && styles.emptyListContainer
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  retailerItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  retailerInfo: {
    flex: 1,
  },
  retailerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  retailerAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  retailerPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  statusContainer: {
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});
