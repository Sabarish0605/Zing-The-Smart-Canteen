// File: student-mobile/app/_layout.js
import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { CartProvider } from '../context/CartContext';
import Toast from 'react-native-toast-message';

export default function RootLayout() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        const checkToken = async () => {
            try {
                const token = await SecureStore.getItemAsync('studentToken');
                setIsAuthenticated(!!token);
            } catch (error) {
                setIsAuthenticated(false);
            } finally {
                setIsReady(true);
            }
        };
        checkToken();
    }, []);

    useEffect(() => {
        if (!isReady) return;

        const inAuthGroup = segments[0] === '(tabs)';

        if (!isAuthenticated && inAuthGroup) {
            router.replace('/');
        } else if (isAuthenticated && (segments.length === 0 || segments[0] === 'index')) {
            router.replace('/(tabs)/menu');
        }
    }, [isAuthenticated, isReady, segments]);

    if (!isReady) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FF6B00' }}>
                <Text style={{ fontSize: 48, fontWeight: '900', color: '#ffffff', marginBottom: 20 }}>Zing</Text>
                <ActivityIndicator size="large" color="#ffffff" />
            </View>
        );
    }

    return (
        <>
            <CartProvider>
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="register" />
                </Stack>
            </CartProvider>
            <Toast />
        </>
    );
}
