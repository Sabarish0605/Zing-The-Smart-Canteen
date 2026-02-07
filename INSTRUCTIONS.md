# 📝 STEP-BY-STEP INSTRUCTIONS FOR WINDOWS

## ✅ Prerequisites

Before you begin, install **Node.js**:
1. Go to: https://nodejs.org/
2. Download the **LTS version** (recommended for most users)
3. Run the installer
4. Click "Next" through all steps (keep defaults)
5. Restart your computer after installation

---

## 📂 Step 1: Organize Your Files

1. **Create a folder** on your Desktop called `canteen-system`

2. **Download all files** from the package

3. **Put these files** in the main `canteen-system` folder:
   - `SETUP.bat`
   - `start-server.bat`
   - `open-student-app.bat`
   - `open-vendor-dashboard.bat`
   - `install-backend.bat`
   - `server.js`
   - `database.js`
   - `backend-package.json`
   - `WINDOWS_SETUP_GUIDE.md`
   - `README_WINDOWS.md`

4. **Create these subfolders** inside `canteen-system`:
   - `backend`
   - `student-app`
   - `vendor-dashboard`

5. **Copy the student app HTML file**:
   - Find the student app HTML file
   - Copy it into `student-app` folder
   - Rename it to `index.html`

6. **Copy the vendor dashboard HTML file**:
   - Find the vendor dashboard HTML file
   - Copy it into `vendor-dashboard` folder
   - Rename it to `index.html`

Your folder should look like this:
```
canteen-system/
│
├── backend/              (empty folder)
├── student-app/
│   └── index.html
├── vendor-dashboard/
│   └── index.html
│
├── SETUP.bat
├── start-server.bat
├── open-student-app.bat
├── open-vendor-dashboard.bat
├── install-backend.bat
├── server.js
├── database.js
└── backend-package.json
```

---

## 🚀 Step 2: Run Setup

**Method 1: Automatic Setup (Recommended)**
1. Double-click `SETUP.bat`
2. Wait for it to complete (1-2 minutes)
3. Follow the on-screen instructions

**Method 2: Manual Setup**
1. Copy `server.js`, `database.js`, and `backend-package.json` into the `backend` folder
2. Rename `backend-package.json` to `package.json`
3. Double-click `install-backend.bat`
4. Wait for installation to complete

---

## ▶️ Step 3: Start Using the System

### Every time you want to use the canteen system:

**1. Start the Server** (MUST DO THIS FIRST!)
   - Double-click `start-server.bat`
   - A black window will open with green text
   - **DO NOT CLOSE THIS WINDOW** while using the app
   - You should see:
     ```
     🚀 Canteen Backend Server Running!
     📡 Server: http://localhost:3001
     ✨ Ready to serve!
     ```

**2. Open Student App**
   - Double-click `open-student-app.bat`
   - Your browser will open with the student interface
   - Login with:
     - Email: `student@canteen.com`
     - Password: `student123`

**3. Open Vendor Dashboard**
   - Double-click `open-vendor-dashboard.bat`
   - Your browser will open with the vendor interface
   - **IMPORTANT**: Click "Allow" when browser asks for camera access
   - Login with:
     - Email: `vendor@canteen.com`
     - Password: `vendor123`

---

## 🎯 How to Use

### As a Student:

1. **Browse the Menu**
   - See 22 delicious items with beautiful images
   - Check stock availability
   - View prices

2. **Add to Cart**
   - Click "Add to Cart" on items you want
   - Adjust quantities with + and - buttons
   - View total in cart

3. **Checkout**
   - Click "Proceed to Payment"
   - Payment automatically succeeds (test mode)
   - **QR Code appears** - this is your order ticket!

4. **Track Your Order**
   - Go to "Active Orders" tab to see pending orders
   - Click "View QR Code" to show your order
   - When vendor completes it, order moves to "Completed" tab

### As a Vendor:

1. **Scan QR Codes**
   - QR scanner starts automatically
   - Student shows their QR code to camera
   - Order details appear in **LARGE, BOLD text**

2. **Complete Orders**
   - Read the order items
   - Prepare the food
   - Press **SPACEBAR** on keyboard to mark as complete
   - Scanner automatically resets for next customer

