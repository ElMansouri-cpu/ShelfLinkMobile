import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import * as Location from 'expo-location'
import { Alert } from 'react-native'

interface LocationData {
  lat: number
  lng: number
  address: string
}

interface LocationContextType {
  location: LocationData | null
  loading: boolean
  error: string | null
  refreshLocation: () => Promise<void>
}

const LocationContext = createContext<LocationContextType | undefined>(undefined)

interface LocationProviderProps {
  children: ReactNode
}

export function LocationProvider({ children }: LocationProviderProps) {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ar`
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ShelfLinkMobile/1.0 (contact@shelflink.com)'
        }
      })
      const data = await response.json()
      if (data && data.display_name) {
        return data.display_name
      }
    } catch (e) {
      console.error('Error getting address from coordinates:', e)
    }
    return "Unknown address"
  }

  const fetchLocation = async () => {
    try {
      setLoading(true)
      setError(null)

      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setError('Location permission denied')
        return
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      const { latitude, longitude } = currentLocation.coords
      const address = await getAddressFromCoords(latitude, longitude)

      setLocation({
        lat: latitude,
        lng: longitude,
        address: address
      })
    } catch (err) {
      console.error('Error fetching location:', err)
      setError('Failed to get location')
    } finally {
      setLoading(false)
    }
  }

  const refreshLocation = async () => {
    await fetchLocation()
  }

  useEffect(() => {
    fetchLocation()
  }, [])

  return (
    <LocationContext.Provider value={{ location, loading, error, refreshLocation }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const context = useContext(LocationContext)
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider')
  }
  return context
}
