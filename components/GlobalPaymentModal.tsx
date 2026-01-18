import React from 'react';
import { useNotification } from '../context/NotificationContext';
import PaymentValidationModal from './PaymentValidationModal';

export default function GlobalPaymentModal() {
  const { pendingPayment, hidePaymentModal } = useNotification();

  return (
    <PaymentValidationModal
      visible={!!pendingPayment}
      onClose={hidePaymentModal}
      payment={pendingPayment}
    />
  );
}
