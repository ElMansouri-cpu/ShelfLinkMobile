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
import { useGetInvoiceByOrderId, useGeneratePdf, useValidatePayment } from '../../services/invoice-service/invoice.query';
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
  const { invoiceId, invoice: invoiceParam, orderId, organizationId } = useLocalSearchParams();
  const { t } = useTranslation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'details' | 'payments'>('details');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Parse invoice data from params if available
  const parsedInvoice = invoiceParam ? JSON.parse(invoiceParam as string) : null;
  
  // Use the parsed invoice data directly if available, otherwise fetch by orderId
  const { data: fetchedInvoiceData, isLoading: isFetching, error: fetchError, refetch } = useGetInvoiceByOrderId(
    organizationId as string,
    orderId as string
  );
  
  // Use parsed invoice data if available, otherwise use fetched data
  const invoiceData = parsedInvoice || fetchedInvoiceData;
  const isLoading = parsedInvoice ? false : isFetching;
  const error = parsedInvoice ? null : fetchError;
  
  console.log('InvoiceScreen - Parameters:', { invoiceId, orderId, organizationId });
  console.log('InvoiceScreen - Parsed invoice:', parsedInvoice);
  console.log('InvoiceScreen - Fetched invoice:', fetchedInvoiceData);
  console.log('InvoiceScreen - Final invoice data:', invoiceData);
  console.log('InvoiceScreen - PDF Generation params:', {
    organizationId: invoiceData?.organizationId || organizationId,
    invoiceId: invoiceData?.id || invoiceId
  });

  const { data: pdfData, isLoading: isPdfLoading, refetch: generatePdf } = useGeneratePdf(
    invoiceData?.organizationId || organizationId as string,
    invoiceData?.id || invoiceId as string
  );
  
  console.log('InvoiceScreen - PDF Hook Status:', {
    pdfData,
    isPdfLoading,
    organizationId: invoiceData?.organizationId || organizationId,
    invoiceId: invoiceData?.id || invoiceId
  });

  // Payment validation mutation
  const { mutate: validatePayment, isPending: isValidationLoading } = useValidatePayment();

  // Get notification context for auto-updates
  const { lastPayload } = useNotification();

  // Auto-update invoice data when notifications are received
  useEffect(() => {
    if (lastPayload) {
      const payloadData = lastPayload.new as any;
      const isInvoiceUpdate = lastPayload.table === 'invoices';
      const isOrderUpdate = lastPayload.table === 'orders';

      // Use invoice's order ID or the passed orderId
      const currentOrderId = invoiceData?.orderId || orderId;
      
      // Refetch if it's an invoice update for this order, or an order update for this order
      const shouldRefetch = (isInvoiceUpdate && payloadData?.orderId === currentOrderId) || 
                           (isOrderUpdate && payloadData?.id === currentOrderId);
      
      if (shouldRefetch) {
        console.log('InvoiceScreen - Refetching invoice data due to relevant update');
        refetch();
      } else {
        console.log('InvoiceScreen - Update not relevant to this invoice, skipping refetch');
      }
    }
  }, [lastPayload, refetch, orderId, invoiceData?.orderId]);

  // Debug logging for invoice data updates
  useEffect(() => {
    console.log('InvoiceScreen - invoiceData updated:', {
      invoiceId: invoiceId,
      orderId: orderId,
      organizationId: organizationId,
      invoiceDataId: invoiceData?.id,
      invoiceNumber: invoiceData?.invoiceNumber,
      status: invoiceData?.status,
      paymentStatus: invoiceData?.paymentStatus,
      isLoading,
      error: error?.message,
      lastPayload: lastPayload?.new?.id,
      hasParsedInvoice: !!parsedInvoice
    });
  }, [invoiceData, isLoading, error, invoiceId, orderId, organizationId, lastPayload, parsedInvoice]);

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

      console.log('PDF data received:', response.data);
      console.log('PDF data type:', typeof response.data);
      console.log('PDF data constructor:', response.data?.constructor?.name);

      // Check if we have a PDF URL
      if (response.data?.pdfUrl) {
        // Download the PDF from the URL
        const downloadResult = await FileSystem.downloadAsync(
          response.data.pdfUrl,
          FileSystem.documentDirectory + `invoice_${invoiceData.invoiceNumber}_${Date.now()}.pdf`
        );
        
        console.log('PDF downloaded to:', downloadResult.uri);
        
        // Share the downloaded PDF
        await sharePdf(downloadResult.uri);
        return;
      }

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

      // Handle different PDF response formats
      let base64Pdf: string;
      
      if (response.data instanceof Blob) {
        console.log('PDF blob received, size:', response.data.size, 'bytes');
        base64Pdf = await blobToBase64(response.data);
      } else if (typeof response.data === 'string') {
        // If the response is a base64 string
        console.log('PDF base64 string received, length:', response.data.length);
        base64Pdf = response.data;
      } else if (response.data && typeof response.data === 'object' && response.data.data) {
        // If the response has a nested data property
        console.log('PDF nested data received');
        if (response.data.data instanceof Blob) {
          base64Pdf = await blobToBase64(response.data.data);
        } else if (typeof response.data.data === 'string') {
          base64Pdf = response.data.data;
        } else {
          throw new Error('Invalid nested PDF data format');
        }
      } else {
        console.log('Raw PDF data received, attempting to save directly');
        // If it's raw binary data, try to save it directly
        const timestamp = new Date().getTime();
        const fileName = `invoice_${invoiceData.invoiceNumber}_${timestamp}.pdf`;
        const fileUri = FileSystem.documentDirectory + fileName;
        
        // Write the raw data to file
        await FileSystem.writeAsStringAsync(fileUri, response.data, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        
        console.log('PDF saved successfully to:', fileUri);
        
        // Share the saved PDF
        await sharePdf(fileUri);
        return;
      }

      // Create filename with timestamp for base64 data
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

  // Payment validation functions
  const handleValidatePayment = (paymentId: string, validated: boolean) => {
    if (!paymentId) return;

    const actionText = validated ? t('approve') : t('reject');
    const confirmText = validated ? t('Are you sure you want to approve this payment?') : t('Are you sure you want to reject this payment?');

    Alert.alert(
      t('Confirm Action'),
      confirmText,
      [
        {
          text: t('Cancel'),
          style: 'cancel',
        },
        {
          text: actionText,
          style: validated ? 'default' : 'destructive',
          onPress: () => {
            validatePayment({
              organizationId: invoiceData?.organizationId || organizationId as string,
              invoiceId: invoiceData?.id || invoiceId as string,
              paymentId,
              validationStatus: validated ? 'approved' : 'rejected'
            }, {
              onSuccess: () => {
                Alert.alert(
                  t('Success'),
                  validated 
                    ? t('Payment approved successfully!')
                    : t('Payment rejected successfully!'),
                  [{ text: t('OK'), style: 'default' }]
                );
              },
              onError: (error) => {
                console.error('Payment validation error:', error);
                Alert.alert(
                  t('Error'),
                  t('Failed to validate payment. Please try again.'),
                  [{ text: t('OK'), style: 'default' }]
                );
              }
            });
          }
        }
      ]
    );
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

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case 'submitted':
        return t("Submitted");
      case 'confirmed':
        return t("Confirmed");
      case 'processing':
        return t("Processing");
      case 'shipped':
        return t("Shipped");
      case 'delivered':
        return t("Delivered");
      case 'completed':
        return t("Completed");
      case 'cancelled':
        return t("Cancelled");
      case 'inventory_shortage':
        return t("Inventory Shortage");
      case 'other':
        return t("Other");
      case 'assigned':
        return t("Assigned");
      default:
        return t("Unknown");
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return '#6b7280';
      case 'confirmed':
        return '#3b82f6';
      case 'processing':
        return '#f59e0b';
      case 'shipped':
        return '#8b5cf6';
      case 'delivered':
        return '#059669';
      case 'completed':
        return '#059669';
      case 'cancelled':
        return '#ef4444';
      case 'inventory_shortage':
        return '#f59e0b';
      case 'other':
        return '#6b7280';
      case 'assigned':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const translateStatusReason = (reason: string) => {
    // Handle payment reasons with dynamic amounts
    if (reason.includes('Payment of') && reason.includes('via')) {
      const parts = reason.split(' via ');
      if (parts.length === 2) {
        const amountPart = parts[0].replace('Payment of ', '');
        const methodPart = parts[1];
        return `${t("Payment of")} ${amountPart} ${t(methodPart)}`;
      }
    }
    
    switch (reason) {
      case 'Order created':
        return t("Order created");
      case 'inventory_shortage':
        return t("Inventory shortage");
      case 'Order assigned to team member':
        return t("Order assigned to team member");
      case 'other':
        return t("Other");
      case 'Invoice created':
        return t("Invoice created");
      case 'Invoice automatically completed due to full payment':
        return t("Invoice automatically completed due to full payment");
      case 'Payment of':
        return t("Payment of");
      case 'via cash':
        return t("via cash");
      case 'via card':
        return t("via card");
      case 'via bank transfer':
        return t("via bank transfer");
      default:
        return reason; // Return original if no translation found
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
            <Text style={styles.infoValue}>{invoiceData.subtotalAmount} {t("DT")}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("Tax Amount")}</Text>
            <Text style={styles.infoValue}>{invoiceData.taxAmount} {t("DT")}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("Discount")}</Text>
            <Text style={styles.infoValue}>-{invoiceData.discountAmount} {t("DT")}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("Shipping")}</Text>
            <Text style={styles.infoValue}>{invoiceData.shippingAmount} {t("DT")}</Text>
          </View>
          <View style={[styles.infoRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>{t("Total Amount")}</Text>
            <Text style={styles.totalValue}>{invoiceData.totalAmount} {t("DT")}</Text>
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
            <Text style={styles.infoValue}>{invoiceData.paidAmount} {t("DT")}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("Remaining Amount")}</Text>
            <Text style={styles.infoValue}>{invoiceData.remainingAmount} {t("DT")}</Text>
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
                <Text style={styles.itemDetail}>{t("Unit Price")}: {item.unitPrice} {t("DT")}</Text>
                <Text style={styles.itemDetail}>{t("Total")}: {item.totalAmount} {t("DT")}</Text>
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
              <Text style={styles.infoLabel}>{t("Phone Number")}</Text>
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
                <Text style={styles.infoLabel}>{t("Store Address")}</Text>
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
              <Text style={styles.infoLabel}>{t("Phone Number")}</Text>
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
                <Text style={styles.infoLabel}>{t("Store Address")}</Text>
                <Text style={styles.infoValue}>{invoiceData.organization.location.address}</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return t("Paid");
      case 'unpaid':
        return t("Unpaid");
      case 'partially_paid':
        return t("Partially Paid");
      case 'overpaid':
        return t("Overpaid");
      default:
        return t("Unknown");
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return '#059669';
      case 'unpaid':
        return '#ef4444';
      case 'partially_paid':
        return '#f59e0b';
      case 'overpaid':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  const getPaymentMethodText = (method: string | null) => {
    if (!method) return t("Not specified");
    switch (method) {
      case 'cash':
        return t("Cash");
      case 'card':
        return t("Card");
      case 'bank_transfer':
        return t("Bank Transfer");
      case 'check':
        return t("Check");
      case 'mobile_payment':
        return t("Mobile Payment");
      case 'crypto':
        return t("Cryptocurrency");
      default:
        return t("Unknown");
    }
  };

  const getValidationStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return t("Pending Validation");
      case 'approved':
        return t("Approved");
      case 'rejected':
        return t("Rejected");
      default:
        return t("Unknown");
    }
  };

  const getValidationStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'approved':
        return '#059669';
      case 'rejected':
        return '#ef4444';
      default:
        return '#6b7280';
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
            <Text style={styles.infoValue}>{invoiceData.totalAmount} {t("DT")}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("Amount Paid")}</Text>
            <Text style={styles.infoValue}>{invoiceData.paidAmount} {t("DT")}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("Remaining Amount")}</Text>
            <Text style={styles.infoValue}>{invoiceData.remainingAmount} {t("DT")}</Text>
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
          {/* Payment Validation Summary */}
          {invoiceData.payments && invoiceData.payments.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t("Validation Status")}</Text>
              <View style={styles.statusContainer}>
                {(() => {
                  const pendingPayments = invoiceData.payments.filter(p => p.validationStatus === 'pending').length;
                  const validatedPayments = invoiceData.payments.filter(p => p.validationStatus === 'approved').length;
                  const rejectedPayments = invoiceData.payments.filter(p => p.validationStatus === 'rejected').length;
                  
                  if (pendingPayments > 0) {
                    return (
                      <View style={[styles.statusBadge, { backgroundColor: '#f59e0b20' }]}>
                        <Text style={[styles.statusText, { color: '#f59e0b' }]}>
                          {pendingPayments} {t("Pending")}
                        </Text>
                      </View>
                    );
                  } else if (rejectedPayments > 0) {
                    return (
                      <View style={[styles.statusBadge, { backgroundColor: '#ef444420' }]}>
                        <Text style={[styles.statusText, { color: '#ef4444' }]}>
                          {rejectedPayments} {t("Rejected")}
                        </Text>
                      </View>
                    );
                  } else {
                    return (
                      <View style={[styles.statusBadge, { backgroundColor: '#05966920' }]}>
                        <Text style={[styles.statusText, { color: '#059669' }]}>
                          {validatedPayments} {t("Approved")}
                        </Text>
                      </View>
                    );
                  }
                })()}
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Payment History */}
      {invoiceData.payments && invoiceData.payments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("Payment History")}</Text>
          {invoiceData.payments.map((payment, index) => (
            <View key={payment.id} style={styles.paymentContainer}>
              <View style={styles.paymentHeader}>
                <Text style={styles.paymentAmount}>{payment.paymentAmount} {t("DT")}</Text>
                <View style={styles.paymentMethodContainer}>
                  <Text style={styles.paymentMethod}>{getPaymentMethodText(payment.paymentMethod)}</Text>
                  <View style={[styles.validationStatusBadge, { backgroundColor: getValidationStatusColor(payment.validationStatus) + '20' }]}>
                    <Text style={[styles.validationStatusText, { color: getValidationStatusColor(payment.validationStatus) }]}>
                      {getValidationStatusText(payment.validationStatus)}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.paymentDetails}>
                <Text style={styles.paymentDate}>
                  {new Date(payment.paymentDate).toLocaleDateString()} {new Date(payment.paymentDate).toLocaleTimeString()}
                </Text>
                {payment.createdByUser && (
                  <Text style={styles.paymentCreatedBy}>
                    {t("Created by")}: {payment.createdByUser.firstName} {payment.createdByUser.lastName}
                  </Text>
                )}
              </View>
              
              {/* Validation Actions - Only show for pending payments */}
              {payment.validationStatus === 'pending' && (
                <View style={styles.validationActionsContainer}>
                  <TouchableOpacity
                    style={[styles.validationButton, styles.approveButton]}
                    onPress={() => handleValidatePayment(payment.id, true)}
                    disabled={isValidationLoading}
                    activeOpacity={0.7}
                  >
                    <Feather name="check" size={16} color="#fff" />
                    <Text style={styles.validationButtonText}>{t("Approve")}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.validationButton, styles.rejectButton]}
                    onPress={() => handleValidatePayment(payment.id, false)}
                    disabled={isValidationLoading}
                    activeOpacity={0.7}
                  >
                    <Feather name="x" size={16} color="#fff" />
                    <Text style={styles.validationButtonText}>{t("Reject")}</Text>
                  </TouchableOpacity>
                </View>
              )}
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
              <Text style={styles.statusReason} numberOfLines={3}>{translateStatusReason(statusChange.reason)}</Text>
              {statusChange.amount && (
                <Text style={styles.statusAmount}>Amount: {statusChange.amount} {t("DT")}</Text>
              )}
              {statusChange.changedByUser && (
                <Text style={styles.statusChangedBy} numberOfLines={2} ellipsizeMode="middle">
                  Changed by: {statusChange.changedByUser.firstName} {statusChange.changedByUser.lastName}
                </Text>
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
              <Text style={styles.statusReason} numberOfLines={3}>{translateStatusReason(statusChange.reason)}</Text>
              {statusChange.changedByUser && (
                <Text style={styles.statusChangedBy} numberOfLines={2} ellipsizeMode="middle">
                  Changed by: {statusChange.changedByUser.firstName} {statusChange.changedByUser.lastName}
                </Text>
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
                <View style={[styles.statusBadge, { backgroundColor: getOrderStatusColor(statusChange.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getOrderStatusColor(statusChange.status) }]}>
                    {getOrderStatusText(statusChange.status)}
                  </Text>
                </View>
                <Text style={styles.statusDate}>
                  {new Date(statusChange.changedAt).toLocaleDateString()} {new Date(statusChange.changedAt).toLocaleTimeString()}
                </Text>
              </View>
              <Text style={styles.statusReason} numberOfLines={3}>{translateStatusReason(statusChange.reason)}</Text>
              {statusChange.changedByUser && (
                <Text style={styles.statusChangedBy} numberOfLines={2} ellipsizeMode="middle">
                  Changed by: {statusChange.changedByUser.firstName} {statusChange.changedByUser.lastName}
                </Text>
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

      {/* Payment Button - Only show if invoice is not fully paid and not completed */}


      {/* Payment Modal */}
    
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
    paddingBottom: 100, // Add padding for payment button
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
    overflow: 'hidden',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
    flex: 1,
    marginRight: 8,
  },
  paymentMethod: {
    fontSize: 14,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexShrink: 1,
  },
  paymentDetails: {
    flexDirection: 'column',
    gap: 4,
  },
  paymentDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  paymentId: {
    fontSize: 12,
    color: '#9ca3af',
    flex: 1,
    textAlign: 'left',
  },
  paymentCreatedBy: {
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
    overflow: 'hidden',
  },
  statusHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  statusDate: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
    textAlign: 'right',
  },
  statusReason: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
    flexWrap: 'wrap',
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
    flexWrap: 'wrap',
  },
  // Payment button styles
  paymentButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  paymentButton: {
    backgroundColor: "#10b981",
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  paymentButtonIcon: {
    backgroundColor: "rgba(255,255,255,0.2)",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  paymentButtonSpacer: {
    width: 36,
  },
  // Payment validation styles
  paymentMethodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  validationStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  validationStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  validationActionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  validationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  approveButton: {
    backgroundColor: '#059669',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  validationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});