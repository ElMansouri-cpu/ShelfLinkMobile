import { useCallback } from 'react';
import { ValidatedItem } from '../types/validation.types';

export const useItemCalculations = () => {
  const calculateItemTotals = useCallback((item: ValidatedItem, newQuantity: number) => {
    try {
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const discountPercentage = parseFloat(item.discountPercentage || '0');
      const taxPercentage = parseFloat(item.taxPercentage || '0');

      const subtotal = newQuantity * unitPrice;
      const discountAmount = subtotal * (discountPercentage / 100);
      const taxAmount = (subtotal - discountAmount) * (taxPercentage / 100);
      const total = subtotal - discountAmount + taxAmount;

      return {
        subtotalAmount: subtotal.toFixed(3),
        totalAmount: total.toFixed(3),
        discountAmount: discountAmount.toFixed(3),
        taxAmount: taxAmount.toFixed(3)
      };
    } catch (error) {
      console.error('Error calculating item totals:', error);
      return {
        subtotalAmount: item.subtotalAmount,
        totalAmount: item.totalAmount,
        discountAmount: '0.000',
        taxAmount: '0.000'
      };
    }
  }, []);

  return { calculateItemTotals };
};

