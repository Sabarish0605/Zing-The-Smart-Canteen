# 🍜 Campus Canteen - Quick Start (Windows)

## 📦 What's Included

✅ **Student App** - Beautiful canteen ordering interface  
✅ **Vendor Dashboard** - QR scanner & inventory management  
✅ **SQLite Database** - Local database (no setup needed)  
✅ **22 Menu Items** - Pre-loaded with beautiful food images  
✅ **Real-time Sync** - WebSocket-powered updates  

---

## 🚀 3-Minute Setup

### ⚡ Quick Steps:

1. **Extract** all files to a folder (e.g., `C:\canteen-system`)

2. **Create** folder structure:
   ```
   canteen-system/
   ├── backend/
   ├── student-app/
   └── vendor-dashboard/
   ```

3. **Copy files**:
   - Put `server.js`, `database.js`, `package.json` in `backend/`
   - Put student HTML file in `student-app/` (rename to `index.html`)
   - Put vendor HTML file in `vendor-dashboard/` (rename to `index.html`)
   - Put all `.bat` files in main `canteen-system/` folder

4. **Double-click**: `install-backend.bat` (wait 1-2 minutes)

5. **Double-click**: `start-server.bat` (keep this window open!)

6. **Double-click**: `open-student-app.bat` AND `open-vendor-dashboard.bat`

---

## 🔑 Login Info

| App | Email | Password |
|-----|-------|----------|
| **Student** | student@canteen.com | student123 |
| **Vendor** | vendor@canteen.com | vendor123 |

---

## 📱 How to Use

### Student Side:
1. Login → Browse menu with images
2. Add items → Checkout
3. Pay (auto-success in test mode)
4. Get QR code
5. Show to vendor

### Vendor Side:
1. Login → QR scanner starts
2. Student shows QR
3. Order displays in BIG text
4. Press **SPACEBAR** to complete
5. Done!

---

## 🖼️ Menu Has Beautiful Images!

All 22 items come with high-quality food photos:
- 🌅 Breakfast items (Dosa, Idli, Poha)
- 🍔 Snacks (Vada Pav, Samosa, Pasta)
- 🍛 Lunch (Biryani, Paneer, Chole)
- ☕ Beverages (Chai, Coffee, Juice)
- 🍰 Desserts (Ice Cream, Gulab Jamun)

---

## 🎯 Quick Actions

### Every Time You Use:
1. `start-server.bat` ← **Start this FIRST**
2. `open-student-app.bat` ← Open student app
3. `open-vendor-dashboard.bat` ← Open vendor panel

### To Stop:
- Press `Ctrl + C` in the server window

---

## ❗ Common Issues

**"npm not recognized"**  
→ Install Node.js from https://nodejs.org/

**"Module not found"**  
→ Run `install-backend.bat` again

**Camera not working**  
→ Grant permissions, use Chrome browser

**Port in use**  
→ Close other server, or change port in `server.js`

---

## 📁 File Structure

```
canteen-system/
│
├── backend/
│   ├── server.js
│   ├── database.js
│   ├── package.json
│   └── uploads/
│       └── menu-images/
│
├── student-app/
│   └── index.html
│
├── vendor-dashboard/
│   └── index.html
│
├── install-backend.bat
├── start-server.bat
├── open-student-app.bat
└── open-vendor-dashboard.bat
```

---

## 🎨 Features

### Student App Features:
✅ Beautiful warm orange theme  
✅ Food emoji + real images  
✅ Live stock updates  
✅ Shopping cart  
✅ QR code generation  
✅ Order history  

### Vendor Features:
✅ Dark professional theme  
✅ Live QR scanner (webcam)  
✅ SPACEBAR to complete orders  
✅ Inventory management  
✅ Low stock alerts  
✅ Add/Edit/Delete items  

---

## 🔄 Real-Time Features

- Menu changes sync instantly
- Stock updates live
- Order completion notifies students
- Low stock alerts auto-refresh

---

## 📚 Documentation

- **WINDOWS_SETUP_GUIDE.md** - Detailed Windows setup
- **README.md** - Complete documentation
- **QUICK_REFERENCE.md** - Feature reference

---

## ✨ You're Ready!

1. Run `start-server.bat`
2. Run `open-student-app.bat`
3. Run `open-vendor-dashboard.bat`
4. Start managing your canteen! 🍜

---

**Need Help?** Read WINDOWS_SETUP_GUIDE.md for detailed instructions.

**Enjoy! 🎉**