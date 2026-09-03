import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
    const router = useRouter();

    const handleLogout = async () => {
        await SecureStore.deleteItemAsync('studentToken');
        router.replace('/');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>👤</Text>
                </View>
                <Text style={styles.name}>Student User</Text>
                <Text style={styles.role}>Registered Zing User</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Account Details</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Status:</Text>
                    <Text style={styles.value}>Active</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Role:</Text>
                    <Text style={styles.value}>Student</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
        padding: 20,
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginVertical: 40,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        backgroundColor: '#FF6B00',
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    avatarText: {
        fontSize: 50,
        color: '#fff',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    role: {
        fontSize: 16,
        color: '#6b7280',
        marginTop: 4,
    },
    card: {
        backgroundColor: '#fff',
        width: '100%',
        borderRadius: 16,
        padding: 20,
        marginBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        paddingBottom: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    label: {
        fontSize: 16,
        color: '#6b7280',
    },
    value: {
        fontSize: 16,
        fontWeight: '500',
        color: '#374151',
    },
    logoutButton: {
        backgroundColor: '#ef4444', // Red for logout
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    logoutText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
