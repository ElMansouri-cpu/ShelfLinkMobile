import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { PaymentMethod } from '../../services/invoice-service/invoice.type';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPayment: (paymentData: {
    paymentAmount: number;
    paymentMethod: PaymentMethod;
    note?: string;
  }) => Promise<void>;
  invoice: {
    totalAmount: string;
    paidAmount: string;
    remainingAmount: string;
  };
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onAddPayment,
  invoice,
}) => {
  const { t } = useTranslation();
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remainingAmount = parseFloat(invoice?.remainingAmount || '0');

  const handleSubmit = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      Alert.alert(t('Error'), t('Please enter a valid payment amount'));
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount > remainingAmount) {
      Alert.alert(t('Error'), t('Payment amount cannot exceed remaining amount'));
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddPayment({
        paymentAmount: amount,
        paymentMethod: paymentMethod,
        note: note.trim() || undefined,
      });
      
      // Reset form
      setPaymentAmount('');
      setNote('');
      onClose();
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPaymentMethodText = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CASH:
        return t('Cash');
      case PaymentMethod.CARD:
        return t('Card');
      case PaymentMethod.BANK_TRANSFER:
        return t('Bank Transfer');
      case PaymentMethod.CHECK:
        return t('Check');
      case PaymentMethod.MOBILE_PAYMENT:
        return t('Mobile Payment');
      case PaymentMethod.CRYPTO:
        return t('Cryptocurrency');
      default:
        return t('Unknown');
    }
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('Payment')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Payment Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('Payment Amount')}</Text>
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencySymbol}>DT</Text>
                <TextInput
                  style={styles.amountInput}
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  placeholder="0.00"
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
              <Text style={styles.maxAmountText}>
                {t('Maximum')}: {remainingAmount.toFixed(2)} DT
              </Text>
            </View>

            {/* Payment Method */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('Payment Method')}</Text>
              <View style={styles.paymentMethodContainer}>
                <Text style={styles.paymentMethodText}>
                  {getPaymentMethodText(paymentMethod)}
                </Text>
                <Feather name="chevron-down" size={20} color="#6b7280" />
              </View>
            </View>

            {/* Note */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('Note (Optional)')}</Text>
              <TextInput
                style={styles.noteInput}
                value={note}
                onChangeText={setNote}
                placeholder={t('Add a note about this payment...')}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (isSubmitting || !paymentAmount || parseFloat(paymentAmount) <= 0) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || !paymentAmount || parseFloat(paymentAmount) <= 0}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.submitButtonText}>{t('Adding Payment...')}</Text>
                </View>
              ) : (
                <View style={styles.submitButtonContent}>
                  <Feather name="plus" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>{t('Add Payment')}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10b981',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    color: '#111',
    fontWeight: '600',
  },
  maxAmountText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
  },
  paymentMethodText: {
    fontSize: 16,
    color: '#111',
    fontWeight: '500',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111',
    backgroundColor: '#f9fafb',
    minHeight: 80,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default PaymentModal;

