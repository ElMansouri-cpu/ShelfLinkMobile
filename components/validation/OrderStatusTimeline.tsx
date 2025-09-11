import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { OrderStatus } from '../../services/order-service/orders.type';

const { width } = Dimensions.get('window');

interface OrderStatusTimelineProps {
  currentStatus: OrderStatus;
  onStatusAction?: (status: OrderStatus) => void;
  canValidate?: boolean;
}

export const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({
  currentStatus,
  onStatusAction,
  canValidate = false
}) => {
  const { t } = useTranslation();

  const statusOrder = [
    OrderStatus.SUBMITTED,
    OrderStatus.CONFIRMED,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
    OrderStatus.COMPLETED
  ];

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.SUBMITTED:
        return 'file-text';
      case OrderStatus.CONFIRMED:
        return 'check-circle';
      case OrderStatus.PROCESSING:
        return 'package';
      case OrderStatus.SHIPPED:
        return 'truck';
      case OrderStatus.DELIVERED:
        return 'home';
      case OrderStatus.COMPLETED:
        return 'check';
      default:
        return 'circle';
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    const currentIndex = statusOrder.indexOf(currentStatus);
    const statusIndex = statusOrder.indexOf(status);
    
    if (statusIndex < currentIndex) {
      return '#16a34a'; // Completed
    } else if (statusIndex === currentIndex) {
      return '#10b981'; // Current
    } else {
      return '#d1d5db'; // Pending
    }
  };

  const getStatusTextColor = (status: OrderStatus) => {
    const currentIndex = statusOrder.indexOf(currentStatus);
    const statusIndex = statusOrder.indexOf(status);
    
    if (statusIndex <= currentIndex) {
      return '#111827'; // Active/Completed
    } else {
      return '#9ca3af'; // Pending
    }
  };

  const isStatusActive = (status: OrderStatus) => {
    return status === currentStatus;
  };

  const isStatusCompleted = (status: OrderStatus) => {
    const currentIndex = statusOrder.indexOf(currentStatus);
    const statusIndex = statusOrder.indexOf(status);
    return statusIndex < currentIndex;
  };

  return (
    <View style={styles.container}>
      <View style={styles.timeline}>
        {statusOrder.map((status, index) => (
          <React.Fragment key={status}>
            {/* Status Node */}
            <View style={styles.statusNode}>
              <View style={styles.statusIconContainer}>
                <View style={[
                  styles.statusIcon,
                  {
                    backgroundColor: isStatusCompleted(status) ? '#10b981' : 
                                    isStatusActive(status) ? '#10b981' : '#f1f5f9',
                    borderColor: isStatusCompleted(status) ? '#10b981' : 
                                isStatusActive(status) ? '#10b981' : '#e2e8f0',
                    borderWidth: isStatusCompleted(status) || isStatusActive(status) ? 0 : 2,
                  }
                ]}>
                  <Feather 
                    name={getStatusIcon(status) as any} 
                    size={18} 
                    color={isStatusCompleted(status) || isStatusActive(status) ? 'white' : '#94a3b8'} 
                  />
                </View>
                
                {/* Progress Ring for Active Status */}
                {isStatusActive(status) && (
                  <View style={styles.progressRing}>
                    <View style={styles.progressRingInner} />
                  </View>
                )}
              </View>
              
              <Text style={[
                styles.statusText,
                { 
                  color: getStatusTextColor(status),
                  fontWeight: isStatusActive(status) ? '700' : '500'
                }
              ]}>
                {t(`status.${status}`)}
              </Text>
            </View>

            {/* Connector Line */}
            {index < statusOrder.length - 1 && (
              <View style={styles.connectorWrapper}>
                <View style={[
                  styles.connector,
                  {
                    backgroundColor: isStatusCompleted(status) ? '#10b981' : '#e2e8f0'
                  }
                ]} />
              </View>
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 8,
    position: 'relative',
    width: '100%',
  },
  statusNode: {
    alignItems: 'center',
    flex: 1,
    minWidth: 50,
    maxWidth: 70,
    position: 'relative',
    marginHorizontal: 2,
  },
  statusIconContainer: {
    position: 'relative',
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2,
  },
  progressRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#10b981',
    borderStyle: 'dashed',
    opacity: 0.3,
  },
  progressRingInner: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#10b981',
    borderStyle: 'dashed',
    opacity: 0.2,
  },
  statusText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
    maxWidth: 70,
    flexWrap: 'wrap',
    paddingHorizontal: 4,
    alignSelf: 'center',
  },
  connectorWrapper: {
    position: 'absolute',
    top: 20,
    left: 30,
    right: -30,
    height: 2,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connector: {
    height: 2,
    width: '100%',
    borderRadius: 1,
  },
});
