import { create } from 'zustand';
import { Alert } from 'react-native';
import api from '../services/api';

export const useStore = create((set, get) => ({
  // --- Cart State ---
  cart: [],
  selectedVendorId: null,

  addToCart: (item) => {
    const { selectedVendorId, cart } = get();
    
    if (selectedVendorId && selectedVendorId !== item.vendorId) {
      Alert.alert("Vendor Mismatch", "You can only order from one vendor at a time. Please clear your cart first.");
      return;
    }

    set({ selectedVendorId: item.vendorId });

    const existingItem = cart.find(i => i.id === item.id);
    if (existingItem) {
      set({ cart: cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) });
    } else {
      set({ cart: [...cart, { ...item, quantity: 1 }] });
    }
  },

  removeFromCart: (itemId) => {
    const { cart } = get();
    const updatedCart = cart.filter(i => i.id !== itemId);
    
    set({
      cart: updatedCart,
      selectedVendorId: updatedCart.length === 0 ? null : get().selectedVendorId
    });
  },

  clearCart: () => {
    set({ cart: [], selectedVendorId: null });
  },

  getTotal: () => {
    return get().cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  },

  // --- Menu State (Caching) ---
  menuData: [],
  menuLoading: false,
  menuError: null,

  setMenuLoading: (loading) => set({ menuLoading: loading }),
  setMenuData: (data) => set({ menuData: data, menuError: null }),
  setMenuError: (error) => set({ menuError: error }),
  
  fetchMenu: async () => {
    set({ menuLoading: true });
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
      
      set({ menuData: sections, menuError: null });
    } catch (error) {
      console.error('Failed to fetch menu:', error);
      set({ menuError: error });
    } finally {
      set({ menuLoading: false });
    }
  }
}));
