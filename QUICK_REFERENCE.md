# 🚀 Quick Reference Guide

## Getting Started (3 Simple Steps)

### 1️⃣ Install Dependencies
```bash
cd canteen-system/backend
npm install
```

### 2️⃣ Start Server
```bash
npm start
```

### 3️⃣ Open Apps
- **Student App**: Open `student-app/index.html` in browser
- **Vendor Dashboard**: Open `vendor-dashboard/index.html` in browser

## 🔑 Login Credentials

| App | Email | Password |
|-----|-------|----------|
| Student | student@canteen.com | student123 |
| Vendor | vendor@canteen.com | vendor123 |

## 📱 Student App Flow

```
1. Login/Signup
2. Browse Menu (with live stock)
3. Add items to Cart
4. Proceed to Payment
5. Payment Success ✅
6. QR Code Generated 📱
7. Show QR to Vendor
8. Get Food! 🍜
```

## 🏪 Vendor Dashboard Flow

```
1. Login
2. QR Scanner Active 📷
3. Student Shows QR
4. Order Appears (BIG TEXT)
5. Prepare Food 🍳
6. Press SPACEBAR ⌨️
7. Order Complete ✅
8. Back to Scanning
```

## ⌨️ Keyboard Shortcuts

### Vendor Dashboard
- **SPACEBAR** - Complete current scanned order (only when order is visible)

## 📊 Main Features Checklist

### Student App ✅
- [x] Email/Password authentication
- [x] Google-like avatars
- [x] Live menu with categories
- [x] Real-time stock updates
- [x] Shopping cart with +/- controls
- [x] Payment simulation
- [x] QR code generation
- [x] Active orders tab
- [x] Completed orders history
- [x] Persistent QR codes
- [x] Auto-login on restart

### Vendor Dashboard ✅
- [x] Vendor authentication
- [x] Live webcam QR scanner
- [x] Spacebar to complete orders
- [x] Large order display
- [x] Add/Edit/Delete menu items
- [x] Stock management
- [x] Low stock alerts (auto-refresh)
- [x] Real-time inventory sync
- [x] Category-based organization

## 🎨 UI Themes

### Student App
- **Primary**: Orange (#FF6B35)
- **Secondary**: Golden Orange (#F7931E)
- **Accent**: Yellow (#FFD23F)
- **Vibe**: Warm, welcoming, food-focused
- **Fonts**: Righteous + Poppins

### Vendor Dashboard
- **Primary**: Red (#e74c3c)
- **Background**: Dark Blue-Gray (#1a1a2e)
- **Accent**: Orange (#f39c12)
- **Vibe**: Professional, industrial, efficient
- **Fonts**: Righteous + Poppins

## 🔧 Common Tasks

### Add a Menu Item
1. Vendor Dashboard → Inventory tab
2. Click "➕ Add New Item"
3. Fill details (name, price, stock, emoji, etc.)
4. Click "Save Item"

### Edit Stock Quantity
1. Click ✏️ on item card
2. Change stock value
3. Save

### Check Low Stock
- Automatically shown in sidebar
- Updates every 5 seconds
- Red alert when stock ≤ threshold

### View Order QR Code (Student)
1. Active Orders tab
2. Click "View QR Code" on any order
3. QR modal appears

### Complete an Order (Vendor)
1. Student shows QR
2. Scanner reads it automatically
3. Order displays
4. Press SPACEBAR
5. Done!

## 📁 Project Structure

```
canteen-system/
├── backend/
│   ├── server.js          # Express server
│   ├── database.js        # SQLite setup
│   ├── package.json       # Dependencies
│   └── canteen.db         # Database (auto-created)
├── student-app/
│   └── index.html         # Student interface
├── vendor-dashboard/
│   └── index.html         # Vendor interface
├── README.md              # Full documentation
├── QUICK_REFERENCE.md     # This file
└── start.sh / start.bat   # Quick start scripts
```

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "Cannot connect to server" | Start backend: `cd backend && npm start` |
| Camera not working | Grant permissions, use Chrome |
| Port 3001 in use | Change PORT in server.js |
| Database errors | Delete canteen.db, restart |
| Order not syncing | Refresh both apps |
| QR not scanning | Check camera permissions |

## 📡 API Endpoints Quick List

### Public
- `GET /api/menu` - All menu items

### Student (requires token)
- `POST /api/auth/login` - Login
- `POST /api/auth/signup` - Signup
- `POST /api/orders` - Create order
- `GET /api/orders/my-orders` - Get orders
- `GET /api/orders/:id` - Order details

### Vendor (requires token)
- `POST /api/vendor/login` - Vendor login
- `POST /api/menu` - Add item
- `PUT /api/menu/:id` - Update item
- `DELETE /api/menu/:id` - Delete item
- `GET /api/menu/low-stock` - Low stock items
- `POST /api/vendor/scan-qr` - Scan QR
- `POST /api/vendor/orders/:id/complete` - Complete order

## 💡 Pro Tips

1. **Keep scanner tab active** - QR scanner needs focus
2. **Grant camera permissions** - Required for vendor dashboard
3. **Use Chrome** - Best camera support
4. **SPACEBAR only** - Don't click buttons during scanning
5. **Check low stock sidebar** - Auto-updates every 5 seconds
6. **Multiple students** - Sign up different accounts to test
7. **Real-time sync** - Open both apps side-by-side to see updates

## 🎯 Testing Scenarios

### Full Order Flow
1. Student: Login → Add items → Checkout → Pay
2. Verify: QR code appears
3. Vendor: Scan QR → View order → Press SPACE
4. Student: Check completed orders tab
5. Verify: Order moved from active to completed

### Stock Management
1. Vendor: Set item stock to 5
2. Student: Add 5 items to cart and order
3. Verify: Item shows "OUT OF STOCK"
4. Student: Cannot add more items
5. Vendor: Check low stock panel

### Real-time Updates
1. Open student app in Tab 1
2. Open vendor dashboard in Tab 2
3. Vendor: Update menu item
4. Verify: Tab 1 updates automatically
5. Student: Create order
6. Vendor: See in active orders immediately

## 📞 Need Help?

1. Read full README.md
2. Check troubleshooting section
3. Review browser console (F12)
4. Verify backend is running
5. Check database file exists

---

**Happy Canteen Managing! 🍜✨**