// File: student-mobile/app/register.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

export default function RegisterScreen() {
    const [name, setName] = useState('');
    const [rollNumber, setRollNumber] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async () => {
        if (!name || !rollNumber || !email || !password) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/register', { 
                name, 
                rollNumber, 
                email, 
                password,
                role: 'STUDENT'
            });
            await SecureStore.setItemAsync('studentToken', response.data.token);
            router.replace('/(tabs)/menu');
        } catch (error) {
            console.error(error);
            Alert.alert('Registration Failed', 'Email or Roll Number might already be in use.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Zing Canteen</Text>
            <Text style={styles.subtitle}>Create Student Account</Text>
            
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    value={name}
                    onChangeText={setName}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Roll Number"
                    value={rollNumber}
                    onChangeText={setRollNumber}
                    autoCapitalize="characters"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>

            <TouchableOpacity 
                style={styles.button} 
                onPress={handleRegister}
                disabled={loading}
            >
                <Text style={styles.buttonText}>{loading ? 'Creating Account...' : 'Sign Up'}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.linkButton} 
                onPress={() => router.back()}
            >
                <Text style={styles.linkText}>Already have an account? Log In</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#f9fafb',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#4f46e5',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        color: '#6b7280',
        marginBottom: 40,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 20,
    },
    input: {
        backgroundColor: '#ffffff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        fontSize: 16,
    },
    button: {
        backgroundColor: '#10b981',
        width: '100%',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 20,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    linkButton: {
        padding: 10,
    },
    linkText: {
        color: '#4f46e5',
        fontSize: 16,
        fontWeight: '500',
    }
});
