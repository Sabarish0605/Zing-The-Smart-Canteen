// File: vendor-web/js/app.js

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    // Login Form Submission
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');
        
        try {
            await api.login(email, password);
            errorDiv.classList.add('hidden-section');
            checkAuth();
        } catch (error) {
            errorDiv.textContent = 'Invalid credentials. Please try again.';
            errorDiv.classList.remove('hidden-section');
        }
    });

    // Menu Form Submission (Multipart)
    document.getElementById('menuForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('menuName').value;
        const price = document.getElementById('menuPrice').value;
        const isAvailable = document.getElementById('menuAvailable').checked;
        const imageFile = document.getElementById('menuImage').files[0];

        const formData = new FormData();
        
        // Match the backend DTO structure: @RequestPart("item") MenuItemDto dto
        const itemDto = {
            name: name,
            price: parseFloat(price),
            isAvailable: isAvailable
        };
        
        formData.append('item', new Blob([JSON.stringify(itemDto)], {
            type: "application/json"
        }));

        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            await api.createMenuItem(formData);
            showToast("Menu Item Added!");
            toggleMenuModal(false);
            loadMenu();
        } catch (error) {
            alert('Failed to add menu item.');
        }
    });
});

function checkAuth() {
    const token = localStorage.getItem('vendorToken');
    if (token) {
        document.getElementById('loginSection').classList.add('hidden-section');
        document.getElementById('dashboardSection').classList.remove('hidden-section');
        connectWebSocket();
        switchTab('orders');
    } else {
        document.getElementById('loginSection').classList.remove('hidden-section');
        document.getElementById('dashboardSection').classList.add('hidden-section');
    }
}

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden-section'));
    
    // Reset nav styling
    document.querySelectorAll('aside nav a').forEach(el => {
        el.classList.remove('bg-indigo-900');
    });

    // Show selected tab
    document.getElementById(`tab-${tabName}`).classList.remove('hidden-section');
    document.getElementById(`nav-${tabName}`).classList.add('bg-indigo-900');

    // Handle Tab Specific Logic
    stopScanner(); // Stop scanner if moving away from it

    if (tabName === 'orders') {
        loadOrders();
    } else if (tabName === 'menu') {
        loadMenu();
    } else if (tabName === 'scanner') {
        initScanner();
    }
}

async function loadOrders() {
    try {
        const orders = await api.getActiveOrders();
        const container = document.getElementById('ordersList');
        
        if (orders.length === 0) {
            container.innerHTML = `<div class="col-span-full text-gray-500 text-center py-8">No active orders right now.</div>`;
            return;
        }

        container.innerHTML = orders.map(order => `
            <div class="bg-white p-6 rounded-lg shadow border-l-4 ${getStatusColor(order.status)}">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-xl font-bold">Order #${order.id}</h3>
                    <span class="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100">${order.status}</span>
                </div>
                <div class="text-gray-600 mb-4">
                    Amount: <span class="font-bold text-gray-900">₹${order.totalAmount}</span>
                </div>
                <div class="text-sm text-gray-500">
                    Items: ${order.items.length} (Details hidden for brevity)
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error("Failed to load orders", error);
    }
}

function getStatusColor(status) {
    switch(status) {
        case 'PENDING': return 'border-yellow-500';
        case 'PAID': return 'border-blue-500';
        case 'PREPARING': return 'border-orange-500';
        case 'READY': return 'border-green-500';
        case 'COMPLETED': return 'border-gray-500';
        default: return 'border-gray-300';
    }
}

async function loadMenu() {
    try {
        const items = await api.getMyMenu();
        const tbody = document.getElementById('menuList');
        
        tbody.innerHTML = items.map(item => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${item.imageUrl 
                        ? `<img src="http://localhost:8080${item.imageUrl}" class="h-10 w-10 rounded-full object-cover">` 
                        : `<div class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">No Img</div>`}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹${item.price}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${item.isAvailable ? 'Available' : 'Out of Stock'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="deleteMenuItem(${item.id})" class="text-red-600 hover:text-red-900">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error("Failed to load menu", error);
    }
}

async function deleteMenuItem(id) {
    if (confirm("Are you sure you want to delete this item?")) {
        try {
            await api.deleteMenuItem(id);
            showToast("Menu Item Deleted");
            loadMenu();
        } catch (error) {
            alert("Failed to delete item.");
        }
    }
}

function toggleMenuModal(show) {
    const modal = document.getElementById('menuModal');
    if (show) {
        document.getElementById('menuForm').reset();
        modal.classList.remove('hidden-section');
    } else {
        modal.classList.add('hidden-section');
    }
}
