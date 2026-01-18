import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, SafeAreaView, ActivityIndicator, Modal, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useGetPaymentsInfinite } from '../../services/payment-service/payment.query';
import { useValidatePayment } from '../../services/invoice-service/invoice.query';
import { Payment } from '../../services/invoice-service/invoice.type';
import Header from '../../components/Header';

export default function Payments() {
  const { t } = useTranslation();
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
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
  } = useGetPaymentsInfinite({ page: 1, size: 50 });

  // Payment validation mutation
  const { mutate: validatePayment, isPending: isValidationLoading } = useValidatePayment();

  // Modal state
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [paymentToValidate, setPaymentToValidate] = useState<{id: string, invoiceId: string, organizationId: string, validationStatus: 'pending' | 'approved' | 'rejected'} | null>(null);

  // Get unique organizations for filter
  const organizations = useMemo(() => {
    if (!data?.pages) return [];
    
    const flattened = data.pages.flatMap(page => page.payments || []);
    const orgMap = new Map();
    
    flattened.forEach(payment => {
      if (payment.organization && !orgMap.has(payment.organization.id)) {
        orgMap.set(payment.organization.id, {
          id: payment.organization.id,
          name: payment.organization.name,
          logoUrl: payment.organization.logoUrl
        });
      }
    });
    
    return Array.from(orgMap.values());
  }, [data?.pages]);

  // Flatten all pages into a single array and filter by status and organization
  const allPayments = useMemo(() => {
    if (!data?.pages) return [];
    
    let flattened = data.pages.flatMap(page => page.payments || []);
    
    // Filter by validation status
    if (selectedStatus !== 'all') {
      flattened = flattened.filter(payment => payment.validationStatus === selectedStatus);
    }
    
    // Filter by organization
    if (selectedOrganization) {
      flattened = flattened.filter(payment => payment.organization?.id === selectedOrganization.id);
    }
    
    return flattened;
  }, [data?.pages, selectedStatus, selectedOrganization]);

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      console.log('💳 Payments - Loading more payments...');
      fetchNextPage();
    }
  };

  const handleRefresh = () => {
    console.log('💳 Payments - Refreshing payments...');
    refetch();
  };

  const getValidationStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'validated':
      case 'approved':
        return { text: t('Approved'), color: '#16a34a', bgColor: '#dcfce7' };
      case 'pending':
        return { text: t('Pending'), color: '#f59e0b', bgColor: '#fef3c7' };
      case 'rejected':
        return { text: t('Rejected'), color: '#dc2626', bgColor: '#fee2e2' };
      default:
        return { text: status, color: '#6b7280', bgColor: '#f3f4f6' };
    }
  };

  const handleValidatePayment = (payment: Payment, validationStatus: 'approved' | 'rejected') => {
    if (!payment.id) return;
    setPaymentToValidate({ 
      id: payment.id, 
      invoiceId: payment.invoiceId,
      organizationId: payment.organization.id,
      validationStatus 
    });
    setShowValidationModal(true);
  };

  const confirmValidation = () => {
    if (paymentToValidate) {
      validatePayment({
        organizationId: paymentToValidate.organizationId,
        invoiceId: paymentToValidate.invoiceId,
        paymentId: paymentToValidate.id,
        validationStatus: paymentToValidate.validationStatus
      }, {
        onSuccess: () => {
          setShowValidationModal(false);
          setPaymentToValidate(null);
          // Refresh the payments list
          refetch();
        },
        onError: (error) => {
          console.error('Payment validation error:', error);
          setShowValidationModal(false);
          setPaymentToValidate(null);
        }
      });
    }
  };

  const cancelValidation = () => {
    setShowValidationModal(false);
    setPaymentToValidate(null);
  };

  // Organization selection handlers
  const handleOrganizationSelect = (organization: {id: string, name: string, logoUrl?: string}) => {
    setSelectedOrganization(organization);
    setShowOrganizationModal(false);
  };

  const handleClearOrganizationFilter = () => {
    setSelectedOrganization(null);
  };

  const renderPaymentCard = (payment: Payment) => {
    const validationInfo = getValidationStatusInfo(payment.validationStatus);

    return (
      <TouchableOpacity
        key={payment.id}
        className="mb-3 bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100"
        style={{ padding: 16 }}
      >
        {/* Header Section */}
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-row items-center flex-1 mr-3">
            {/* Organization Logo */}
            <View className="w-10 h-10 bg-gray-100 rounded-lg mr-3 items-center justify-center overflow-hidden">
              {payment.organization.logoUrl ? (
                <Image
                  source={{ uri: payment.organization.logoUrl }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : (
                <Text className="font-bold text-gray-600 text-sm">
                  {payment.organization.name.charAt(0)}
                </Text>
              )}
            </View>
            
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                {payment.organization.name}
              </Text>
              <Text className="text-xs text-gray-500">
                Invoice #{payment.invoiceNumber}
              </Text>
              <Text className="text-xs text-gray-400">
{t("Payment ID")}: {payment.id.split('_')[1]}
              </Text>
            </View>
          </View>

          {/* Validation Status Badge */}
          <View style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            backgroundColor: validationInfo.bgColor,
            minWidth: 70,
            alignItems: 'center'
          }}>
            <Text style={{
              fontSize: 10,
              fontWeight: '500',
              color: validationInfo.color,
              textAlign: 'center'
            }}>
              {validationInfo.text}
            </Text>
          </View>
        </View>

        {/* Payment Details */}
        <View className="space-y-2">
          {/* Amount */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Feather name="dollar-sign" size={14} color="#48C6A8" />
              <Text className="text-xs text-gray-600 ml-2">
                {t("Payment Amount")}
              </Text>
            </View>
            <Text className="text-lg font-bold text-gray-900">
              {(payment.amount || 0).toFixed(2)} TND
            </Text>
          </View>

          {/* Payment Date */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Feather name="calendar" size={14} color="#48C6A8" />
              <Text className="text-xs text-gray-600 ml-2">
                {t("Payment Date")}
              </Text>
            </View>
            <Text className="text-xs font-medium text-gray-900">
              {formatDate(payment.paymentDate)}
            </Text>
          </View>

          {/* Validation Information */}
          {payment.validatedAt && (
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Feather name="check-circle" size={14} color="#48C6A8" />
                <Text className="text-xs text-gray-600 ml-2">
                  {t("Validated At")}
                </Text>
              </View>
              <Text className="text-xs font-medium text-gray-900">
                {formatDate(payment.validatedAt)}
              </Text>
            </View>
          )}

          {/* Payment Actions for Pending Payments */}
          {payment.validationStatus === 'pending' && (
            <View className="flex-row justify-between mt-4 px-2">
              <TouchableOpacity
                className="flex-1 mr-2 py-3 rounded-lg bg-gray-100 border border-gray-300"
                onPress={() => handleValidatePayment(payment, 'rejected')}
              >
                <View className="flex-row items-center justify-center">
                  <Feather name="x" size={16} color="#374151" />
                  <Text className="text-sm font-medium text-gray-700 ml-2">
                    Reject
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="flex-1 ml-2 py-3 rounded-lg bg-[#48C6A8]"
                onPress={() => handleValidatePayment(payment, 'approved')}
              >
                <View className="flex-row items-center justify-center">
                  <Feather name="check" size={16} color="white" />
                  <Text className="text-sm font-medium text-white ml-2">
                    Accept
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Header title="Payment History" showBackButton={false} />

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
          { key: 'pending', label: t('Pending') },
          { key: 'approved', label: t('Approved') },
          { key: 'rejected', label: t('Rejected') }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            className={`flex-1 py-2 px-2 rounded-lg mr-1 ${
              selectedStatus === tab.key ? 'bg-[#48C6A8]' : 'bg-gray-100'
            }`}
            onPress={() => setSelectedStatus(tab.key as any)}
          >
            <Text className={`text-center font-medium text-xs ${
              selectedStatus === tab.key ? 'text-white' : 'text-gray-600'
            }`}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Cards */}
      <View className="px-4 py-4">
        <View className="flex-row justify-between">
          {/* Total Payments */}
          <View className="bg-white rounded-lg p-4 flex-1 mr-2">
            <View className="flex-row items-center mb-2">
              <Feather name="credit-card" size={16} color="#48C6A8" />
              <Text className="text-xs text-gray-600 ml-2 font-medium">
                Total Payments
              </Text>
            </View>
            <Text className="text-lg font-bold text-gray-900">
              {allPayments.length}
            </Text>
          </View>

          {/* Total Amount */}
          <View className="bg-white rounded-lg p-4 flex-1 ml-2">
            <View className="flex-row items-center mb-2">
              <Feather name="dollar-sign" size={16} color="#48C6A8" />
              <Text className="text-xs text-gray-600 ml-2 font-medium">
                Total Amount
              </Text>
            </View>
            <Text className="text-lg font-bold text-gray-900">
              {allPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0).toFixed(2)} TND
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      {isLoading && !data ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#48C6A8" />
          <Text className="text-gray-500 mt-4">{t("Loading payments...")}</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-4">
          <Image source={require('../../assets/errors.png')} style={{ width: 200, height: 200 }} />
          <Text className="text-gray-400 mt-4 text-center text-lg font-bold">
            Failed to load payments
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
          data={allPayments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderPaymentCard(item)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          onRefresh={handleRefresh}
          refreshing={isLoading}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Image source={require('../../assets/shopping-bag.png')} style={{ width: 200, height: 200 }} />
              <Text className="text-gray-400 mt-4 text-center text-lg font-bold">
                No payments found
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

      {/* Payment Validation Confirmation Modal */}
      <Modal
        visible={showValidationModal}
        transparent
        animationType="fade"
        onRequestClose={cancelValidation}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Feather 
                name={paymentToValidate?.validationStatus === 'approved' ? "check-circle" : "x-circle"} 
                size={24} 
                color={paymentToValidate?.validationStatus === 'approved' ? "#48C6A8" : "#dc2626"} 
              />
              <Text style={styles.modalTitle}>
                {paymentToValidate?.validationStatus === 'approved' ? t("Approve Payment") : t("Reject Payment")}
              </Text>
            </View>
            
            <Text style={styles.modalMessage}>
              {paymentToValidate?.validationStatus === 'approved'
                ? t("Are you sure you want to approve this payment? This action cannot be undone.")
                : t("Are you sure you want to reject this payment? This action cannot be undone.")
              }
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelModalButton]} 
                onPress={cancelValidation}
              >
                <Text style={styles.cancelModalButtonText}>{t("Cancel")}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.modalButton, 
                  paymentToValidate?.validationStatus === 'approved' ? styles.confirmModalButton : styles.rejectModalButton
                ]} 
                onPress={confirmValidation}
                disabled={isValidationLoading}
              >
                {isValidationLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[
                    paymentToValidate?.validationStatus === 'approved' ? styles.confirmModalButtonText : styles.rejectModalButtonText
                  ]}>
                    {paymentToValidate?.validationStatus === 'approved' ? t("Approve") : t("Reject")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    marginLeft: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelModalButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmModalButton: {
    backgroundColor: '#48C6A8',
  },
  confirmModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rejectModalButton: {
    backgroundColor: '#dc2626',
  },
  rejectModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
