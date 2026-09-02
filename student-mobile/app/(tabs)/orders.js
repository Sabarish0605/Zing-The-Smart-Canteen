// File: student-mobile/app/(tabs)/orders.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import api from '../../services/api';
import { useFocusEffect } from 'expo-router';

export default function OrdersScreen() {
    const [latestOrder, setLatestOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = async () => {
        try {
            const response = await api.get('/orders/my-orders');
            const orders = response.data;
            
            if (orders && orders.length > 0) {
                // Assuming backend sorts by ID/Date DESC, otherwise sort locally
                const sortedOrders = orders.sort((a, b) => b.id - a.id);
                setLatestOrder(sortedOrders[0]);
            } else {
                setLatestOrder(null);
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    if (!latestOrder) {
        return (
            <View style={styles.center}>
                <Text style={styles.emptyText}>You have no active tickets.</Text>
            </View>
        );
    }

    const isQRVisible = latestOrder.status === 'PAID' || latestOrder.status === 'PREPARING' || latestOrder.status === 'READY';

    return (
        <ScrollView 
            contentContainerStyle={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <View style={styles.ticketCard}>
                <View style={styles.header}>
                    <Text style={styles.orderId}>Order #{latestOrder.id}</Text>
                    <View style={[styles.statusBadge, getStatusStyle(latestOrder.status)]}>
                        <Text style={styles.statusText}>{latestOrder.status}</Text>
                    </View>
                </View>

                {isQRVisible ? (
                    <View style={styles.qrContainer}>
                        <Text style={styles.qrInstruction}>Show this QR code to the vendor for pickup</Text>
                        <View style={styles.qrWrapper}>
                            <QRCode
                                value={latestOrder.qrCodeHash || 'invalid'}
                                size={200}
                                color="#000"
                                backgroundColor="#fff"
                            />
                        </View>
                    </View>
                ) : (
                    <View style={styles.noQrContainer}>
                        <Text style={styles.noQrText}>
                            {latestOrder.status === 'COMPLETED' 
                                ? 'This order has been completed and picked up.' 
                                : 'QR Code will be available once paid.'}
                        </Text>
                    </View>
                )}

                <View style={styles.detailsContainer}>
                    <Text style={styles.detailsLabel}>Total Amount Paid:</Text>
                    <Text style={styles.detailsValue}>₹{latestOrder.totalAmount}</Text>
                </View>
            </View>
        </ScrollView>
    );
}

const getStatusStyle = (status) => {
    switch(status) {
        case 'PENDING': return { backgroundColor: '#fef3c7' };
        case 'PAID': return { backgroundColor: '#dbeafe' };
        case 'PREPARING': return { backgroundColor: '#ffedd5' };
        case 'READY': return { backgroundColor: '#d1fae5' };
        case 'COMPLETED': return { backgroundColor: '#f3f4f6' };
        default: return { backgroundColor: '#e5e7eb' };
    }
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#f9fafb',
        padding: 20,
        justifyContent: 'center',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        color: '#6b7280',
    },
    ticketCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 30,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    orderId: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        fontWeight: 'bold',
        fontSize: 12,
        color: '#374151',
    },
    qrContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    qrInstruction: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 20,
        textAlign: 'center',
    },
    qrWrapper: {
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    noQrContainer: {
        padding: 30,
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        marginBottom: 30,
        width: '100%',
        alignItems: 'center',
    },
    noQrText: {
        color: '#4b5563',
        fontSize: 16,
        textAlign: 'center',
    },
    detailsContainer: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        padding: 16,
        borderRadius: 12,
    },
    detailsLabel: {
        fontSize: 16,
        color: '#4b5563',
    },
    detailsValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#059669',
    }
});
