import { Client } from '@stomp/stompjs';
import 'text-encoding'; // Required for React Native Stomp JS compatibility
import Toast from 'react-native-toast-message';
import { useStore } from '../store/useStore';

// Note: Ensure the URL starts with wss:// for secure WebSockets or ws:// for local
const WS_URL = 'wss://zing-canteen-backend.onrender.com/ws-canteen';

class WebSocketService {
    constructor() {
        this.client = null;
    }

    connect(studentId) {
        if (this.client && this.client.active) {
            return;
        }

        this.client = new Client({
            brokerURL: WS_URL,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log('Connected to WebSocket');

                // Subscribe to Global Menu Updates
                this.client.subscribe('/topic/menu', (message) => {
                    console.log('Menu update received:', message.body);
                    // Background refresh of the menu
                    useStore.getState().fetchMenu();
                });

                // Subscribe to Student's personal Order Updates
                if (studentId) {
                    this.client.subscribe(`/topic/student/${studentId}`, (message) => {
                        const order = JSON.parse(message.body);
                        if (order.status === 'COMPLETED') {
                            Toast.show({
                                type: 'success',
                                text1: 'Order Ready! 🎉',
                                text2: `Your order #${order.id} is ready for pickup!`,
                                position: 'top',
                                visibilityTime: 5000,
                                topOffset: 60,
                            });
                        } else {
                            Toast.show({
                                type: 'info',
                                text1: 'Order Update',
                                text2: `Order #${order.id} is now ${order.status}`,
                                position: 'top',
                                visibilityTime: 4000,
                                topOffset: 60,
                            });
                        }
                    });
                }
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            },
            onWebSocketError: (error) => {
                console.error('WebSocket Error:', error);
            }
        });

        // Activate connection
        this.client.activate();
    }

    disconnect() {
        if (this.client) {
            this.client.deactivate();
            this.client = null;
            console.log('Disconnected from WebSocket');
        }
    }
}

const websocketService = new WebSocketService();
export default websocketService;
