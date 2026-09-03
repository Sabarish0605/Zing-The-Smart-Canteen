// File: student-mobile/app/(tabs)/orders.js
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import api from '../../services/api';
import { useFocusEffect } from 'expo-router';
import * as SecureStore from '../../services/storage';

export default function OrdersScreen() {
    const [latestOrder, setLatestOrder] = useState(null);
    const [pastOrders, setPastOrders] = useState([]);
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
                setPastOrders(sortedOrders.slice(1));
                
                // Cache active order for offline QR access
                await SecureStore.setItemAsync('cachedOrder', JSON.stringify(sortedOrders[0]));
            } else {
                setLatestOrder(null);
                setPastOrders([]);
                await SecureStore.deleteItemAsync('cachedOrder');
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            // Attempt to load from offline cache
            try {
                const cached = await SecureStore.getItemAsync('cachedOrder');
                if (cached) {
                    setLatestOrder(JSON.parse(cached));
                }
            } catch (cacheError) {
                console.error('Failed to load cache:', cacheError);
            }
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
                <ActivityIndicator size="large" color="#FF6B00" />
            </View>
        );
    }

    return (
        <ScrollView 
            contentContainerStyle={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FF6B00"]} />
            }
        >
            {!latestOrder ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>🎟️</Text>
                    <Text style={styles.emptyTitle}>No Active Tickets</Text>
                    <Text style={styles.emptySubtitle}>When you place an order, your QR ticket will appear here.</Text>
                </View>
            ) : (
                <>
                    <Text style={styles.sectionTitle}>Active Ticket</Text>
                    <View style={styles.ticketCard}>
                        <View style={styles.header}>
                            <Text style={styles.orderId}>Order #{latestOrder.id}</Text>
                            <View style={[styles.statusBadge, getStatusStyle(latestOrder.status)]}>
                                <Text style={styles.statusText}>{latestOrder.status}</Text>
                            </View>
                        </View>

                        {latestOrder.status === 'PAID' || latestOrder.status === 'PREPARING' || latestOrder.status === 'READY' ? (
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

                    {pastOrders.length > 0 && (
                        <View style={styles.pastOrdersContainer}>
                            <Text style={styles.sectionTitle}>Past Orders</Text>
                            {pastOrders.map((order) => (
                                <View key={order.id} style={styles.pastOrderCard}>
                                    <View>
                                        <Text style={styles.pastOrderId}>Order #{order.id}</Text>
                                        <Text style={styles.pastOrderAmount}>₹{order.totalAmount}</Text>
                                    </View>
                                    <View style={[styles.statusBadge, getStatusStyle(order.status)]}>
                                        <Text style={styles.statusText}>{order.status}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </>
            )}
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        marginTop: 60,
    },
    emptyIcon: {
        fontSize: 80,
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 10,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
        marginTop: 10,
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
    },
    pastOrdersContainer: {
        marginTop: 20,
        width: '100%',
    },
    pastOrderCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    pastOrderId: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    pastOrderAmount: {
        fontSize: 14,
        color: '#059669',
        fontWeight: '500',
    }
});
