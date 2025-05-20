import React, { useRef, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Image, StyleSheet, Animated, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';

const SUGGESTIONS = [
  { id: 1, name: 'Coca Cola', image: 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c', },
  { id: 2, name: 'Lettuce', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836', },
  { id: 3, name: 'Beer', image: 'https://images.unsplash.com/photo-1514361892635-cebbd82b8bdf', },
  { id: 4, name: 'Water', image: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc', },
];

export default function OrderTrackingScreen() {
  const progressAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 4000,
      useNativeDriver: false,
    }).start();
  }, []);
  const width = Dimensions.get('window').width;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9d77a' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, justifyContent: 'space-between' }}>
          <TouchableOpacity>
            <Feather name="arrow-left" size={28} color="#222" />
          </TouchableOpacity>
          <TouchableOpacity style={{ backgroundColor: '#f6e7b2', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 6 }}>
            <Text style={{ color: '#10b981', fontWeight: 'bold' }}>Help</Text>
          </TouchableOpacity>
        </View>
        {/* Status */}
        <View style={{ alignItems: 'center', marginTop: 10 }}>
          <Image source={{ uri: 'https://img.icons8.com/fluency/96/000000/receipt-approved.png' }} style={{ width: 80, height: 80, marginBottom: 10 }} />
          <Text style={{ color: '#b48a00', fontWeight: 'bold', fontSize: 16 }}>Estimated Arrival</Text>
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#222', marginVertical: 2 }}>14:30 - 14:40</Text>
          <Text style={{ fontSize: 18, color: '#222', marginBottom: 8 }}>Your order <Text style={{ fontWeight: 'bold' }}>was sent to the store!</Text></Text>
          {/* Progress bar */}
          <View style={{ width: width * 0.7, height: 8, backgroundColor: '#f6e7b2', borderRadius: 4, marginTop: 8, marginBottom: 4, overflow: 'hidden' }}>
            <Animated.View style={{ height: 8, backgroundColor: '#fff', borderRadius: 4, width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['10%', '100%'] }) }} />
          </View>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14, marginTop: 2 }}>Accepting</Text>
        </View>
        {/* Complement your order */}
        <View style={{ backgroundColor: '#f6e7b2', marginTop: 30, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingTop: 18, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 8 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18 }}>Complement your order</Text>
            <TouchableOpacity>
              <Feather name="arrow-right" size={22} color="#10b981" />
            </TouchableOpacity>
          </View>
          <Text style={{ color: '#b48a00', marginLeft: 20, marginBottom: 8 }}>🥇 Free delivery • From Super Glovo</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 20 }}>
            {SUGGESTIONS.map((item) => (
              <View key={item.id} style={{ alignItems: 'center', marginRight: 18 }}>
                <Image source={{ uri: item.image }} style={{ width: 70, height: 70, borderRadius: 16, marginBottom: 6 }} />
                <TouchableOpacity style={{ backgroundColor: '#fff', borderRadius: 999, padding: 4, position: 'absolute', bottom: 10, right: 10 }}>
                  <Feather name="plus" size={18} color="#10b981" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
        {/* Order summary */}
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: 18, padding: 20 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>Your order</Text>
          <Text style={{ color: '#b48a00', fontWeight: 'bold', marginBottom: 8 }}>1 products from The Best Burger</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>1x</Text>
            <Text style={{ fontSize: 16, marginLeft: 8 }}>Cheeseburger</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 