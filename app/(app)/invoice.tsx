import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import Header from '../../components/Header';
import { safePush } from '../../utils/navigation';
import { useGetInvoiceByOrderId, useGeneratePdf } from '../../services/invoice-service/invoice.query';
import { PaymentStatus, PaymentMethod } from '../../services/invoice-service/invoice.type';
import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { useNotification } from '../../context/NotificationContext';

interface TabProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

const Tab = ({ label, isActive, onPress }: TabProps) => (
  <TouchableOpacity
    style={[styles.tab, isActive && styles.activeTab]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.tabText, isActive && styles.activeTabText]}>{label}</Text>
  </TouchableOpacity>
);

export default function InvoiceScreen() {
  const { orderId, organizationId } = useLocalSearchParams();
  const { t } = useTranslation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'details' | 'payments'>('details');
  const [isDownloading, setIsDownloading] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  
  const { data: invoiceData, isLoading, error, refetch } = useGetInvoiceByOrderId(
    organizationId as string,
    orderId as string
  );

  const { data: pdfData, isLoading: isPdfLoading, refetch: generatePdf } = useGeneratePdf(
    organizationId as string,
    invoiceData?.id || ''
  );

  // Get notification context for auto-updates
  const { lastPayload } = useNotification();

  // Auto-update invoice data when notifications are received
  useEffect(() => {
    if (lastPayload) {
      const payloadData = lastPayload.new as any;
      const isInvoiceUpdate = lastPayload.table === 'invoices';
      const isOrderUpdate = lastPayload.table === 'orders';
      
      console.log('InvoiceScreen - Notification received, refetching invoice data:', {
        orderId: orderId,
        organizationId: organizationId,
        lastPayload: payloadData?.id,
        invoiceId: invoiceData?.id,
        table: lastPayload.table,
        isInvoiceUpdate,
        isOrderUpdate,
        payloadOrderId: payloadData?.orderId,
        payloadInvoiceId: payloadData?.id
      });
      
      // Refetch if it's an invoice update for this order, or an order update for this order
      const shouldRefetch = (isInvoiceUpdate && payloadData?.orderId === orderId) || 
                           (isOrderUpdate && payloadData?.id === orderId);
      
      if (shouldRefetch) {
        console.log('InvoiceScreen - Refetching invoice data due to relevant update');
        refetch();
      } else {
        console.log('InvoiceScreen - Update not relevant to this invoice, skipping refetch');
      }
    }
  }, [lastPayload, refetch, orderId, organizationId, invoiceData?.id]);

  // Debug logging for invoice data updates
  useEffect(() => {
    console.log('InvoiceScreen - invoiceData updated:', {
      orderId: orderId,
      organizationId: organizationId,
      invoiceId: invoiceData?.id,
      invoiceNumber: invoiceData?.invoiceNumber,
      status: invoiceData?.status,
      paymentStatus: invoiceData?.paymentStatus,
      isLoading,
      error: error?.message,
      lastPayload: lastPayload?.new?.id
    });
  }, [invoiceData, isLoading, error, orderId, organizationId, lastPayload]);

  // Request storage permissions using MediaLibrary
  const requestStoragePermissions = async (): Promise<boolean> => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      console.log('Storage permission status:', status);
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting storage permissions:', error);
      return false;
    }
  };


  // Share PDF using Expo's sharing capabilities
  const sharePdf = async (fileUri: string): Promise<void> => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: t('Share Invoice PDF'),
        });
        Alert.alert(
          t('Success'),
          t('PDF shared successfully!'),
          [{ text: t('OK'), style: 'default' }]
        );
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing PDF:', error);
      Alert.alert(
        t('Error'),
        t('Failed to share PDF. Please try again.'),
        [{ text: t('OK'), style: 'default' }]
      );
    }
  };

  // Convert Blob to Base64 string
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        console.log('Converting blob to base64:', {
          size: blob.size,
          type: blob.type
        });
        
        const reader = new FileReader();
        
        reader.onloadend = () => {
          try {
            const result = reader.result as string;
            if (!result) {
              throw new Error('FileReader returned null result');
            }
            
            console.log('Base64 conversion completed, result length:', result.length);
            
            // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
            const base64Data = result.split(',')[1];
            
            if (!base64Data) {
              throw new Error('Failed to extract base64 data from result');
            }
            
            console.log('Base64 data extracted successfully, length:', base64Data.length);
            resolve(base64Data);
          } catch (error) {
            console.error('Error processing base64 result:', error);
            reject(error);
          }
        };
        
        reader.onerror = (error) => {
          console.error('FileReader error during blob conversion:', error);
          reject(new Error(`FileReader error: ${error}`));
        };
        
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error('Error setting up blob conversion:', error);
        reject(error);
      }
    });
  };


  // Save and share PDF using blob approach
  const handleSaveAndSharePdf = async () => {
    if (!invoiceData?.id) return;
    
    try {
      setIsDownloading(true);
      
      // Call API to generate PDF
      const response = await generatePdf();
      
      if (!response?.data) {
        throw new Error('No PDF data received from API');
      }

      // Check if the response indicates an error
      if (response.error) {
        throw new Error(`PDF generation failed: ${response.error.message || 'Unknown error'}`);
      }

      console.log('PDF blob received, size:', response.data.size, 'bytes');

      // Request permissions
      const hasPermission = await requestStoragePermissions();
      if (!hasPermission) {
        Alert.alert(
          t('Permission Denied'),
          t('Cannot save PDF without storage permission.'),
          [{ text: t('OK'), style: 'default' }]
        );
        return;
      }

      // Convert Blob to Base64
      const base64Pdf = await blobToBase64(response.data);
      
      // Create filename with timestamp
      const timestamp = new Date().getTime();
      const fileName = `invoice_${invoiceData.invoiceNumber}_${timestamp}`;
      const fileUri = FileSystem.documentDirectory + fileName + '.pdf';
      
      // Write the Base64 PDF data to the file
      await FileSystem.writeAsStringAsync(fileUri, base64Pdf, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      console.log('PDF saved successfully to:', fileUri);
      
      // Share the saved PDF
      await sharePdf(fileUri);
    } catch (error) {
      console.error('Error saving and sharing PDF:', error);
      
      // Provide more specific error messages
      let errorMessage = t('Failed to save the invoice PDF. Please try again.');
      
      if (error instanceof Error) {
        if (error.message.includes('500')) {
          errorMessage = t('Server error while generating PDF. Please try again later.');
        } else if (error.message.includes('404')) {
          errorMessage = t('Invoice not found. Please refresh and try again.');
        } else if (error.message.includes('No PDF data')) {
          errorMessage = t('PDF generation failed. Please try again.');
        }
      }
      
      Alert.alert(
        t('PDF Error'),
        errorMessage,
        [
          {
            text: t('Retry'),
            onPress: () => handleSaveAndSharePdf(),
            style: 'default',
          },
          {
            text: t('Cancel'),
            style: 'cancel',
          },
        ]
      );
    } finally {
      setIsDownloading(false);
    }
  };

  // View PDF using the same approach as save and share
  const handleViewPdf = async () => {
    // Use the same function as save and share
    await handleSaveAndSharePdf();
  };

  // Share PDF function - uses the new approach
  const handleSharePdf = async () => {
    await handleSaveAndSharePdf();
  };

  // Save PDF function - uses the new approach
  const handleSavePdf = async () => {
    await handleSaveAndSharePdf();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title={t("Invoice")} opacity={1} onBack={() => router.back()} scrollY={scrollY} />
        <View style={[styles.loadingContainer, { marginTop: 56 }]}>
          <Text style={styles.loadingText}>{t("Loading invoice...")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !invoiceData) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title={t("Invoice")} opacity={1} onBack={() => router.back()} scrollY={scrollY} />
        <View style={[styles.errorContainer, { marginTop: 56 }]}>
          <Feather name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>{t("Invoice not found")}</Text>
          <Text style={styles.errorText}>{t("Unable to load invoice details")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getInvoiceStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return t("Completed");
      case 'uncompleted':
        return t("Uncompleted");
      case 'cancelled':
        return t("Cancelled");
      default:
        return t("Unknown");
    }
  };

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#059669';
      case 'uncompleted':
        return '#f59e0b';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const renderInvoiceDetailsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Invoice Header */}
      <View style={styles.invoiceHeader}>
        <View style={styles.invoiceHeaderLeft}>
          <Text style={styles.invoiceTitle}>{t("Invoice Details")}</Text>
          <Text style={styles.invoiceNumber}>{invoiceData.invoiceNumber}</Text>
          <View style={styles.invoiceStatusContainer}>
            <View style={[styles.invoiceStatusBadge, { backgroundColor: getInvoiceStatusColor(invoiceData.status) + '20' }]}>
              <Text style={[styles.invoiceStatusText, { color: getInvoiceStatusColor(invoiceData.status) }]}>
                {getInvoiceStatusText(invoiceData.status)}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.invoiceHeaderRight}>
          <Text style={styles.invoiceDate}>
            {new Date(invoiceData.invoiceDate).toLocaleDateString()}
          </Text>
          <Text style={styles.invoiceCreatedAt}>
            {t("Created")}: {new Date(invoiceData.createdAt).toLocaleDateString()}
          </Text>
          
          {/* PDF Action Buttons */}
          <View style={styles.pdfButtonsContainer}>
            <TouchableOpacity 
              style={[styles.pdfButton, styles.viewButton, isDownloading && styles.pdfButtonDisabled]} 
              onPress={handleViewPdf}
              disabled={isDownloading}
              activeOpacity={0.7}
            >
              <Feather 
                name={isDownloading ? "loader" : "eye"} 
                size={14} 
                color={isDownloading ? "#9ca3af" : "#059669"} 
              />
              <Text style={[styles.pdfButtonText, isDownloading && styles.pdfButtonTextDisabled]}>
                {isDownloading ? t("Loading...") : t("View")}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.pdfButton, styles.downloadButton, isDownloading && styles.pdfButtonDisabled]} 
              onPress={handleSaveAndSharePdf}
              disabled={isDownloading}
              activeOpacity={0.7}
            >
              <Feather 
                name={isDownloading ? "loader" : "share"} 
                size={14} 
                color={isDownloading ? "#9ca3af" : "#059669"} 
              />
              <Text style={[styles.pdfButtonText, isDownloading && styles.pdfButtonTextDisabled]}>
                {isDownloading ? t("Saving...") : t("Share")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Invoice Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("Invoice Information")}</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("Invoice Number")}</Text>
            <Text style={styles.infoValue}>{invoiceData.invoiceNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("Invoice Date")}</Text>
            <Text style={styles.infoValue}>
              {new Date(invoiceData.invoiceDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("Invoice Type")}</Text>
            <Text style={styles.infoValue}>{t(invoiceData.type)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("Order Reference")}</Text>
            <Text style={styles.infoValue}>{invoiceData.order?.orderReferenceNumber || "N/A"}</Text>
          </View>
          {invoiceData.note && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t("Notes")}</Text>
              <Text style={styles.infoValue}>{invoiceData.note}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Financial Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("Financial Summary")}</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("Subtotal")}</Text>
            <Text style={styles.infoValue}>${invoiceData.subtotalAmount}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("Tax Amount")}</Text>
            <Text style={styles.infoValue}>${invoiceData.taxAmount}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("Discount")}</Text>
            <Text style={styles.infoValue}>-${invoiceData.discountAmount}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("Shipping")}</Text>
            <Text style={styles.infoValue}>${invoiceData.shippingAmount}</Text>
          </View>
          <View style={[styles.infoRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>{t("Total Amount")}</Text>
            <Text style={styles.totalValue}>${invoiceData.totalAmount}</Text>
          </View>
        </View>
      </View>

      {/* Payment Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("Payment Status")}</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("Payment Status")}</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, { backgroundColor: getPaymentStatusColor(invoiceData.paymentStatus) + '20' }]}>
                <Text style={[styles.statusText, { color: getPaymentStatusColor(invoiceData.paymentStatus) }]}>
                  {getPaymentStatusText(invoiceData.paymentStatus)}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("Amount Paid")}</Text>
            <Text style={styles.infoValue}>${invoiceData.paidAmount}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("Remaining Amount")}</Text>
            <Text style={styles.infoValue}>${invoiceData.remainingAmount}</Text>
          </View>
          {invoiceData.paymentDate && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t("Payment Date")}</Text>
              <Text style={styles.infoValue}>
                {new Date(invoiceData.paymentDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Order Items */}
      {invoiceData.order?.items && invoiceData.order.items.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("Order Items")}</Text>
          {invoiceData.order.items.map((item, index) => (
            <View key={item.id} style={styles.itemContainer}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.variant?.name || t("Unknown Item")}</Text>
                <Text style={styles.itemStatus}>{t(item.status)}</Text>
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemDetail}>{t("Quantity")}: {item.quantity}</Text>
                <Text style={styles.itemDetail}>{t("Unit Price")}: ${item.unitPrice}</Text>
                <Text style={styles.itemDetail}>{t("Total")}: ${item.totalAmount}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Customer Information */}
      {invoiceData.retailer && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("Customer Information")}</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t("Name")}</Text>
              <Text style={styles.infoValue}>{invoiceData.retailer.firstName} {invoiceData.retailer.lastName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t("Phone")}</Text>
              <Text style={styles.infoValue}>{invoiceData.retailer.phone}</Text>
            </View>
            {invoiceData.retailer.email && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t("Email")}</Text>
                <Text style={styles.infoValue}>{invoiceData.retailer.email}</Text>
              </View>
            )}
            {invoiceData.retailer.location?.address && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t("Address")}</Text>
                <Text style={styles.infoValue}>{invoiceData.retailer.location.address}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Organization Information */}
      {invoiceData.organization && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("Organization Information")}</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t("Organization Name")}</Text>
              <Text style={styles.infoValue}>{invoiceData.organization.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t("Phone")}</Text>
              <Text style={styles.infoValue}>{invoiceData.organization.phone}</Text>
            </View>
            {invoiceData.organization.email && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t("Email")}</Text>
                <Text style={styles.infoValue}>{invoiceData.organization.email}</Text>
              </View>
            )}
            {invoiceData.organization.location?.address && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t("Address")}</Text>
                <Text style={styles.infoValue}>{invoiceData.organization.location.address}</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );

  const getPaymentStatusText = (status: PaymentStatus | string) => {
    switch (status) {
      case PaymentStatus.PAID:
      case 'paid':
        return t("Paid");
      case PaymentStatus.UNPAID:
      case 'unpaid':
        return t("Unpaid");
      case PaymentStatus.PARTIALLY_PAID:
      case 'partially_paid':
        return t("Partially Paid");
      case PaymentStatus.OVERPAID:
      case 'overpaid':
        return t("Overpaid");
      default:
        return t("Unknown");
    }
  };

  const getPaymentStatusColor = (status: PaymentStatus | string) => {
    switch (status) {
      case PaymentStatus.PAID:
      case 'paid':
        return '#059669';
      case PaymentStatus.UNPAID:
      case 'unpaid':
        return '#ef4444';
      case PaymentStatus.PARTIALLY_PAID:
      case 'partially_paid':
        return '#f59e0b';
      case PaymentStatus.OVERPAID:
      case 'overpaid':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  const getPaymentMethodText = (method: PaymentMethod | null) => {
    if (!method) return t("Not specified");
    switch (method) {
      case PaymentMethod.CASH:
        return t("Cash");
      case PaymentMethod.CARD:
        return t("Card");
      case PaymentMethod.BANK_TRANSFER:
        return t("Bank Transfer");
      case PaymentMethod.CHECK:
        return t("Check");
      case PaymentMethod.MOBILE_PAYMENT:
        return t("Mobile Payment");
      case PaymentMethod.CRYPTO:
        return t("Cryptocurrency");
      default:
        return t("Unknown");
    }
  };

  const renderPaymentHistoryTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Payment Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("Payment Summary")}</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("Total Amount")}</Text>
            <Text style={styles.infoValue}>${invoiceData.totalAmount}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("Amount Paid")}</Text>
            <Text style={styles.infoValue}>${invoiceData.paidAmount}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("Remaining Amount")}</Text>
            <Text style={styles.infoValue}>${invoiceData.remainingAmount}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("Payment Status")}</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, { backgroundColor: getPaymentStatusColor(invoiceData.paymentStatus) + '20' }]}>
                <Text style={[styles.statusText, { color: getPaymentStatusColor(invoiceData.paymentStatus) }]}>
                  {getPaymentStatusText(invoiceData.paymentStatus)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Payment History */}
      {invoiceData.payments && invoiceData.payments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("Payment History")}</Text>
          {invoiceData.payments.map((payment, index) => (
            <View key={payment.id} style={styles.paymentContainer}>
              <View style={styles.paymentHeader}>
                <Text style={styles.paymentAmount}>${payment.paymentAmount}</Text>
                <Text style={styles.paymentMethod}>{getPaymentMethodText(payment.paymentMethod)}</Text>
              </View>
              <View style={styles.paymentDetails}>
                <Text style={styles.paymentDate}>
                  {new Date(payment.paymentDate).toLocaleDateString()} {new Date(payment.paymentDate).toLocaleTimeString()}
                </Text>
                <Text style={styles.paymentId}>ID: {payment.id}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Payment Status History */}
      {invoiceData.paymentStatusHistory && invoiceData.paymentStatusHistory.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("Payment Status History")}</Text>
          {invoiceData.paymentStatusHistory.map((statusChange, index) => (
            <View key={index} style={styles.statusHistoryContainer}>
              <View style={styles.statusHistoryHeader}>
                <View style={[styles.statusBadge, { backgroundColor: getPaymentStatusColor(statusChange.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getPaymentStatusColor(statusChange.status) }]}>
                    {getPaymentStatusText(statusChange.status)}
                  </Text>
                </View>
                <Text style={styles.statusDate}>
                  {new Date(statusChange.changedAt).toLocaleDateString()} {new Date(statusChange.changedAt).toLocaleTimeString()}
                </Text>
              </View>
              <Text style={styles.statusReason}>{statusChange.reason}</Text>
              {statusChange.amount && (
                <Text style={styles.statusAmount}>Amount: ${statusChange.amount}</Text>
              )}
              {statusChange.changedBy && (
                <Text style={styles.statusChangedBy}>Changed by: {statusChange.changedBy}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Invoice Status History */}
      {invoiceData.statusHistory && invoiceData.statusHistory.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("Invoice Status History")}</Text>
          {invoiceData.statusHistory.map((statusChange, index) => (
            <View key={index} style={styles.statusHistoryContainer}>
              <View style={styles.statusHistoryHeader}>
                <View style={[styles.statusBadge, { backgroundColor: getInvoiceStatusColor(statusChange.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getInvoiceStatusColor(statusChange.status) }]}>
                    {getInvoiceStatusText(statusChange.status)}
                  </Text>
                </View>
                <Text style={styles.statusDate}>
                  {new Date(statusChange.changedAt).toLocaleDateString()} {new Date(statusChange.changedAt).toLocaleTimeString()}
                </Text>
              </View>
              <Text style={styles.statusReason}>{statusChange.reason}</Text>
              {statusChange.changedBy && (
                <Text style={styles.statusChangedBy}>Changed by: {statusChange.changedBy}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Order Status History */}
      {invoiceData.order?.statusHistory && invoiceData.order.statusHistory.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("Order Status History")}</Text>
          {invoiceData.order.statusHistory.map((statusChange, index) => (
            <View key={index} style={styles.statusHistoryContainer}>
              <View style={styles.statusHistoryHeader}>
                <View style={[styles.statusBadge, { backgroundColor: getInvoiceStatusColor(statusChange.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getInvoiceStatusColor(statusChange.status) }]}>
                    {getInvoiceStatusText(statusChange.status)}
                  </Text>
                </View>
                <Text style={styles.statusDate}>
                  {new Date(statusChange.changedAt).toLocaleDateString()} {new Date(statusChange.changedAt).toLocaleTimeString()}
                </Text>
              </View>
              <Text style={styles.statusReason}>{statusChange.reason}</Text>
              {statusChange.changedBy && (
                <Text style={styles.statusChangedBy}>Changed by: {statusChange.changedBy}</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title={t("Invoice")} 
        opacity={1} 
        onBack={() => router.back()} 
        scrollY={scrollY}
      />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Tab
          label={t("Invoice Details")}
          isActive={activeTab === 'details'}
          onPress={() => setActiveTab('details')}
        />
        <Tab
          label={t("Payment History")}
          isActive={activeTab === 'payments'}
          onPress={() => setActiveTab('payments')}
        />
      </View>

      {/* Tab Content */}
      {activeTab === 'details' ? renderInvoiceDetailsTab() : renderPaymentHistoryTab()}

    </SafeAreaView>
  );
}

// Enhanced styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    minHeight: 60,
    alignItems: 'center',
    marginTop: 56,
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activeTab: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  activeTabText: {
    color: '#fff',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  invoiceHeaderLeft: {
    flex: 1,
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 16,
    color: '#6b7280',
  },
  invoiceHeaderRight: {
    alignItems: 'flex-end',
  },
  invoiceDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  invoiceCreatedAt: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    marginBottom: 8,
  },
  invoiceStatusContainer: {
    marginTop: 8,
  },
  invoiceStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  invoiceStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 12,
  },
  infoGrid: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#111',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  // New PDF button styles
  pdfButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  viewButton: {
    backgroundColor: '#f0fdf4',
    borderColor: '#059669',
  },
  downloadButton: {
    backgroundColor: '#f0fdf4',
    borderColor: '#059669',
  },
  pdfButtonDisabled: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
  },
  pdfButtonText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginLeft: 6,
  },
  pdfButtonTextDisabled: {
    color: '#9ca3af',
  },
  // Additional styles for new sections
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    color: '#111',
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    color: '#111',
    fontWeight: 'bold',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    flex: 1,
  },
  itemStatus: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemDetail: {
    fontSize: 14,
    color: '#6b7280',
  },
  paymentContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  paymentMethod: {
    fontSize: 14,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  paymentId: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statusHistoryContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusReason: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  statusAmount: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 4,
  },
  statusChangedBy: {
    fontSize: 12,
    color: '#9ca3af',
  },
});