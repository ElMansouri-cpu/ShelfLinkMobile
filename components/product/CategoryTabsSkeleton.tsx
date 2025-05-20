import React, { useEffect, useRef } from 'react'
import {  Animated, ScrollView } from "react-native"

const CategoryTabsSkeleton = () => {
    const pulseAnim = useRef(new Animated.Value(0)).current
  
    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: false,
          }),
        ]),
      ).start()
    }, [])
  
    const bgColor = pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["#f3f4f6", "#f9fafb"],
    })
  
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
        {Array(5)
          .fill(0)
          .map((_, index) => (
            <Animated.View
              key={index}
              style={{
                marginRight: 12,
                backgroundColor: bgColor,
                borderRadius: 12,
                padding: 12,
                flexDirection: "row",
                alignItems: "center",
                width: 120,
                height: 48,
              }}
            />
          ))}
      </ScrollView>
    )
  }

export default CategoryTabsSkeleton