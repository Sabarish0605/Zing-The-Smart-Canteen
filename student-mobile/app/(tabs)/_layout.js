// File: student-mobile/app/(tabs)/_layout.js
import React from 'react';
import { Tabs } from 'expo-router';
import { useCart } from '../../context/CartContext';
import { Text, View } from 'react-native';

export default function TabLayout() {
    const { cart } = useCart();
    
    // Simple logic to calculate total items in cart for the badge
    const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#4f46e5',
                headerStyle: {
                    backgroundColor: '#4f46e5',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            <Tabs.Screen
                name="menu"
                options={{
                    title: 'Menu',
                    tabBarLabel: 'Menu',
                    tabBarIcon: () => <Text style={{fontSize: 20}}>🍔</Text>,
                }}
            />
            <Tabs.Screen
                name="cart"
                options={{
                    title: 'Cart',
                    tabBarLabel: 'Cart',
                    tabBarIcon: () => (
                        <View>
                            <Text style={{fontSize: 20}}>🛒</Text>
                            {cartItemCount > 0 && (
                                <View style={{ position: 'absolute', right: -10, top: -5, backgroundColor: 'red', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}>
                                    <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>{cartItemCount}</Text>
                                </View>
                            )}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="orders"
                options={{
                    title: 'My Tickets',
                    tabBarLabel: 'Tickets',
                    tabBarIcon: () => <Text style={{fontSize: 20}}>🎟️</Text>,
                }}
            />
        </Tabs>
    );
}
