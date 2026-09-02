// File: vendor-web/js/websocket.js

let stompClient = null;

function connectWebSocket() {
    // Determine Vendor ID (For simplicity in this SPA, we might subscribe to a generic topic or extract from UI/Token)
    // In Phase 3, we used: messagingTemplate.convertAndSend("/topic/vendor/" + vendor.getUserId(), response);
    // Let's assume vendor ID is 1 for testing if we can't extract it easily without a /me endpoint. 
    // Ideally, we fetch the vendor ID during login. We will just subscribe to ID 1 for demonstration,
    // or wildcard if the broker allows (Spring doesn't allow client wildcards by default).
    const vendorId = 1; // HARDCODED FOR SPA DEMO (in a real app, retrieve from API)

    const socket = new SockJS('http://localhost:8080/ws-canteen');
    stompClient = new window.StompJs.Client({
        webSocketFactory: () => socket,
        debug: function (str) {
            console.log(str);
        },
        onConnect: (frame) => {
            console.log('Connected: ' + frame);
            
            // Subscribe to Vendor's specific channel
            stompClient.subscribe(`/topic/vendor/${vendorId}`, (message) => {
                const order = JSON.parse(message.body);
                showToast(`New Order Received! #${order.id}`);
                
                // If we are on the dashboard tab, refresh it
                if (document.getElementById('tab-orders').classList.contains('hidden-section') === false) {
                    loadOrders();
                }
            });
        },
        onStompError: (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
        }
    });

    stompClient.activate();
}

function disconnectWebSocket() {
    if (stompClient !== null) {
        stompClient.deactivate();
    }
    console.log("Disconnected");
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden-section');
    setTimeout(() => {
        toast.classList.add('hidden-section');
    }, 3000);
}
