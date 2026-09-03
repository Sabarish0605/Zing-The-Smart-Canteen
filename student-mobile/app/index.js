// File: student-mobile/app/index.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const router = useRouter();

    useEffect(() => {
        checkToken();
    }, []);

    const checkToken = async () => {
        const token = await SecureStore.getItemAsync('studentToken');
        if (token) {
            router.replace('/(tabs)/menu');
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        
        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            const response = await api.post('/auth/login', { email, password });
            await SecureStore.setItemAsync('studentToken', response.data.token);
            router.replace('/(tabs)/menu');
        } catch (error) {
            setErrors({ general: 'Invalid email or password' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Zing Canteen</Text>
            <Text style={styles.subtitle}>Student Login</Text>
            
            <View style={styles.inputContainer}>
                <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="Email"
                    value={email}
                    onChangeText={(text) => { setEmail(text); setErrors(prev => ({...prev, email: '', general: ''})) }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
                
                <TextInput
                    style={[styles.input, errors.password && styles.inputError]}
                    placeholder="Password"
                    value={password}
                    onChangeText={(text) => { setPassword(text); setErrors(prev => ({...prev, password: '', general: ''})) }}
                    secureTextEntry
                />
                {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
                
                {errors.general ? <Text style={[styles.errorText, {textAlign: 'center', marginTop: 10, fontSize: 14}]}>{errors.general}</Text> : null}
            </View>

            <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]} 
                onPress={handleLogin}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#ffffff" />
                ) : (
                    <Text style={styles.buttonText}>Log In</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.linkButton} 
                onPress={() => router.push('/register')}
                disabled={loading}
            >
                <Text style={styles.linkText}>New here? Create an account</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FF6B00',
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
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        fontSize: 16,
    },
    inputError: {
        borderColor: '#ef4444',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 12,
        marginBottom: 12,
        marginLeft: 4,
    },
    button: {
        backgroundColor: '#FF6B00',
        width: '100%',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    linkButton: {
        marginTop: 20,
        padding: 10,
    },
    linkText: {
        color: '#FF6B00',
        fontSize: 16,
        fontWeight: '500',
    }
});
