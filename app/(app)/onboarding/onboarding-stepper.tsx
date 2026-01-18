import React, { useState, useEffect, useRef } from 'react';
import { View, Image, Text, TextInput, TouchableOpacity, SafeAreaView, Alert, ScrollView, Dimensions, Modal, StyleSheet } from 'react-native';
import '../../../i18n'; // make sure i18n is initialized
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'expo-router';
import { useUpdateUserProfile } from '../../../services/user-service/user.query';
import { updateUserProfile } from '../../../services/user-service/user.service';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import Mapbox from '@rnmapbox/maps';
import * as SecureStore from 'expo-secure-store';
import Pin from '../../../assets/pin.svg';
import Constants from 'expo-constants';

const { width, height } = Dimensions.get('window');

async function getAddressFromCoords(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ar`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'YourAppName/1.0 (your@email.com)'
      }
    });
    const data = await response.json();
    if (data && data.display_name) {
      return data.display_name;
    }
  } catch (e) {}
  return "Unknown address";
}
export default function OnboardingStepper() {
  const { user, updateUser } = useAuth();
  const { mutate: updateUserProfile } = useUpdateUserProfile();

  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Map states (exact copy from checkout.tsx)
  const mapRef = useRef<Mapbox.MapView>(null);
  const modalMapRef = useRef<Mapbox.MapView>(null);
  const [tempModalRegion, setTempModalRegion] = useState<[number, number] | null>(null);
  const [mapRegion, setMapRegion] = useState<[number, number]>([10.16579, 36.81897]); // [longitude, latitude]
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isModalMapReady, setIsModalMapReady] = useState(false);
  const [mapKey, setMapKey] = useState(0); // Key to force remount when needed
  const [isMapboxInitialized, setIsMapboxInitialized] = useState(false);
  const [shouldRenderMap, setShouldRenderMap] = useState(false);
  const [mapEnabled, setMapEnabled] = useState(true); // Enable maps with safe rendering
  const [mapError, setMapError] = useState<string | null>(null);
  
  const router = useRouter();
  const { t } = useTranslation();

  // Retry map initialization (exact copy from checkout.tsx)
  const retryMapInitialization = () => {
    setMapError(null)
    setIsMapReady(false)
    setIsModalMapReady(false)
    setMapKey(prev => prev + 1) // Force remount
  }

  // Map initialization (exact copy from checkout.tsx)
  useEffect(() => {
    let isMounted = true
    
    const initializeMapbox = async () => {
      try {
        // Check if we're in production build
        const isProductionBuild = !__DEV__
        
        // Set Mapbox token for both development and production
        const token = Constants.expoConfig?.extra?.mapboxAccessToken || 'pk.eyJ1IjoieGdoYXNlMTQiLCJhIjoiY21mNDhxMXRxMDB3eTJrczRwZTR5dnlydSJ9.-iWoOkmS7QXZqhqwTMLAAA'
        if (token) {
          Mapbox.setAccessToken(token)
        }
        
        setIsMapboxInitialized(true)
        setMapError(null)
        
        // Longer delay for production builds to ensure plugin initialization
        const delay = isProductionBuild ? 2000 : 500
        
        setTimeout(() => {
          if (isMounted) {
            setShouldRenderMap(true)
          }
        }, delay)
      } catch (error) {
        if (isMounted) {
          setMapError('Failed to initialize Mapbox')
          console.error('Failed to initialize Mapbox:', error)
        }
      }
    }

    initializeMapbox()

    return () => {
      isMounted = false
    }
  }, [])

  // Get user location on mount (exact copy from checkout.tsx)
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') return

      const location = await Location.getCurrentPositionAsync({})
      const { latitude, longitude } = location.coords

      const region: [number, number] = [longitude, latitude] // [longitude, latitude] for Mapbox

      setMapRegion(region)
      const addr = await getAddressFromCoords(latitude, longitude)
      setLocation({
        lat: latitude,
        lng: longitude,
        address: addr
      })
    })()
  }, [])

  // Map modal effects (exact copy from checkout.tsx)
  useEffect(() => {
    if (mapModalVisible) {
      // Reset temp region when opening modal
      setTempModalRegion(null)
      
      // Ensure modal map shows the same region as main map
      // The camera will be set via the Camera component in the MapView
    }
  }, [mapModalVisible])

  // Cleanup effect to prevent memory leaks (exact copy from checkout.tsx)
  useEffect(() => {
    return () => {
      // Clean up map references when component unmounts
      if (mapRef.current) {
        mapRef.current = null
      }
      if (modalMapRef.current) {
        modalMapRef.current = null
      }
      setIsMapReady(false)
      setIsModalMapReady(false)
    }
  }, [])


  const handleProfileUpdate = async () => {
    if (!user) {
      Alert.alert(t('Error'), t('No user session found'));
      return;
    }

    const profileData = {
      firstName,
      lastName,
      profileImageUrl: profileImageUrl || undefined,
      isOnboarded: true,
      location: location || undefined,
    };

    try {
      setLoading(true);
      
      // Call the API to update the profile using the existing service
      const updatedUser = await updateUserProfile(profileData);
      console.log('Profile update API response:', updatedUser);
      
      // Update the user in context and persist to SecureStore
      await updateUser(profileData);
      console.log('User updated in context with data:', profileData);
      
      router.replace('/(app)/onboarding/onboarding-success');
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert(t('Error'), t('Failed to update profile'));
    } finally {
      setLoading(false);
    }
  };

  const validateStep = () => {
    if (step === 0) {
      let isValid = true;
      if (!firstName.trim()) {
        setFirstNameError(t('First name is required'));
        isValid = false;
      } else {
        setFirstNameError('');
      }
      if (!lastName.trim()) {
        setLastNameError(t('Last name is required'));
        isValid = false;
      } else {
        setLastNameError('');
      }
      return isValid;
    }
    if (step === 1) {
      // Profile picture step - optional, no validation needed
      return true;
    }
    if (step === 2) {
      if (!location) {
        setLocationError(t('Please select your location'));
        return false;
      }
      setLocationError('');
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (step === 2) {
        // Last step - submit the profile
        handleProfileUpdate();
      } else {
        setStep(step + 1);
      }
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleImagePicker = async () => {
    try {
      setLoading(true);

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('Permission Denied'), t('Camera roll permission is required to select a profile picture.'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        allowsEditing: true,
        quality: 1,
        exif: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const image = result.assets[0];

      if (!image.uri) {
        throw new Error('No image uri!');
      }

      // Upload to Supabase storage
      const arraybuffer = await fetch(image.uri).then((res) => res.arrayBuffer());
      const fileExt = image.uri?.split('.').pop()?.toLowerCase() ?? 'jpeg';
      const path = `profile-${Date.now()}.${fileExt}`;
      
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, arraybuffer, {
          contentType: image.mimeType ?? 'image/jpeg',
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      setProfileImageUrl(publicUrl);
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(t('Error'), error.message);
      } else {
        Alert.alert(t('Error'), t('Failed to upload image. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCamera = async () => {
    try {
      setLoading(true);

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('Permission Denied'), t('Camera permission is required to take a photo.'));
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
        exif: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const image = result.assets[0];

      if (!image.uri) {
        throw new Error('No image uri!');
      }

      // Upload to Supabase storage
      const arraybuffer = await fetch(image.uri).then((res) => res.arrayBuffer());
      const fileExt = image.uri?.split('.').pop()?.toLowerCase() ?? 'jpeg';
      const path = `profile-${Date.now()}.${fileExt}`;
      
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, arraybuffer, {
          contentType: image.mimeType ?? 'image/jpeg',
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      setProfileImageUrl(publicUrl);
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(t('Error'), error.message);
      } else {
        Alert.alert(t('Error'), t('Failed to upload image. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('Permission Denied'), t('Location permission is required to select your location.'));
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = currentLocation.coords;
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      if (reverseGeocode.length > 0) {
        const addr = reverseGeocode[0];
        const addressParts = [addr.street, addr.city, addr.region, addr.country].filter(Boolean);
        address = addressParts.join(', ') || address;
      }

      const locationData = {
        lat: latitude,
        lng: longitude,
        address: address,
      };

      setLocation(locationData);
      setMapRegion([longitude, latitude]); // [longitude, latitude] for Mapbox
      setLocationError('');
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(t('Error'), t('Failed to get your current location. Please try again.'));
    }
  };

  const handleManualLocation = () => {
    Alert.prompt(
      t('Enter Address'),
      t('Please enter your address manually:'),
      (text) => {
        if (text && text.trim()) {
          const locationData = {
            lat: 36.8065, // Default Tunis coordinates
            lng: 10.1815,
            address: text.trim(),
          };
          setLocation(locationData);
          setMapRegion([10.1815, 36.8065]); // [longitude, latitude] for Mapbox
          setLocationError('');
        }
      }
    );
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContainer}>
           
            <Text style={styles.stepTitle}>{t('Welcome to ShelfLink!')}</Text>
            <Text style={styles.stepSubtitle}>{t('Connect with trusted wholesalers and retailers across North Africa. Let\'s set up your business profile.')}</Text>
            <Text style={styles.stepInfoText}>
              {t('To get started, we need some basic information about you and your business. This will help us personalize your experience and connect you with the right partners.')}
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('First Name')}</Text>
              <TextInput
                style={[styles.textInput, firstNameError && styles.inputError]}
                placeholder={t('Enter your first name')}
                value={firstName}
                onChangeText={setFirstName}
                placeholderTextColor="#D1D5DB"
              />
              {firstNameError && <Text style={styles.errorText}>{firstNameError}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('Last Name')}</Text>
              <TextInput
                style={[styles.textInput, lastNameError && styles.inputError]}
                placeholder={t('Enter your last name')}
                value={lastName}
                onChangeText={setLastName}
                placeholderTextColor="#D1D5DB"
              />
              {lastNameError && <Text style={styles.errorText}>{lastNameError}</Text>}
            </View>
          </View>
        );
      
      case 1:
        return (
          <View style={styles.stepContainer}>
            {/* Skip button in top left */}
            <TouchableOpacity style={styles.skipButtonTopLeft} onPress={() => setStep(step + 1)}>
              <Text style={styles.skipButtonText}>{t('Skip for Now')}</Text>
            </TouchableOpacity>
            
            <Text style={styles.stepTitle}>{t('Add a profile picture')}</Text>
            <Text style={styles.stepSubtitle}>{t('Build trust with your business partners by adding a professional profile picture.')}</Text>
            
            {/* Image Preview - Moved above buttons */}
            <View style={styles.profileImageContainer}>
              {profileImageUrl ? (
                <Image 
                  source={{ uri: profileImageUrl }} 
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Text style={styles.profileImageIcon}>👤</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.instructionText}>{t('Upload a clear, professional photo (max 5MB)')}</Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.primaryButton, loading && styles.disabledButton]} 
                onPress={handleImagePicker}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? t('Uploading...') : t('Upload a Photo')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.secondaryButton, loading && styles.disabledButton]} 
                onPress={handleCamera}
                disabled={loading}
              >
                <Text style={styles.secondaryButtonText}>
                  {loading ? t('Uploading...') : t('Take a Photo')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{t('Set your business location')}</Text>
            <Text style={styles.stepSubtitle}>{t('Help us connect you with local suppliers and customers in your area.')}</Text>

            {/* MapView with marker and zoom controls (exact copy from checkout.tsx) */}
            <View style={styles.mapContainer}>
              {mapEnabled && mapRegion && isMapboxInitialized && shouldRenderMap && !mapError ? (
                <TouchableOpacity 
                  onPress={() => setMapModalVisible(true)} 
                  style={styles.mapTouchable}
                >
                  <Mapbox.MapView
                    key={`map-${mapKey}`}
                    ref={(ref) => {
                      if (ref) {
                        mapRef.current = ref
                      }
                    }}
                    style={styles.map}
                    styleURL={Mapbox.StyleURL.Street}
                    zoomEnabled={false}
                    scrollEnabled={false}
                    pitchEnabled={false}
                    rotateEnabled={false}
                    onDidFinishLoadingMap={() => {
                      console.log('Main map loaded successfully')
                      setIsMapReady(true)
                    }}
                    onDidFailLoadingMap={() => {
                      console.error('Main map failed to load')
                      setIsMapReady(false)
                      setMapError('Map failed to load')
                    }}
                  >
                    <Mapbox.Camera
                      centerCoordinate={mapRegion}
                      zoomLevel={15}
                      animationMode="none"
                    />
                    {isMapReady && (
                      <Mapbox.PointAnnotation
                        id="delivery-location"
                        coordinate={mapRegion}
                        title="Delivery Location"
                      >
                        <Mapbox.Callout title="Delivery Location" />
                      </Mapbox.PointAnnotation>
                    )}
                  </Mapbox.MapView>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  onPress={() => {
                    if (mapError) {
                      retryMapInitialization()
                    } else {
                      setMapModalVisible(true)
                    }
                  }} 
                  style={styles.mapFallback}
                >
                  <Feather name="map-pin" size={48} color="#48C6A8" style={{ marginBottom: 12 }} />
                  <Text style={styles.mapFallbackText}>
                    {location?.address || t('No location selected')}
                  </Text>
                  <Text style={styles.mapFallbackSubtext}>
                    {mapError ? t("Map error - tap to retry") : 
                     isMapboxInitialized && shouldRenderMap ? t("Loading map...") : t("Tap to change location")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Address selection (exact copy from checkout.tsx) */}
            <TouchableOpacity 
              onPress={() => setMapModalVisible(true)} 
              style={styles.addressSelector}
            >
              <Text style={styles.addressText}>{location?.address || t('No location selected')}</Text>
              <Feather name={'chevron-right'} size={18} color="rgba(255, 255, 255, 0.8)" style={{ marginLeft: 8 }} />
            </TouchableOpacity>

            {locationError && (
              <Text style={styles.errorText}>{locationError}</Text>
            )}
          </View>
        );
      
      default:
        return null;
    }
  };

  const getBackgroundGradient = (): [string, string] => {
    switch (step) {
      case 0:
        return ['#48C6A8', '#5DD6B8']; // Mint green gradient
      case 1:
        return ['#48C6A8', '#5DD6B8']; // Mint green gradient
      case 2:
        return ['#1A2A4F', '#48C6A8']; // Navy to mint gradient
      default:
        return ['#1A2A4F', '#2A3A5F'];
    }
  };

  return (
    <LinearGradient colors={getBackgroundGradient()} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Professional Header */}
        {/* <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../../assets/shelfLink-white.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View> */}
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {renderStepContent()}
        </ScrollView>

        <View style={styles.bottomContainer}>
          <View style={styles.navigationContainer}>
            {step > 0 && (
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Text style={styles.backButtonText}>{t('Back')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              disabled={loading}
              style={[styles.continueButton, loading && styles.disabledButton]}
              onPress={handleNext}
            >
              <Text style={styles.continueButtonText}>
                {loading ? t('Loading...') : step === 2 ? t('Finish') : t('Continue')}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Step indicator */}
          <View style={styles.stepIndicator}>
            {[0, 1, 2].map((s) => (
              <View
                key={s}
                style={[
                  styles.stepDot,
                  step === s && styles.activeStepDot
                ]}
              />
            ))}
          </View>
        </View>
      </SafeAreaView>

      {/* Map Modal for address selection (exact copy from checkout.tsx) */}
      <Modal visible={mapModalVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
          <View style={{ flex: 1 }}>
            {isMapboxInitialized && shouldRenderMap && !mapError ? (
              <Mapbox.MapView
                key={`modal-map-${mapKey + 1000}`}
                ref={(ref) => {
                  if (ref) {
                    modalMapRef.current = ref
                  }
                }}
                style={{ flex: 1 }}
                styleURL={Mapbox.StyleURL.Street}
                onCameraChanged={(state) => {
                  // Store changes temporarily without updating the main map yet
                  if (state.properties.center) {
                    setTempModalRegion([state.properties.center[0], state.properties.center[1]])
                  }
                }}
                onDidFinishLoadingMap={() => {
                  console.log('Modal map loaded successfully')
                  setIsModalMapReady(true)
                }}
                onDidFailLoadingMap={() => {
                  console.error('Modal map failed to load')
                  setIsModalMapReady(false)
                }}
              >
                <Mapbox.Camera
                  centerCoordinate={mapRegion}
                  zoomLevel={15}
                  animationMode="flyTo"
                  animationDuration={1000}
                />
              </Mapbox.MapView>
            ) : (
              <View style={{ flex: 1, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#6b7280', marginBottom: 16 }}>
                  {mapError ? t("Map error - please try again") : t("Loading map...")}
                </Text>
                {mapError && (
                  <TouchableOpacity
                    onPress={retryMapInitialization}
                    style={{
                      backgroundColor: '#48C6A8',
                      paddingHorizontal: 20,
                      paddingVertical: 10,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: '600' }}>
                      {t("Retry")}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            {/* Center pin */}
            <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: '45%', alignItems: 'center' }}>
              <Pin width={48} height={48} />
            </View>
            {/* Close */}
            <TouchableOpacity
              onPress={() => {
                setMapModalVisible(false)
                setTempModalRegion(null)
                // Force map remount to prevent view tag conflicts
                setMapKey(prev => prev + 1)
              }}
              style={{ position: 'absolute', top: 40, left: 20, backgroundColor: 'white', borderRadius: 20, padding: 8 }}
            >
              <Feather name="x" size={28} color="#222" />
            </TouchableOpacity>
            {/* Confirm */}
            <TouchableOpacity
              style={{ position: 'absolute', bottom: 40, left: 40, right: 40, backgroundColor: '#48C6A8', borderRadius: 999, paddingVertical: 16, alignItems: 'center' }}
              onPress={async () => {
                // Only update the main map region when user confirms
                if (tempModalRegion) {
                  setMapRegion(tempModalRegion)
                  const addr = await getAddressFromCoords(tempModalRegion[1], tempModalRegion[0]) // [longitude, latitude] -> [latitude, longitude]
                  setLocation({
                    lat: tempModalRegion[1],
                    lng: tempModalRegion[0],
                    address: addr
                  })
                }
                setMapModalVisible(false)
                setTempModalRegion(null)
                // Force map remount to prevent view tag conflicts
                setMapKey(prev => prev + 1)
              }}
            >
              <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>{t("Confirm location")}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 2,
    paddingTop: 2,
    paddingBottom: 0,
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    width: 256,
    height: 64,
    marginRight: 12,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    minHeight: height * 0.7,
  },
  imageContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  welcomeImage: {
    width: 200,
    height: 200,
  },
  profileImageContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'white',
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 3,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageIcon: {
    fontSize: 48,
    color: 'white',
  },
  locationContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 80,
  },
  stepTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 28,
    fontWeight: '400',
  },
  descriptionText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  stepInfoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  instructionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    color: 'white',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: 56,
  },
  inputError: {
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#fecaca',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  locationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 30,
  },
  locationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  addressContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#48C6A8',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#48C6A8',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    minHeight: 56,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minHeight: 56,
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipButtonTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  skipButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#1A2A4F',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#ff6b35',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    flex: 1,
    marginLeft: 12,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 6,
  },
  activeStepDot: {
    backgroundColor: '#48C6A8',
    width: 32,
    height: 8,
    borderRadius: 4,
  },
  // Map styles (exact copy from checkout.tsx)
  mapContainer: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden' as const,
    marginBottom: 12,
    width: '100%',
  },
  mapTouchable: {
    width: '100%',
    height: '100%',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: '#48C6A8',
    borderStyle: 'dashed' as const,
    borderRadius: 16,
  },
  mapFallbackText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
    marginBottom: 4,
  },
  mapFallbackSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center' as const,
  },
  addressSelector: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  addressText: {
    fontSize: 16,
    color: 'white',
    flex: 1,
  },
  disabledButton: {
    opacity: 0.6,
  },
});