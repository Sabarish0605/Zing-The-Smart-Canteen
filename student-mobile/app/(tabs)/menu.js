// File: student-mobile/app/(tabs)/menu.js
import React, { useState, useEffect } from 'react';
import { View, Text, SectionList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';

export default function MenuScreen() {
    const [menuSections, setMenuSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { addToCart } = useCart();

    useEffect(() => {
        fetchMenu();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchMenu();
    };

    const fetchMenu = async () => {
        try {
            const response = await api.get('/menu');
            const items = response.data;

            const grouped = items.reduce((acc, item) => {
                const vendorKey = item.vendorId ? `Vendor #${item.vendorId}` : 'Other';
                if (!acc[vendorKey]) acc[vendorKey] = [];
                acc[vendorKey].push(item);
                return acc;
            }, {});

            const sections = Object.keys(grouped).map(key => ({
                title: key,
                data: grouped[key]
            }));

            setMenuSections(sections);
        } catch (error) {
            console.error('Failed to fetch menu:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleAddToCart = (item) => {
        addToCart(item);
        Toast.show({
            type: 'success',
            text1: 'Added to Cart',
            text2: `${item.name} added successfully.`,
            position: 'top',
            visibilityTime: 2000,
            topOffset: 60,
        });
    };

    const IMAGE_BASE_URL = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : 'https://zing-canteen-backend.onrender.com';

    const getImageUrl = (url) => {
        if (!url) return null;
        return url.startsWith('http') ? url : `${IMAGE_BASE_URL}${url}`;
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            {getImageUrl(item.imageUrl) ? (
                <Image source={{ uri: getImageUrl(item.imageUrl) }} style={styles.image} />
            ) : (
                <View style={[styles.image, styles.placeholderImage]}>
                    <Text style={styles.placeholderText}>No Image</Text>
                </View>
            )}
            
            <View style={styles.infoContainer}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.price}>₹{item.price}</Text>
                <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => handleAddToCart(item)}
                >
                    <Text style={styles.addButtonText}>Add to Cart</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#FF6B00" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <SectionList
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FF6B00"]} />}
                sections={menuSections}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                renderSectionHeader={({ section: { title } }) => (
                    <Text style={styles.sectionHeader}>{title}</Text>
                )}
                contentContainerStyle={styles.list}
                stickySectionHeadersEnabled={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: 16,
    },
    sectionHeader: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FF6B00',
        backgroundColor: '#f9fafb',
        paddingVertical: 10,
        marginBottom: 10,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
        flexDirection: 'row',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    image: {
        width: 100,
        height: 100,
    },
    placeholderImage: {
        backgroundColor: '#e5e7eb',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#9ca3af',
        fontSize: 12,
    },
    infoContainer: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    price: {
        fontSize: 16,
        color: '#059669',
        fontWeight: 'bold',
        marginTop: 4,
    },
    addButton: {
        backgroundColor: '#FF6B00',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginTop: 8,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    }
});
