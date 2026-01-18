import React from 'react'
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { usePathname, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

interface TabItem {
  name: string
  icon: keyof typeof Feather.glyphMap
  route: string
  label: string
}

const tabs: TabItem[] = [
  {
    name: 'home',
    icon: 'home',
    route: '/(app)/home',
    label: 'Home',
  },
  {
    name: 'discover',
    icon: 'map-pin',
    route: '/(app)/discover',
    label: 'Discover',
  },
  {
    name: 'orders',
    icon: 'shopping-bag',
    route: '/(app)/orders',
    label: 'Orders',
  },
  {
    name: 'invoices',
    icon: 'file-text',
    route: '/(app)/invoices',
    label: 'Invoices',
  },
  {
    name: 'payments',
    icon: 'credit-card',
    route: '/(app)/payments',
    label: 'Payments',
  },
  {
    name: 'account',
    icon: 'user',
    route: '/(app)/account',
    label: 'Account',
  },
]

export default function BottomNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useTranslation()

  const isActive = (route: string) => {
    // Normalize paths for comparison
    const currentPath = pathname.replace(/\/$/, '').toLowerCase() // Remove trailing slash and normalize case
    const tabPath = route.replace(/\/$/, '').toLowerCase() // Remove trailing slash and normalize case
    
    // Extract the actual route name from the tab path (remove (app) group)
    const actualTabPath = tabPath.replace(/^\/\(app\)/, '') // Remove /(app) prefix
    
    // Check if current path matches the actual tab path
    const isActiveTab = currentPath === actualTabPath || currentPath.startsWith(actualTabPath + '/')
    
    console.log('BottomNav - Checking route:', { 
      pathname, 
      currentPath, 
      tabPath,
      actualTabPath,
      isActive: isActiveTab,
      startsWith: currentPath.startsWith(actualTabPath + '/')
    })
    
    return isActiveTab
  }

  const handleTabPress = (route: string) => {
    // If already on the same route, don't navigate
    if (isActive(route)) {
      console.log('Already on this route, not navigating')
      return
    }
    
    // Navigate to the route
    router.replace(route as any)
  }


  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.name}
          style={[styles.tab, isActive(tab.route) && styles.activeTab]}
          onPress={() => handleTabPress(tab.route)}
        >
          <Feather
            name={tab.icon}
            size={24}
            color="white"
          />
          {isActive(tab.route) && (
            <View style={styles.activeIndicator} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1A2A4F',
    borderRadius: 25,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    position: 'relative',
  },
  activeTab: {
    backgroundColor: '#48C6A8',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    display: 'none', // Hide text labels to match the design
  },
  activeTabLabel: {
    display: 'none', // Hide text labels to match the design
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
})
