import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { PaymentValidationStatus, PaymentMethod } from '../services/invoice-service/invoice.type';
import { useValidatePayment } from '../services/invoice-service/invoice.query';

interface PaymentValidationModalProps {
  visible: boolean;
  onClose: () => void;
  payment: {
    id: string;
    paymentAmount: number;
    paymentMethod: PaymentMethod;
    invoiceNumber: string;
    organizationId: string;
    invoiceId: string;
  } | null;
}

const { width } = Dimensions.get('window');

export default function PaymentValidationModal({ 
  visible, 
  onClose, 
  payment 
}: PaymentValidationModalProps) {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const { mutate: validatePayment } = useValidatePayment();

  if (!payment) return null;

  const getPaymentMethodText = (method: PaymentMethod) => {
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

  const handleValidation = (validationStatus: PaymentValidationStatus) => {
    const isApproval = validationStatus === PaymentValidationStatus.APPROVED;
    const actionText = isApproval ? t('approve') : t('reject');
    const confirmText = isApproval 
      ? t('Are you sure you want to approve this payment?') 
      : t('Are you sure you want to reject this payment?');

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
          style: isApproval ? 'default' : 'destructive',
          onPress: () => {
            setIsProcessing(true);
            validatePayment({
              organizationId: payment.organizationId,
              invoiceId: payment.invoiceId,
              paymentId: payment.id,
              validationData: {
                validationStatus,
                note: undefined
              }
            }, {
              onSuccess: () => {
                setIsProcessing(false);
                Alert.alert(
                  t('Success'),
                  isApproval 
                    ? t('Payment approved successfully!')
                    : t('Payment rejected successfully!'),
                  [{ text: t('OK'), style: 'default', onPress: onClose }]
                );
              },
              onError: (error) => {
                console.error('Payment validation error:', error);
                setIsProcessing(false);
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Feather name="credit-card" size={24} color="#059669" />
              <Text style={styles.headerTitle}>{t("New Payment Notification")}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.description}>
              {t("A new payment requires your validation")}
            </Text>

            {/* Payment Details */}
            <View style={styles.paymentDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t("Invoice Number")}</Text>
                <Text style={styles.detailValue}>{payment.invoiceNumber}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t("Payment Amount")}</Text>
                <Text style={styles.detailValue}>{payment.paymentAmount} {t("DT")}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t("Payment Method")}</Text>
                <Text style={styles.detailValue}>{getPaymentMethodText(payment.paymentMethod)}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleValidation(PaymentValidationStatus.REJECTED)}
                disabled={isProcessing}
                activeOpacity={0.7}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="x" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>{t("Reject")}</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleValidation(PaymentValidationStatus.APPROVED)}
                disabled={isProcessing}
                activeOpacity={0.7}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="check" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>{t("Approve")}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: width * 0.9,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  paymentDetails: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#111',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  approveButton: {
    backgroundColor: '#059669',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
