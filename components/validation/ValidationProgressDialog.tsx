import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ValidationProgressDialogProps, ValidatedItem } from '../../types/validation.types';

export const ValidationProgressDialog: React.FC<ValidationProgressDialogProps> = ({
  isOpen,
  onClose,
  validatedItems,
  validationComplete,
  onProcessMore
}) => {
  const { t } = useTranslation();

  const getStatusIcon = (item: ValidatedItem) => {
    switch (item.validationStatus) {
      case 'success':
        return { name: 'check-circle', color: '#16a34a' };
      case 'error':
        return { name: 'x-circle', color: '#dc2626' };
      case 'pending':
        return { name: 'clock', color: '#f59e0b' };
      default:
        return { name: 'clock', color: '#6b7280' };
    }
  };

  const getStatusText = (item: ValidatedItem) => {
    switch (item.validationStatus) {
      case 'success':
        return t('Success');
      case 'error':
        return t('Failed');
      case 'pending':
        return t('Processing');
      default:
        return t('Pending');
    }
  };

  const successfulItems = validatedItems.filter(item => item.validationStatus === 'success');
  const failedItems = validatedItems.filter(item => item.validationStatus === 'error');
  const pendingItems = validatedItems.filter(item => item.validationStatus === 'pending');

  return (
    <Modal visible={isOpen} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {validationComplete ? t('Validation Complete') : t('Processing Items')}
            </Text>
            {!validationComplete && (
              <ActivityIndicator size="small" color="#10b981" style={styles.loadingIndicator} />
            )}
          </View>

          {/* Progress Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{successfulItems.length}</Text>
                <Text style={styles.summaryLabel}>{t('Successful')}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: '#dc2626' }]}>{failedItems.length}</Text>
                <Text style={styles.summaryLabel}>{t('Failed')}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: '#f59e0b' }]}>{pendingItems.length}</Text>
                <Text style={styles.summaryLabel}>{t('Processing')}</Text>
              </View>
            </View>
          </View>

          {/* Items List */}
          <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
            {validatedItems.map((item) => {
              const statusIcon = getStatusIcon(item);
              return (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.variant?.name || 'Unknown Product'}
                    </Text>
                    <Text style={styles.itemDetails}>
                      {item.updatedQuantity} × {parseFloat(item.unitPrice).toFixed(3)} {t('DT')}
                    </Text>
                  </View>
                  
                  <View style={styles.statusContainer}>
                    <Feather name={statusIcon.name as any} size={20} color={statusIcon.color} />
                    <Text style={[styles.statusText, { color: statusIcon.color }]}>
                      {getStatusText(item)}
                    </Text>
                  </View>
                  
                  {item.errorMessage && (
                    <Text style={styles.errorMessage} numberOfLines={2}>
                      {item.errorMessage}
                    </Text>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            {validationComplete ? (
              <View style={styles.buttonRow}>
                <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={onProcessMore}>
                  <Text style={styles.secondaryButtonText}>{t('Process More')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={onClose}>
                  <Text style={styles.primaryButtonText}>{t('Done')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.processingFooter}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.processingText}>{t('Processing items...')}</Text>
              </View>
            )}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  summaryContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  itemsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  itemRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemInfo: {
    flex: 1,
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  itemDetails: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorMessage: {
    fontSize: 11,
    color: '#dc2626',
    marginTop: 4,
    fontStyle: 'italic',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#10b981',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 14,
  },
  processingFooter: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  processingText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
  },
});
