import React from 'react'
import { View, Text, TouchableOpacity, StatusBar, Animated } from 'react-native'
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
const Header = ({ title, onBack, onSearch, scrollY, opacity, clearCart, onSave }: {
  title: string,
  onBack?: () => void,
  onSearch?: () => void,
  scrollY: Animated.Value,
  clearCart?: () => void,
  opacity?: any,
  onSave?: () => void
}) => {
  const { t } = useTranslation();

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

  return (
    <View>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: 'white',
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
          <TouchableOpacity    style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "#f3f4f6",
                alignItems: "center",
                justifyContent: "center",
              }} onPress={() => { onBack && onBack(); }}>
            <Feather name="arrow-left" size={22} color="#111" />
          </TouchableOpacity>

          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111' }}>
            {t(title)}
          </Text>

          {clearCart && (
            <TouchableOpacity onPress={clearCart}>
              <Text style={{ color: '#ef4444', fontSize: 22, fontWeight: 'medium' }}>{t("Clear")}</Text>
            </TouchableOpacity>
          )}
          {onSave && (
               <TouchableOpacity onPress={()=>{onSave && onSave()}}>
               <Text className="text-[#00A67E] font-medium">Save</Text>
             </TouchableOpacity>
          )}

          {onSearch ? (
            <TouchableOpacity style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#f3f4f6",
              alignItems: "center",
              justifyContent: "center",
            }} onPress={onSearch}>
              <Feather name="search" size={22} color="#111" />
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