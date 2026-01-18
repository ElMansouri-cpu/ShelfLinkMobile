import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, SafeAreaView, ActivityIndicator, ScrollView, Modal, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useGetAllInvoicesInfinite } from '../../services/invoice-service/invoice.query';
import { Invoice } from '../../services/invoice-service/invoice.type';
import Header from '../../components/Header';

export default function Invoices() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<'all' | 'unpaid' | 'paid' | 'partially_paid'>('all');
  const [selectedOrganization, setSelectedOrganization] = useState<{id: string, name: string, logoUrl?: string} | null>(null);
  const [showOrganizationModal, setShowOrganizationModal] = useState(false);
  const { 
    data, 
    isLoading, 
    error, 
    refetch, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useGetAllInvoicesInfinite();

  // Get unique organizations for filter
  const organizations = useMemo(() => {
    if (!data?.pages) return [];
    
    const flattened = data.pages.flatMap(page => page.invoices || []);
    const orgMap = new Map();
    
    flattened.forEach(invoice => {
      if (invoice.organization && !orgMap.has(invoice.organization.id)) {
        orgMap.set(invoice.organization.id, {
          id: invoice.organization.id,
          name: invoice.organization.name,
          logoUrl: invoice.organization.logoUrl
        });
      }
    });
    
    return Array.from(orgMap.values());
  }, [data?.pages]);

  // Flatten all pages into a single array and filter by selected tab and organization
  const allInvoices = useMemo(() => {
    if (!data?.pages) return [];
    
    let flattened = data.pages.flatMap(page => page.invoices || []);
    
    // Filter by payment status
    if (selectedTab !== 'all') {
      flattened = flattened.filter(invoice => invoice.paymentStatus === selectedTab);
    }
    
    // Filter by organization
    if (selectedOrganization) {
      flattened = flattened.filter(invoice => invoice.organization?.id === selectedOrganization.id);
    }
    
    return flattened;
  }, [data?.pages, selectedTab, selectedOrganization]);

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      console.log('📄 Invoices - Loading more invoices...');
      fetchNextPage();
    }
  };

  const handleRefresh = () => {
    console.log('📄 Invoices - Refreshing invoices...');
    refetch();
  };

  const handleInvoicePress = (invoice: Invoice) => {
    console.log('📄 Invoices - Navigating to invoice details:', invoice.id);
    console.log('📄 Invoices - Invoice organizationId:', invoice.organizationId);
    console.log('📄 Invoices - Invoice orderId:', invoice.orderId);
    router.push({
      pathname: '/(app)/invoice',
      params: { 
        invoiceId: invoice.id,
        organizationId: invoice.organizationId,
        orderId: invoice.orderId,
        invoice: JSON.stringify(invoice)
      }
    });
  };

  // Organization selection handlers
  const handleOrganizationSelect = (organization: {id: string, name: string, logoUrl?: string}) => {
    setSelectedOrganization(organization);
    setShowOrganizationModal(false);
  };

  const handleClearOrganizationFilter = () => {
    setSelectedOrganization(null);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'unpaid':
        return { text: t('Unpaid'), color: '#dc2626', bgColor: '#fee2e2' };
      case 'paid':
        return { text: t('Paid'), color: '#16a34a', bgColor: '#dcfce7' };
      case 'partially_paid':
        return { text: t('Partially Paid'), color: '#f59e0b', bgColor: '#fef3c7' };
      default:
        return { text: 'Unknown', color: '#6b7280', bgColor: '#f3f4f6' };
    }
  };

  const renderInvoiceCard = (invoice: Invoice) => {
    const statusInfo = getStatusInfo(invoice.paymentStatus);
    const totalAmount = parseFloat(invoice.totalAmount || '0');
    const paidAmount = parseFloat(invoice.paidAmount || '0');
    const remainingAmount = parseFloat(invoice.remainingAmount || '0');

    return (
      <TouchableOpacity
        key={invoice.id}
        className="mb-3 bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100"
        style={{ padding: 16 }}
        onPress={() => handleInvoicePress(invoice)}
      >
        {/* Header Section */}
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-row items-center flex-1 mr-3">
            {/* Organization Logo */}
            <View className="w-10 h-10 bg-gray-100 rounded-lg mr-3 items-center justify-center overflow-hidden">
              {invoice.organization.logoUrl ? (
                <Image
                  source={{ uri: invoice.organization.logoUrl }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : (
                <Text className="font-bold text-gray-600 text-sm">
                  {invoice.organization.name.charAt(0)}
                </Text>
              )}
            </View>
            
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                {invoice.organization.name}
              </Text>
              <Text className="text-xs text-gray-500">
                #{invoice.invoiceNumber}
              </Text>
              {invoice.order?.orderReferenceNumber && (
                <Text className="text-xs text-gray-400">
                  Order: {invoice.order.orderReferenceNumber}
                </Text>
              )}
            </View>
          </View>

          {/* Status Badge */}
          <View style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            backgroundColor: statusInfo.bgColor,
            minWidth: 70,
            alignItems: 'center'
          }}>
            <Text style={{
              fontSize: 10,
              fontWeight: '500',
              color: statusInfo.color,
              textAlign: 'center'
            }}>
              {statusInfo.text}
            </Text>
          </View>
        </View>

        {/* Payment Progress */}
        {invoice.paymentStatus === 'partially_paid' && (
          <View className="mb-3">
            <View className="flex-row justify-between mb-1">
              <Text className="text-xs text-gray-600">{t("Payment Progress")}</Text>
              <Text className="text-xs text-gray-600">
                {paidAmount.toFixed(2)} / {totalAmount.toFixed(2)} TND
              </Text>
            </View>
            <View className="w-full bg-gray-200 rounded-full h-2">
              <View 
                className="bg-[#48C6A8] h-2 rounded-full"
                style={{ width: `${(paidAmount / totalAmount) * 100}%` }}
              />
            </View>
          </View>
        )}

        {/* Invoice Details */}
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-xs text-gray-500 mb-1">{t("Total Amount")}</Text>
            <Text className="text-lg font-bold text-gray-900">
              {totalAmount.toFixed(2)} TND
            </Text>
            <Text className="text-xs text-gray-500">
{t("Invoice Date")}: {formatDate(invoice.invoiceDate)}
            </Text>
            {invoice.paymentDate && (
              <Text className="text-xs text-gray-400">
{t("Paid")}: {formatDate(invoice.paymentDate)}
              </Text>
            )}
            {remainingAmount > 0 && (
              <Text className="text-xs text-red-500 font-medium">
{t("Remaining")}: {remainingAmount.toFixed(2)} TND
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Header title="Invoices" showBackButton={false} />

      {/* Organization Filter */}
      <View style={styles.organizationFilterContainer}>
        <View style={styles.organizationFilterRow}>
          <TouchableOpacity 
            style={styles.organizationFilterButton}
            onPress={() => setShowOrganizationModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.organizationFilterButtonContent}>
              <View style={styles.organizationFilterButtonLeft}>
                {selectedOrganization?.logoUrl ? (
                  <Image
                    source={{ uri: selectedOrganization.logoUrl }}
                    style={styles.organizationFilterLogo}
                  />
                ) : (
                  <View style={styles.organizationFilterLogoPlaceholder}>
                    <Feather name="shopping-bag" size={14} color="#6b7280" />
                  </View>
                )}
                <View style={styles.organizationFilterTextContainer}>
                  <Text style={styles.organizationFilterText}>
                    {selectedOrganization ? selectedOrganization.name : t("All Organizations")}
                  </Text>
                </View>
              </View>
              <Feather name="chevron-down" size={16} color="#6b7280" />
            </View>
          </TouchableOpacity>
          
          {selectedOrganization && (
            <TouchableOpacity 
              style={styles.clearFilterButton}
              onPress={handleClearOrganizationFilter}
              activeOpacity={0.7}
            >
              <Feather name="x" size={16} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Status Tabs */}
      <View className="flex-row px-4 py-3 bg-white">
        {[
          { key: 'all', label: t('All') },
          { key: 'unpaid', label: t('Unpaid') },
          { key: 'paid', label: t('Paid') },
          { key: 'partially_paid', label: t('Partially Paid') }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            className={`flex-1 py-2 px-2 rounded-lg mr-1 ${
              selectedTab === tab.key ? 'bg-[#48C6A8]' : 'bg-gray-100'
            }`}
            onPress={() => setSelectedTab(tab.key as any)}
          >
            <Text className={`text-center font-medium text-xs ${
              selectedTab === tab.key ? 'text-white' : 'text-gray-600'
            }`}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {isLoading && !data ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#48C6A8" />
          <Text className="text-gray-500 mt-4">{t("Loading invoices...")}</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-4">
          <Image source={require('../../assets/errors.png')} style={{ width: 200, height: 200 }} />
          <Text className="text-gray-400 mt-4 text-center text-lg font-bold">
            Failed to load invoices
          </Text>
          <TouchableOpacity
            onPress={handleRefresh}
            className="bg-[#1A2A4F] px-6 py-3 mt-4 rounded-full"
          >
            <Text className="text-white font-medium">{t("Retry")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={allInvoices}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderInvoiceCard(item)}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          onRefresh={handleRefresh}
          refreshing={isLoading}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Image source={require('../../assets/shopping-bag.png')} style={{ width: 200, height: 200 }} />
              <Text className="text-gray-400 mt-4 text-center text-lg font-bold">
                No invoices found
              </Text>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="items-center py-4">
                <ActivityIndicator size="small" color="#48C6A8" />
                <Text className="text-gray-500 mt-2">{t("Loading more...")}</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Organization Selection Modal */}
      <Modal
        visible={showOrganizationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOrganizationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowOrganizationModal(false)}
          />
          <View style={styles.organizationModalContent}>
            {/* Modal Handle */}
            <View style={styles.modalHandle} />
            
            <View style={styles.organizationModalHeader}>
              <View style={styles.organizationModalTitleContainer}>
                <Feather name="shopping-bag" size={24} color="#48C6A8" />
                <Text style={styles.organizationModalTitle}>{t("Select Organization")}</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setShowOrganizationModal(false)}
                style={styles.closeButton}
              >
                <Feather name="x" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={organizations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.organizationItem,
                    selectedOrganization?.id === item.id && styles.selectedOrganizationItem
                  ]}
                  onPress={() => handleOrganizationSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.organizationItemContent}>
                    <View style={styles.organizationItemLeft}>
                      <View style={styles.organizationLogoContainer}>
                        {item.logoUrl ? (
                          <Image
                            source={{ uri: item.logoUrl }}
                            style={styles.organizationLogo}
                          />
                        ) : (
                          <View style={styles.organizationLogoPlaceholder}>
                            <Feather name="shopping-bag" size={16} color="#6b7280" />
                          </View>
                        )}
                      </View>
                      <View style={styles.organizationItemTextContainer}>
                        <Text style={styles.organizationItemName}>{item.name}</Text>
                      </View>
                    </View>
                    {selectedOrganization?.id === item.id && (
                      <Feather name="check" size={20} color="#48C6A8" />
                    )}
                  </View>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.organizationListContent}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  organizationFilterContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  organizationFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  organizationFilterButton: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  organizationFilterButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  organizationFilterButtonLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  organizationFilterLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  organizationFilterLogoPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  organizationFilterTextContainer: {
    flex: 1,
  },
  organizationFilterText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111",
  },
  clearFilterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
  },
  organizationModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "50%",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#d1d5db",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  organizationModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  organizationModalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  organizationModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
    marginLeft: 8,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  organizationListContent: {
    paddingBottom: 20,
  },
  organizationItem: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  selectedOrganizationItem: {
    backgroundColor: "#f0fdf4",
  },
  organizationItemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  organizationItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  organizationLogoContainer: {
    marginRight: 12,
  },
  organizationLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  organizationLogoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  organizationItemTextContainer: {
    flex: 1,
  },
  organizationItemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111",
  },
});
