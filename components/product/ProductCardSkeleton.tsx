

import React, { useEffect, useRef } from 'react'
import { View, Animated, Dimensions } from "react-native"

const ProductCardSkeleton = () => {
    const { width } = Dimensions.get("window")

    const PRODUCT_CARD_WIDTH = (width - 48) / 2
    const PRODUCT_CARD_HEIGHT = 220

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
        <View
            style={{
                width: PRODUCT_CARD_WIDTH,
                height: PRODUCT_CARD_HEIGHT,
                marginBottom: 16,
                borderRadius: 16,
                backgroundColor: "white",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
                padding: 12,
            }}
        >
            <Animated.View
                style={{
                    height: 120,
                    backgroundColor: bgColor,
                    borderRadius: 8,
                    marginBottom: 12,
                }}
            />
            <Animated.View
                style={{
                    height: 16,
                    width: "80%",
                    backgroundColor: bgColor,
                    borderRadius: 4,
                    marginBottom: 8,
                }}
            />
            <Animated.View
                style={{
                    height: 16,
                    width: "60%",
                    backgroundColor: bgColor,
                    borderRadius: 4,
                    marginBottom: 16,
                }}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Animated.View
                    style={{
                        height: 20,
                        width: 60,
                        backgroundColor: bgColor,
                        borderRadius: 4,
                    }}
                />
                <Animated.View
                    style={{
                        height: 32,
                        width: 32,
                        backgroundColor: bgColor,
                        borderRadius: 16,
                    }}
                />
            </View>
        </View>
    )
}

export default ProductCardSkeleton