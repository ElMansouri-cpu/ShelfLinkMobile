import React from 'react';
import { Modal, View, Text, TouchableOpacity, Animated } from 'react-native';
import { useEffect, useRef } from 'react';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  type?: 'success' | 'error' | 'info';
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  onClose,
  type = 'info'
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7
      }).start();
    } else {
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start();
    }
  }, [visible]);

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: '✓',
          iconBg: 'bg-green-100',
          iconText: 'text-green-700',
          title: 'text-green-800'
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: '✕',
          iconBg: 'bg-red-100',
          iconText: 'text-red-700',
          title: 'text-red-800'
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'ℹ',
          iconBg: 'bg-blue-100',
          iconText: 'text-blue-700',
          title: 'text-blue-800'
        };
    }
  };

  const colors = getColors();

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/50">
        <Animated.View
          className={`m-4 rounded-2xl ${colors.bg} ${colors.border} border shadow-xl`}
          style={{
            transform: [{ scale: scaleAnim }],
            width: '90%',
            maxWidth: 340
          }}
        >
          <View className="p-6">
            <View className="flex-row items-center mb-4">
              <View className={`w-8 h-8 rounded-full ${colors.iconBg} items-center justify-center mr-3`}>
                <Text className={`text-lg font-bold ${colors.iconText}`}>{colors.icon}</Text>
              </View>
              <Text className={`text-lg font-semibold ${colors.title}`}>{title}</Text>
            </View>
            
            <Text className="text-gray-600 mb-6">{message}</Text>

            <TouchableOpacity
              onPress={onClose}
              className={`py-3 rounded-lg ${colors.iconBg} items-center`}
            >
              <Text className={`font-medium ${colors.iconText}`}>OK</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default CustomAlert;
