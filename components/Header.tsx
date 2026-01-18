import React from 'react'
import { View, Text, TouchableOpacity, StatusBar, Animated } from 'react-native'
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useRouter } from 'expo-router';

const Header = ({ title, onBack, onSearch, scrollY, opacity, clearCart, onSave, showBackButton = true }: {
  title: string,
  onBack?: () => void,
  onSearch?: () => void,
  scrollY?: Animated.Value,
  clearCart?: () => void,
  opacity?: any,
  onSave?: () => void,
  showBackButton?: boolean
}) => {
  const { t } = useTranslation();
  const router = useRouter();

  const headerOpacity = scrollY ? scrollY.interpolate({
    inputRange: [0, 20],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  }) : new Animated.Value(1);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View>
      <StatusBar barStyle="light-content" backgroundColor="#1A2A4F" />
      <Animated.View
        style={{
          backgroundColor: '#1A2A4F',
          zIndex: 10,
          opacity: opacity ? opacity : headerOpacity,
          paddingTop: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#f3f4f6'
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            height: 56
          }}
        >
          {showBackButton && (
            <TouchableOpacity style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                }} onPress={handleBack}>
              <Feather name="arrow-left" size={22} color="white" />
            </TouchableOpacity>
          )}
          {!showBackButton && (
            <View style={{ width: 40 }} />
          )}

          <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>
            {t(title)}
          </Text>

          {clearCart && (
            <TouchableOpacity onPress={clearCart}>
              <Text style={{ color: '#ef4444', fontSize: 22, fontWeight: 'medium' }}>{t("Clear")}</Text>
            </TouchableOpacity>
          )}
          {onSave && (
               <TouchableOpacity onPress={()=>{onSave && onSave()}}>
               <Text style={{ color: '#48C6A8', fontSize: 16, fontWeight: 'medium' }}>Save</Text>
             </TouchableOpacity>
          )}

          {onSearch ? (
            <TouchableOpacity style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              alignItems: "center",
              justifyContent: "center",
            }} onPress={onSearch}>
              <Feather name="search" size={22} color="white" />
            </TouchableOpacity>
          ) : !clearCart && !onSave && (
            <View style={{ width: 24 }} />
          )}

        </View>
      </Animated.View>


    </View>
  )
}

export default Header