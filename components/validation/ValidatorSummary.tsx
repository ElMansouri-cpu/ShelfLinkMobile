import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ValidationSummary } from '../../types/validation.types';

interface ValidatorSummaryProps {
  summary: ValidationSummary;
}

export const ValidatorSummary: React.FC<ValidatorSummaryProps> = ({ summary }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, styles.validatedBadge]}>
          <Feather name="check-circle" size={14} color="#16a34a" />
          <Text style={[styles.statusText, styles.validatedText]}>
            {summary.validatedItems} {t('Validated')}
          </Text>
        </View>
        
        <View style={[styles.statusBadge, styles.cancelledBadge]}>
          <Feather name="x-circle" size={14} color="#dc2626" />
          <Text style={[styles.statusText, styles.cancelledText]}>
            {summary.cancelledItems} {t('Cancelled')}
          </Text>
        </View>
      </View>
      
      <View style={styles.amountRow}>
        <Text style={styles.amountLabel}>{t('Original')}: {summary.originalAmount.toFixed(3)} {t('DT')}</Text>
        <Text style={styles.amountLabel}>{t('New')}: {summary.totalAmount.toFixed(3)} {t('DT')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  validatedBadge: {
    backgroundColor: '#dcfce7',
  },
  cancelledBadge: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  validatedText: {
    color: '#16a34a',
  },
  cancelledText: {
    color: '#dc2626',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amountLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
});

