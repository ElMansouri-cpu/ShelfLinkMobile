import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRequestAccess } from '../services/organization-service/organization.query';

const { width, height } = Dimensions.get('window');

interface QRCodeScannerProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (organizationId: string) => void;
}

export default function QRCodeScanner({ visible, onClose, onSuccess }: QRCodeScannerProps) {
  const { t } = useTranslation();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { mutate: requestAccess, isPending } = useRequestAccess();
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (visible) {
      setScanned(false);
      setIsProcessing(false);
      console.log('QR Scanner opened, permission status:', permission);
    }
  }, [visible, permission]);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    setIsProcessing(true);

    // Validate that the scanned data looks like a valid organization ID (UUID format)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(data)) {
      Alert.alert(
        t('Invalid QR Code'),
        t('The scanned QR code does not contain a valid organization ID.'),
        [
          {
            text: t('Try Again'),
            onPress: () => {
              setScanned(false);
              setIsProcessing(false);
            }
          },
          {
            text: t('Cancel'),
            onPress: onClose,
            style: 'cancel'
          }
        ]
      );
      return;
    }

    // Show confirmation dialog
    Alert.alert(
      t('Request Access'),
      t('Do you want to request access to this organization?'),
      [
        {
          text: t('Cancel'),
          onPress: () => {
            setScanned(false);
            setIsProcessing(false);
          },
          style: 'cancel'
        },
        {
          text: t('Request Access'),
          onPress: () => {
            requestAccess({
              organizationId: data,
              requestMessage: t('I would like to become a client of your business.')
            }, {
              onSuccess: (response) => {
                setIsProcessing(false);
                Alert.alert(
                  t('Success'),
                  response.message || t('Access request sent successfully!'),
                  [
                    {
                      text: t('OK'),
                      onPress: () => {
                        onSuccess?.(data);
                        onClose();
                      }
                    }
                  ]
                );
              },
              onError: (error: any) => {
                console.error('Request access error:', error);
                setIsProcessing(false);
                Alert.alert(
                  t('Error'),
                  error.response?.data?.message || t('Failed to send access request. Please try again.'),
                  [
                    {
                      text: t('Try Again'),
                      onPress: () => {
                        setScanned(false);
                        setIsProcessing(false);
                      }
                    },
                    {
                      text: t('Cancel'),
                      onPress: onClose,
                      style: 'cancel'
                    }
                  ]
                );
              }
            });
          }
        }
      ]
    );
  };

  if (!visible) return null;

  if (!permission) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{t('Requesting Permission')}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Feather name="x" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.content}>
              <ActivityIndicator size="large" color="#059669" />
              <Text style={styles.permissionText}>{t('Requesting camera permission...')}</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{t('Camera Permission Required')}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Feather name="x" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.content}>
              <Feather name="camera-off" size={64} color="#ef4444" />
              <Text style={styles.permissionText}>
                {t('Camera permission is required to scan QR codes. Please enable it in your device settings.')}
              </Text>
              <TouchableOpacity style={styles.settingsButton} onPress={requestPermission}>
                <Text style={styles.settingsButtonText}>{t('Grant Permission')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.settingsButton, { backgroundColor: '#6b7280', marginTop: 10 }]} onPress={onClose}>
                <Text style={styles.settingsButtonText}>{t('Cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.scannerContainer}>
          <CameraView
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            facing="back"
            onMountError={(error) => {
              console.error('Camera mount error:', error);
            }}
          />
          
          {/* Overlay */}
          <View style={styles.overlayContainer}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{t('Scan QR Code')}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Feather name="x" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Scanning Area */}
            <View style={styles.scanningArea}>
              <View style={styles.scanningFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
            </View>

            {/* Instructions */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsText}>
                {t('Position the QR code within the frame to scan')}
              </Text>
              {isProcessing && (
                <View style={styles.processingContainer}>
                  <ActivityIndicator size="small" color="#059669" />
                  <Text style={styles.processingText}>{t('Processing...')}</Text>
                </View>
              )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
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
  scannerContainer: {
    width: width,
    height: height,
    position: 'relative',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  scanningArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#059669',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 50,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  processingText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  settingsButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
