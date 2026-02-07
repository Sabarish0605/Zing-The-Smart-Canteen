# 🍜 WINDOWS SETUP GUIDE - Campus Canteen System

## 📋 Prerequisites

Before starting, make sure you have:
- ✅ **Node.js** installed (Download from: https://nodejs.org/)
- ✅ **A modern browser** (Chrome recommended)
- ✅ **Windows 10 or 11**

To check if Node.js is installed, open Command Prompt and type:
```cmd
node --version
```

If you see a version number (like v18.x.x or v20.x.x), you're good to go!

---

## 🚀 STEP-BY-STEP SETUP

### Step 1: Create Project Folder

1. **Open Command Prompt** (Win + R, type `cmd`, press Enter)

2. **Navigate to where you want to create the project**:
   ```cmd
   cd C:\Users\YourUsername\Desktop
   ```
   (Replace `YourUsername` with your actual username)

3. **Create the project folder**:
   ```cmd
   mkdir canteen-system
   cd canteen-system
   ```

---

### Step 2: Create Project Structure

Create the following folders:

```cmd
mkdir backend
mkdir backend\uploads
mkdir backend\uploads\menu-images
mkdir student-app
mkdir vendor-dashboard
mkdir shared
```

Your folder structure should look like this:
```
canteen-system/
├── backend/
│   └── uploads/
│       └── menu-images/
├── student-app/
├── vendor-dashboard/
└── shared/
```

---

### Step 3: Set Up Backend

1. **Copy the files** from the downloaded package to your folders:
   - Copy `server.js` to `backend\`
   - Copy `database.js` to `backend\`
   - Copy `backend-package.json` to `backend\` and **rename it to `package.json`**

2. **Navigate to backend folder**:
   ```cmd
   cd backend
   ```

3. **Install dependencies** (this will take 1-2 minutes):
   ```cmd
   npm install
   ```

   You should see progress as packages download and install.

---

### Step 4: Set Up Student App

1. **Go back to main folder**:
   ```cmd
   cd ..
   ```

2. **Copy the student app** HTML file to `student-app\` folder:
   - Find the student app HTML file in the downloads
   - Copy it to `canteen-system\student-app\`
   - Rename it to `index.html`

---

### Step 5: Set Up Vendor Dashboard

1. **Copy the vendor dashboard** HTML file to `vendor-dashboard\` folder:
   - Find the vendor dashboard HTML file in the downloads
   - Copy it to `canteen-system\vendor-dashboard\`
   - Rename it to `index.html`

---

### Step 6: Create Quick Start Scripts

Create these batch files in the main `canteen-system` folder:

**File 1: `start-server.bat`**
```batch
@echo off
echo Starting Canteen Backend Server...
cd backend
npm start
```

**File 2: `open-student-app.bat`**
```batch
@echo off
start student-app\index.html
```

**File 3: `open-vendor-dashboard.bat`**
```batch
@echo off
start vendor-dashboard\index.html
```

To create these:
1. Right-click in the folder → New → Text Document
2. Paste the content
3. Save As → Change "Save as type" to "All Files"
4. Name it (e.g., `start-server.bat`)

---

## ▶️ RUNNING THE APPLICATION

### Every Time You Want to Use the App:

1. **Start the Backend Server** (REQUIRED - Must be running first!)
   - Double-click `start-server.bat`
   - A Command Prompt window will open showing:
     ```
     🚀 Canteen Backend Server Running!
     📡 Server: http://localhost:3001
     ✨ Ready to serve!
     ```
   - **KEEP THIS WINDOW OPEN!** Don't close it.

2. **Open Student App**
   - Double-click `open-student-app.bat`
   - OR manually open `student-app\index.html` in your browser

3. **Open Vendor Dashboard**
   - Double-click `open-vendor-dashboard.bat`
   - OR manually open `vendor-dashboard\index.html` in your browser
   - Grant camera permissions when asked (for QR scanning)

---

## 🔑 Login Credentials

### Student Account:
- **Email**: `student@canteen.com`
- **Password**: `student123`

### Vendor Account:
- **Email**: `vendor@canteen.com`
- **Password**: `vendor123`

---

## 🖼️ Menu Items with Images

The system comes pre-loaded with **22 beautiful food items** across 6 categories:

### 🌅 Breakfast (3 items)
- Masala Dosa - ₹60
- Idli Sambhar - ₹40
- Poha - ₹35

### 🍔 Snacks (5 items)
- Vada Pav - ₹30
- Samosa - ₹25
- Pakora - ₹35
- Sandwich - ₹50
- Pasta - ₹90

### 🍛 Lunch (4 items)
- Chole Bhature - ₹80
- Paneer Butter Masala - ₹120
- Veg Biryani - ₹100
- Dal Tadka - ₹70

### 🌙 Dinner (2 items)
- Pav Bhaji - ₹70
- Fried Rice - ₹85

### ☕ Beverages (5 items)
- Masala Chai - ₹15
- Filter Coffee - ₹20
- Cold Coffee - ₹40
- Fresh Juice - ₹35
- Lassi - ₹30

### 🍰 Dessert (3 items)
- Gulab Jamun - ₹35
- Ice Cream - ₹30
- Kheer - ₹40

**All items come with beautiful high-quality food images from Unsplash!**

---

## 🎯 How to Add Your Own Images

### Option 1: Use URLs (Easiest)
1. Login to Vendor Dashboard
2. Go to Inventory → Add New Item
3. In the "Image URL" field, paste any image URL:
   - From Unsplash: `https://images.unsplash.com/photo-xxxxx`
   - From your website: `https://yoursite.com/image.jpg`
   - Any public image URL

### Option 2: Upload Local Images (Advanced)
1. Place your image in `backend\uploads\menu-images\`
2. When adding/editing item, use: `/uploads/menu-images/your-image.jpg`

### Option 3: Use Image Upload Feature
The backend supports uploading images directly:
- File types: JPEG, PNG, GIF, WebP
- Max size: 5MB
- Images stored in: `backend\uploads\menu-images\`

---

## 🔧 Troubleshooting

### Problem: "npm is not recognized"
**Solution**: Node.js is not installed or not in PATH
1. Download Node.js from https://nodejs.org/
2. Install it (check "Add to PATH" option)
3. Restart Command Prompt
4. Try again

### Problem: "Cannot find module"
**Solution**: Dependencies not installed
```cmd
cd backend
npm install
```

### Problem: Port 3001 already in use
**Solution**: Another app is using that port
1. Open `backend\server.js`
2. Find: `const PORT = 3001;`
3. Change to: `const PORT = 3002;`
4. Save file
5. Update both HTML files: Change `http://localhost:3001` to `http://localhost:3002`

### Problem: Camera not working
**Solution**: 
1. Use Chrome browser (best camera support)
2. Click "Allow" when browser asks for camera permission
3. Close other apps using camera (Zoom, Teams, etc.)
4. Try `http://localhost` instead of opening file directly

### Problem: Images not showing
**Solution**:
1. Check if server is running
2. Verify image URL is correct
3. Check browser console (F12) for errors
4. Try using emoji icons instead (🍕, 🍔, etc.)

### Problem: Database errors
**Solution**: Reset the database
1. Close the server (press Ctrl+C in server window)
2. Delete `backend\canteen.db`
3. Restart server - database will recreate automatically

---

## 📱 Testing the Complete Flow

### Test 1: Student Order Flow
1. ✅ Start server
2. ✅ Open student app
3. ✅ Login with student credentials
4. ✅ Browse menu (see images!)
5. ✅ Add items to cart
6. ✅ Checkout → Pay
7. ✅ QR code appears
8. ✅ Check Active Orders tab

### Test 2: Vendor Fulfillment
1. ✅ Open vendor dashboard
2. ✅ Login with vendor credentials
3. ✅ QR Scanner auto-starts
4. ✅ Use student QR code (can screenshot it)
5. ✅ Order appears in BIG text
6. ✅ Press SPACEBAR
7. ✅ Order completed

### Test 3: Inventory Management
1. ✅ Vendor dashboard → Inventory tab
2. ✅ Click "Add New Item"
3. ✅ Fill details with image URL
4. ✅ Save item
5. ✅ Check student app - new item appears instantly!

---

## 💡 Tips for Best Experience

1. **Always start server first** before opening apps
2. **Keep server window open** while using the system
3. **Use Chrome browser** for best compatibility
4. **Grant camera permissions** for QR scanning
5. **Open both apps side-by-side** to see real-time sync
6. **Check low stock panel** in vendor dashboard
7. **Screenshot QR codes** for easy testing

---

## 📁 File Checklist

Make sure you have all these files:

```
canteen-system/
├── backend/
│   ├── server.js ✅
│   ├── database.js ✅
│   ├── package.json ✅
│   ├── node_modules/ (created after npm install)
│   ├── canteen.db (created automatically)
│   └── uploads/
│       └── menu-images/
├── student-app/
│   └── index.html ✅
├── vendor-dashboard/
│   └── index.html ✅
├── start-server.bat ✅
├── open-student-app.bat ✅
└── open-vendor-dashboard.bat ✅
```

---

## 🎓 Learning Path

1. **Day 1**: Set up and test with demo accounts
2. **Day 2**: Add your own menu items with images
3. **Day 3**: Test complete order flow
4. **Day 4**: Customize colors and branding
5. **Day 5**: Add more features!

---

## 📞 Quick Reference Commands

```cmd
# Navigate to project
cd C:\Users\YourUsername\Desktop\canteen-system

# Go to backend
cd backend

# Install dependencies
npm install

# Start server
npm start

# Stop server
Ctrl + C (in server window)
```

---

## ✨ You're All Set!

Your canteen management system is ready to use!

**Next Steps:**
1. Double-click `start-server.bat`
2. Double-click `open-student-app.bat`
3. Double-click `open-vendor-dashboard.bat`
4. Start managing your canteen! 🍜

---

**Need Help?** Check the main README.md for detailed documentation.

**Happy Canteen Managing! 🎉**