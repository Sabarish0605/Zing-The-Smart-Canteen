// File: student-mobile/app/(tabs)/cart.js
import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';
import { useRouter } from 'expo-router';

export default function CartScreen() {
    const { cart, removeFromCart, getTotal, clearCart, selectedVendorId } = useCart();
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handlePlaceOrder = async () => {
        if (cart.length === 0) {
            Toast.show({
                type: 'error',
                text1: 'Empty Cart',
                text2: 'Please add items to your cart first.',
                position: 'top',
                topOffset: 60,
            });
            return;
        }

        setLoading(true);

        // Map cart to backend OrderRequest DTO format
        const orderRequest = {
            vendorId: selectedVendorId,
            items: cart.map(item => ({
                menuItemId: item.id,
                quantity: item.quantity
            }))
        };

        try {
            // In a real app, Razorpay SDK would be invoked here, and upon success, this backend API is called.
            // For now, we simulate success and call the backend directly.
            const response = await api.post('/orders', orderRequest);
            
            Toast.show({
                type: 'success',
                text1: 'Order Placed!',
                text2: `Successfully placed order for ₹${response.data.totalAmount}`,
                position: 'top',
                topOffset: 60,
            });
            
            clearCart();
            router.push('/(tabs)/orders');
        } catch (error) {
            console.error('Order creation failed:', error);
            Toast.show({
                type: 'error',
                text1: 'Checkout Failed',
                text2: 'Failed to place order. Please try again.',
                position: 'top',
                topOffset: 60,
            });
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.cartItem}>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>₹{item.price} x {item.quantity}</Text>
            </View>
            <Text style={styles.itemTotal}>₹{item.price * item.quantity}</Text>
            <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>X</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {cart.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>🛒</Text>
                    <Text style={styles.emptyTitle}>Your cart is empty</Text>
                    <Text style={styles.emptySubtitle}>Explore the menu and add some delicious items.</Text>
                </View>
            ) : (
                <>
                    <FlatList
                        data={cart}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                    />
                    
                    <View style={styles.footer}>
                        <View style={styles.totalContainer}>
                            <Text style={styles.totalLabel}>Total Amount:</Text>
                            <Text style={styles.totalValue}>₹{getTotal()}</Text>
                        </View>
                        
                        <TouchableOpacity 
                            style={styles.checkoutBtn} 
                            onPress={handlePlaceOrder}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.checkoutBtnText}>Pay & Place Order</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
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
    list: {
        padding: 16,
    },
    cartItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 1,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    itemPrice: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    itemTotal: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#059669',
        marginHorizontal: 16,
    },
    removeBtn: {
        backgroundColor: '#fee2e2',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeBtnText: {
        color: '#ef4444',
        fontWeight: 'bold',
    },
    footer: {
        backgroundColor: '#fff',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    totalLabel: {
        fontSize: 18,
        color: '#374151',
    },
    totalValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    checkoutBtn: {
        backgroundColor: '#FF6B00',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    checkoutBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    }
});
