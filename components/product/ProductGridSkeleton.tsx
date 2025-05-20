import React from 'react'
import { View } from "react-native"
import ProductCardSkeleton from './ProductCardSkeleton'

const ProductGridSkeleton = () => {
    return (
      <View style={{ flex: 1, paddingTop: 16 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: "white",
            borderRadius: 12,
            marginHorizontal: 16,
            marginBottom: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 5,
            elevation: 1,
          }}
        >
          <View style={{ width: 80, height: 16, backgroundColor: "#f3f4f6", borderRadius: 4 }} />
          <View style={{ width: 60, height: 16, backgroundColor: "#f3f4f6", borderRadius: 4 }} />
        </View>
  
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            paddingHorizontal: 16,
          }}
        >
          {Array(6)
            .fill(0)
            .map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
        </View>
      </View>
    )
  }

export default ProductGridSkeleton