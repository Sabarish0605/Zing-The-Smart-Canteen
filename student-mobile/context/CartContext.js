// File: student-mobile/context/CartContext.js
import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    
    // Vendor selection logic (orders must be from same vendor)
    const [selectedVendorId, setSelectedVendorId] = useState(null);

    const addToCart = (item) => {
        if (selectedVendorId && selectedVendorId !== item.vendorId) {
            alert("You can only order from one vendor at a time. Please clear your cart first.");
            return;
        }

        setSelectedVendorId(item.vendorId);

        setCart((prevCart) => {
            const existingItem = prevCart.find(i => i.id === item.id);
            if (existingItem) {
                return prevCart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prevCart, { ...item, quantity: 1 }];
        });
    };

    const removeFromCart = (itemId) => {
        setCart((prevCart) => {
            const updatedCart = prevCart.filter(i => i.id !== itemId);
            if (updatedCart.length === 0) {
                setSelectedVendorId(null);
            }
            return updatedCart;
        });
    };

    const clearCart = () => {
        setCart([]);
        setSelectedVendorId(null);
    };

    const getTotal = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, getTotal, selectedVendorId }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