3. **Manage Inventory**
   - Click "Inventory" tab
   - Click "Add New Item" to add menu items
   - Click ✏️ to edit items
   - Click 🗑️ to delete items
   - Update stock quantities anytime

4. **Monitor Low Stock**
   - Left sidebar shows items running low
   - Updates automatically every 5 seconds
   - Red alerts when items are almost out

---

## 🖼️ Adding Your Own Food Images

### Easy Method - Use Image URLs:

1. Find a food image online (Google Images, Unsplash, etc.)
2. Right-click → "Copy image address"
3. In Vendor Dashboard → Add/Edit Item
4. Paste the URL in "Image URL" field
5. Save!

**Great image sources:**
- Unsplash: https://unsplash.com/s/photos/food
- Pexels: https://pexels.com/search/food/
- Any public image URL

**Example URLs:**
```
https://images.unsplash.com/photo-1565299624946-b28f40a0ae38
https://images.unsplash.com/photo-1546069901-ba9599a7e63c
```

### Advanced Method - Upload Images:

1. Put your image file in: `backend\uploads\menu-images\`
2. Name it something simple like `pizza.jpg`
3. In Vendor Dashboard → Add/Edit Item
4. Image URL: `/uploads/menu-images/pizza.jpg`
5. Save!

---

## ❓ Troubleshooting

### "Node.js is not installed"
- Download from https://nodejs.org/
- Install the LTS version
- Restart computer
- Run SETUP.bat again

### "npm is not recognized"
- Node.js didn't install correctly
- Uninstall Node.js
- Reinstall with administrator rights
- Restart computer

### Server won't start
- Check if another program is using port 3001
- Try restarting computer
- Check Windows Firewall isn't blocking it

### Camera not working
- Click "Allow" when browser asks for camera
- Close other apps using camera (Zoom, Teams)
- Try Chrome browser (works best)
- Check camera privacy settings in Windows

### Images not showing
- Check internet connection (if using URLs)
- Verify image URL is correct
- Try emoji icons instead (🍕, 🍔, 🍜)

### Database errors
- Close server (press Ctrl+C)
- Delete `backend\canteen.db`
- Restart server - database recreates automatically

### "Module not found" error
- Run `install-backend.bat` again
- Make sure you're in the right folder
- Check internet connection during installation

---

## 🎓 Learning Resources

### First Time?
1. **Day 1**: Set up and explore with demo data
2. **Day 2**: Place test orders as student
3. **Day 3**: Scan QR codes as vendor
4. **Day 4**: Add your own menu items
5. **Day 5**: Customize and make it yours!

### Video Tutorials
Check YouTube for:
- "How to install Node.js on Windows"
- "How to use command prompt"

---

## 📞 Quick Command Reference

Open Command Prompt in the canteen-system folder:
```cmd
# Check Node.js version
node --version

# Install dependencies manually
cd backend
npm install

# Start server manually
cd backend
npm start

# Stop server
Press Ctrl + C
```

---

## 🎨 Customization Ideas

1. **Change Colors**
   - Open HTML files in Notepad
   - Find CSS color codes
   - Replace with your favorite colors

2. **Add More Items**
   - Vendor Dashboard → Inventory
   - Add items with images
   - Set prices and stock

3. **Change Branding**
   - Edit "Campus Canteen" text in HTML
   - Add your canteen's name
   - Update logo emoji

---

## ✨ Success Checklist

- [ ] Node.js installed
- [ ] Files organized in folders
- [ ] SETUP.bat run successfully
- [ ] Server starts without errors
- [ ] Student app opens in browser
- [ ] Vendor dashboard opens with camera
- [ ] Can login to both apps
- [ ] Can see menu with images
- [ ] Can place orders and get QR codes
- [ ] Can scan QR codes as vendor
- [ ] Can manage inventory

---

## 🎉 You're All Set!

Everything is ready to use!

**Your three commands:**
1. `start-server.bat` ← Always start this first!
2. `open-student-app.bat` ← For customers
3. `open-vendor-dashboard.bat` ← For kitchen/counter

**Enjoy your canteen management system! 🍜**

---

**Need more help?** Read the detailed guide in `WINDOWS_SETUP_GUIDE.md`