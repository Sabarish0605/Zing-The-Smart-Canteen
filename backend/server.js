require('dotenv').config();

const { createOrder, verifyPaymentSignature, processRefund } = require('./utils/razorpayService');
const { startOrderCancellationJob, startPaymentHistoryCleanup } = require('./utils/cronJobs');
const { OAuth2Client } = require('google-auth-library');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const app = express();

// ============ Google OAuth Client Initialization ============
let googleClient;
try {
  if (process.env.GOOGLE_CLIENT_ID) {
    googleClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'postmessage'
    );
    console.log('✅ Google OAuth Client initialized');
  } else {
    console.warn('⚠️  Google OAuth not configured - set GOOGLE_CLIENT_ID in .env');
  }
} catch (error) {
  console.error('❌ Google OAuth Client initialization failed:', error.message);
}

// ============ CORS Configuration ============
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://localhost',
      'null'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin === 'null') {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400
}));

app.options('*', cors());

// ============ Server Setup ============
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'canteen-secret-key-2024';

// ============ File Upload Configuration ============
const uploadsDir = path.join(__dirname, 'uploads', 'menu-images');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'menu-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// ============ Middleware ============
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/student', express.static(path.join(__dirname, '..', 'student-app')));
app.use('/vendor', express.static(path.join(__dirname, '..', 'vendor-dashboard')));

// ============ Auth Middleware ============
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// ============ Helper Functions ============
function isMealAvailable(item) {
  // Meal time lock feature removed per user request
  return true;
}

// ✅ NEW: Recipe definitions for instant meals
const MEAL_RECIPES = {
  'Chicken Rice': { rice: 1, chicken: 1, egg: 0, veg: 0, noodles: 0 },
  'Egg Rice': { rice: 1, chicken: 0, egg: 1, veg: 0, noodles: 0 },
  'Veg Rice': { rice: 1, chicken: 0, egg: 0, veg: 1, noodles: 0 },
  'Chicken Noodles': { rice: 0, chicken: 1, egg: 0, veg: 0, noodles: 1 },
  'Veg Noodles': { rice: 0, chicken: 0, egg: 0, veg: 1, noodles: 1 },
  'Egg Noodles': { rice: 0, chicken: 0, egg: 1, veg: 0, noodles: 1 }
};

// ✅ NEW: Calculate available stock for instant meals based on raw materials
function calculateInstantMealStock(mealName, rawMaterials) {
  const recipe = MEAL_RECIPES[mealName];
  if (!recipe) return null; // Not an instant meal
  
  let minStock = Infinity;
  
  for (let ingredient in recipe) {
    if (recipe[ingredient] > 0) {
      const available = Math.floor((rawMaterials[ingredient] || 0) / recipe[ingredient]);
      minStock = Math.min(minStock, available);
    }
  }
  
  return minStock === Infinity ? 0 : minStock;
}

// ✅ NEW: Get current raw materials stock
async function getRawMaterialsStock() {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM raw_materials WHERE id = 1', [], (err, row) => {
      if (err) reject(err);
      else resolve(row || { rice: 0, chicken: 0, egg: 0, veg: 0, noodles: 0 });
    });
  });
}

// ✅ NEW: Deduct raw materials after order
async function deductRawMaterials(mealName, quantity) {
  const recipe = MEAL_RECIPES[mealName];
  if (!recipe) return; // Not an instant meal
  
  const deductions = {};
  for (let ingredient in recipe) {
    if (recipe[ingredient] > 0) {
      deductions[ingredient] = recipe[ingredient] * quantity;
    }
  }
  
  const updateFields = Object.keys(deductions).map(key => `${key} = ${key} - ?`).join(', ');
  const values = Object.values(deductions);
  
  return new Promise((resolve, reject) => {
    db.run(`UPDATE raw_materials SET ${updateFields} WHERE id = 1`, values, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// ============ Database Table Creation ============
db.run(`
  CREATE TABLE IF NOT EXISTS feedback (
    feedback_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    rating INTEGER NOT NULL,
    category TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(uid)
  )
`, (err) => {
  if (err) {
    console.error('Error creating feedback table:', err);
  } else {
    console.log('✅ Feedback table ready');
  }
});

// ✅ NEW: Raw materials table
db.run(`
  CREATE TABLE IF NOT EXISTS raw_materials (
    id INTEGER PRIMARY KEY DEFAULT 1,
    rice INTEGER DEFAULT 0,
    chicken INTEGER DEFAULT 0,
    egg INTEGER DEFAULT 0,
    veg INTEGER DEFAULT 0,
    noodles INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.error('Error creating raw_materials table:', err);
  } else {
    console.log('✅ Raw materials table ready');
    // Initialize with default values if not exists
    db.run(`INSERT OR IGNORE INTO raw_materials (id) VALUES (1)`);
  }
});

// ✅ NEW: Add is_instant_meal column to menu_items if not exists
db.run(`
  ALTER TABLE menu_items ADD COLUMN is_instant_meal INTEGER DEFAULT 0
`, (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.error('Error adding is_instant_meal column:', err);
  } else if (!err) {
    console.log('✅ Added is_instant_meal column to menu_items');
  }
});

// ============ AUTH ROUTES ============

// Student Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ uid: user.uid, role: 'student' }, JWT_SECRET);
    res.json({
      token,
      user: {
        uid: user.uid,
        name: user.name,
        email: user.email,
        phone: user.phone,
        balance: user.balance || 0,
        picture: user.profile_picture || user.image,
        role: 'student'
      }
    });
  });
});

// Student Signup
app.post('/api/auth/signup', async (req, res) => {
  console.log('📝 Signup request received');
  console.log('Request body:', req.body);

  const { name, email, phone, password } = req.body;

  if (!name || !email || !password) {
    console.error('❌ Missing required fields');
    return res.status(400).json({ error: 'Name, email and password are required' });
  }

  if (password.length < 6) {
    console.error('❌ Password too short');
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('❌ Invalid email format');
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    console.log('🔍 Checking if user exists...');
    
    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) {
          console.error('❌ Database error during check:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    if (existingUser) {
      console.error('❌ Email already registered:', email);
      return res.status(400).json({ error: 'Email already registered' });
    }

    console.log('✅ Email is available');
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed');

    const uid = 'USER_' + Date.now() + '_' + Math.random().toString(36).substring(7);
    const image = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`;

    console.log('👤 Creating user with ID:', uid);

    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (uid, name, email, phone, password, profile_picture, role, email_verified, balance) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uid, name, email, phone || '', hashedPassword, image, 'student', 1, 0],
        function(err) {
          if (err) {
            console.error('❌ Database insert error:', err);
            console.error('Error code:', err.code);
            console.error('Error message:', err.message);
            reject(err);
          } else {
            console.log('✅ User inserted successfully, rowid:', this.lastID);
            resolve(this);
          }
        }
      );
    });

    console.log('🔑 Generating JWT token...');
    const token = jwt.sign({ uid, role: 'student' }, JWT_SECRET, { expiresIn: '7d' });
    console.log('✅ Token generated');
    console.log('✅ New user registered successfully:', uid);

    res.status(201).json({
      token,
      user: { 
        uid, 
        name, 
        email, 
        phone: phone || '', 
        balance: 0, 
        picture: image, 
        role: 'student' 
      }
    });

  } catch (error) {
    console.error('❌ Signup error:', error);
    console.error('Error stack:', error.stack);
    
    if (error.message && error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    if (error.code === 'SQLITE_ERROR') {
      return res.status(500).json({ 
        error: 'Database error. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    res.status(500).json({ 
      error: 'Registration failed. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Vendor Login
app.post('/api/auth/vendor-login', async (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM vendors WHERE email = ?', [email], async (err, vendor) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!vendor) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, vendor.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ uid: vendor.uid, role: 'vendor' }, JWT_SECRET);
    
    res.json({
      token,
      vendor: {
        uid: vendor.uid,
        name: vendor.name,
        email: vendor.email,
        canteen_code: vendor.canteen_code
      }
    });
  });
});

// Google OAuth Authentication
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;
    
    console.log('=== Google OAuth Request Received ===');
    
    if (!credential) {
      console.error('❌ No credential provided');
      return res.status(400).json({ error: 'No credential provided' });
    }

    if (!googleClient) {
      console.error('❌ Google OAuth not configured');
      return res.status(500).json({ 
        error: 'Google authentication is not configured on the server',
        hint: 'Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file'
      });
    }
    
    console.log('🔐 Verifying Google token...');
    
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const googleId = payload['sub'];
    const email = payload['email'];
    const name = payload['name'];
    const picture = payload['picture'];
    const emailVerified = payload['email_verified'];

    console.log('✅ Google token verified');
    console.log('📧 Email:', email);
    console.log('👤 Name:', name);

    db.get(
      'SELECT * FROM users WHERE email = ? OR google_id = ?',
      [email, googleId],
      (err, user) => {
        if (err) {
          console.error('❌ Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (user) {
          console.log('👤 Existing user found:', user.uid);
          
          if (!user.google_id) {
            console.log('📝 Updating user with Google ID');
            db.run(
              'UPDATE users SET google_id = ?, profile_picture = ? WHERE uid = ?',
              [googleId, picture, user.uid],
              (updateErr) => {
                if (updateErr) {
                  console.error('⚠️  Error updating user:', updateErr);
                }
              }
            );
          }

          const token = jwt.sign(
            { uid: user.uid, role: 'student' },
            JWT_SECRET,
            { expiresIn: '7d' }
          );

          console.log('✅ Login successful');

          res.json({
            token,
            user: {
              uid: user.uid,
              name: user.name,
              email: user.email,
              phone: user.phone || '',
              balance: user.balance || 0,
              picture: picture || user.profile_picture,
              role: 'student'
            }
          });
        } else {
          console.log('➕ Creating new user');
          
          const uid = 'USER_' + Date.now();
          
          db.run(
            `INSERT INTO users (uid, name, email, phone, password, google_id, profile_picture, balance, role)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [uid, name, email, '', 'google_oauth', googleId, picture, 0, 'student'],
            function(insertErr) {
              if (insertErr) {
                console.error('❌ Error creating user:', insertErr);
                
                if (insertErr.message.includes('UNIQUE')) {
                  return res.status(400).json({ 
                    error: 'An account with this email already exists',
                    hint: 'Try logging in with email/password instead'
                  });
                }
                
                return res.status(500).json({ error: 'Failed to create user' });
              }

              console.log('✅ New user created:', uid);

              const token = jwt.sign(
                { uid, role: 'student' },
                JWT_SECRET,
                { expiresIn: '7d' }
              );

              console.log('✅ Registration successful');

              res.json({
                token,
                user: {
                  uid,
                  name,
                  email,
                  phone: '',
                  balance: 0,
                  picture,
                  role: 'student'
                }
              });
            }
          );
        }
      }
    );
  } catch (error) {
    console.error('=== Google Authentication Error ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    
    let errorMessage = 'Invalid Google token';
    let errorHint = '';
    
    if (error.message.includes('Token used too early')) {
      errorMessage = 'Token timing error';
      errorHint = 'Please try again in a few seconds';
    } else if (error.message.includes('Invalid token signature')) {
      errorMessage = 'Invalid token signature';
      errorHint = 'Please check your Google Cloud Console configuration';
    } else if (error.message.includes('audience')) {
      errorMessage = 'Client ID mismatch';
      errorHint = 'Please verify GOOGLE_CLIENT_ID in .env matches your OAuth client';
    }
    
    res.status(401).json({ 
      error: errorMessage,
      hint: errorHint,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
const auth = authenticateToken;

// ============ IMAGE UPLOAD ROUTE ============
app.post('/api/upload-image', authenticateToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }

  const imageUrl = `/uploads/menu-images/${req.file.filename}`;
  res.json({ imageUrl, filename: req.file.filename });
});

// ============ MENU ROUTES ============

// ✅ FIXED: Get all menu items with availability (including instant meals calculated stock)
app.get('/api/menu', async (req, res) => {
  try {
    const rawMaterials = await getRawMaterialsStock();
    
    db.all('SELECT * FROM menu_items ORDER BY category, name', [], (err, items) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      
      const itemsWithAvailability = items.map(item => {
        let actualStock = item.stock;
        
        // ✅ If it's an instant meal, calculate stock from raw materials
        if (item.is_instant_meal && MEAL_RECIPES[item.name]) {
          actualStock = calculateInstantMealStock(item.name, rawMaterials);
        }
        
        return {
          ...item,
          item_id: item.id,
          stock: actualStock, // ✅ Use calculated stock
          isAvailable: isMealAvailable(item) && actualStock > 0,
          is_meal_locked: Boolean(item.is_meal_locked),
          is_instant_meal: Boolean(item.is_instant_meal)
        };
      });
      
      res.json(itemsWithAvailability);
    });
  } catch (error) {
    console.error('Error loading menu:', error);
    res.status(500).json({ error: 'Failed to load menu' });
  }
});
// GET raw materials


// UPDATE raw materials
app.put('/api/raw-materials', auth, async (req, res) => {
  const { rice, noodles, veg, egg, chicken } = req.body;
  await db.run(
    'INSERT OR REPLACE INTO raw_materials (vendor_id, rice, noodles, veg, egg, chicken) VALUES (?, ?, ?, ?, ?, ?)',
    [req.user.id, rice, noodles, veg, egg, chicken]
  );
  io.emit('stock-updated'); // Notify all clients
  res.json({ success: true });
});

// Get low stock items
app.get('/api/menu/low-stock', authenticateToken, async (req, res) => {
  try {
    const rawMaterials = await getRawMaterialsStock();
    
    db.all(
      'SELECT * FROM menu_items WHERE stock <= threshold OR is_instant_meal = 1 ORDER BY stock ASC',
      [],
      (err, items) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        
        const itemsWithCalculatedStock = items.map(item => {
          let actualStock = item.stock;
          
          if (item.is_instant_meal && MEAL_RECIPES[item.name]) {
            actualStock = calculateInstantMealStock(item.name, rawMaterials);
          }
          
          return {
            ...item,
            stock: actualStock
          };
        }).filter(item => item.stock <= item.threshold);
        
        res.json(itemsWithCalculatedStock);
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Add menu item
app.post('/api/menu', authenticateToken, (req, res) => {
  if (req.user.role !== 'vendor') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { 
    name, price, category, stock, threshold, imageUrl, description,
    is_meal_locked, meal_start_time, meal_end_time, is_instant_meal
  } = req.body;
  const id = 'ITEM_' + Date.now();

  db.run(
    `INSERT INTO menu_items (id, name, price, category, stock, threshold, image_url, description, 
                         is_meal_locked, meal_start_time, meal_end_time, is_instant_meal)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, price, category, stock || 0, threshold || 5, imageUrl, description,
     is_meal_locked || 0, meal_start_time, meal_end_time, is_instant_meal || 0],
    function(err) {
      if (err) {
        console.error('Failed to add item:', err);
        return res.status(500).json({ error: 'Failed to add item' });
      }
      
      db.get('SELECT * FROM menu_items WHERE id = ?', [id], (err, item) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch item' });
        io.emit('menu-updated', { action: 'add', item });
        io.emit('stock-updated');
        res.json(item);
      });
    }
  );
});

// Update menu item
app.put('/api/menu/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'vendor') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { 
    name, price, category, stock, threshold, imageUrl, description,
    is_meal_locked, meal_start_time, meal_end_time, is_instant_meal
  } = req.body;
  const { id } = req.params;

  db.run(
    `UPDATE menu_items 
     SET name = ?, price = ?, category = ?, stock = ?, threshold = ?, image_url = ?, description = ?,
         is_meal_locked = ?, meal_start_time = ?, meal_end_time = ?, is_instant_meal = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [name, price, category, stock, threshold, imageUrl, description,
     is_meal_locked || 0, meal_start_time, meal_end_time, is_instant_meal || 0, id],
    function(err) {
      if (err) {
        console.error('Failed to update item:', err);
        return res.status(500).json({ error: 'Failed to update item' });
      }
      
      db.get('SELECT * FROM menu_items WHERE id = ?', [id], (err, item) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch item' });
        io.emit('menu-updated', { action: 'update', item });
        io.emit('stock-updated');
        res.json(item);
      });
    }
  );
});

// Delete menu item
app.delete('/api/menu/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'vendor') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { id } = req.params;
  console.log(`[DELETE /api/menu/:id] Request received for id: ${id}, user role: ${req.user.role}`);
  
  db.get('SELECT image_url FROM menu_items WHERE id = ?', [id], (err, item) => {
    if (item && item.image_url && item.image_url.startsWith('/uploads')) {
      const imagePath = path.join(__dirname, item.image_url);
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (err) {
          console.error('Failed to delete image:', err);
        }
      }
    }
    
    db.run('DELETE FROM menu_items WHERE id = ?', [id], function(err) {
      if (err) return res.status(500).json({ error: 'Failed to delete item' });
      io.emit('menu-updated', { action: 'delete', itemId: id });
      io.emit('stock-updated');
      res.json({ success: true });
    });
  });
});

// ✅ NEW: Raw Materials Routes

// Get raw materials stock
app.get('/api/raw-materials', authenticateToken, async (req, res) => {
  try {
    const rawMaterials = await getRawMaterialsStock();
    res.json(rawMaterials);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get raw materials' });
  }
});

// Update raw materials stock
app.put('/api/raw-materials', authenticateToken, async (req, res) => {
  if (req.user.role !== 'vendor') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { rice, chicken, egg, veg, noodles } = req.body;

  db.run(
    `UPDATE raw_materials 
     SET rice = ?, chicken = ?, egg = ?, veg = ?, noodles = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = 1`,
    [rice || 0, chicken || 0, egg || 0, veg || 0, noodles || 0],
    function(err) {
      if (err) {
        console.error('Failed to update raw materials:', err);
        return res.status(500).json({ error: 'Failed to update raw materials' });
      }
      
      io.emit('stock-updated');
      res.json({ success: true, rice, chicken, egg, veg, noodles });
    }
  );
});

// ============ ORDER ROUTES ============

// Create Razorpay Payment Order
app.post('/api/orders/create-payment', authenticateToken, async (req, res) => {
  const { items, totalAmount } = req.body;
  
  try {
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in cart' });
    }

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ error: 'Invalid total amount' });
    }

    const invalidItems = items.filter(item => !item.item_id && !item.id);
    if (invalidItems.length > 0) {
      console.error('❌ Items missing IDs:', invalidItems);
      return res.status(400).json({ error: 'Some items are missing IDs' });
    }
    
    const orderId = 'ORD_' + Date.now();
    
    const razorpayOrder = await createOrder(totalAmount, orderId);
    
    console.log('✅ Payment order created:', orderId);
    
    res.json({
      orderId,
      razorpayOrderId: razorpayOrder.id,
      amount: totalAmount,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('❌ Payment creation error:', error);
    res.status(500).json({ error: 'Failed to create payment order: ' + error.message });
  }
});

// ✅ FIXED: Verify Payment and Create Order (with raw materials deduction)
app.post('/api/orders/verify-payment', authenticateToken, async (req, res) => {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature, items, totalAmount } = req.body;
  
  console.log('=== Payment Verification Started ===');
  console.log('Order ID:', orderId);
  console.log('Items count:', items?.length);
  
  const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  
  if (!isValid) {
    console.error('❌ Invalid payment signature');
    return res.status(400).json({ error: 'Invalid payment signature' });
  }
  
  console.log('✅ Payment signature verified');

  const studentId = req.user.uid;
  
  let vendorId = null;
  try {
    const vendor = await new Promise((resolve, reject) => {
      db.get('SELECT uid FROM vendors LIMIT 1', [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (vendor) {
      vendorId = vendor.uid;
      console.log('✅ Using vendor:', vendorId);
    } else {
      console.log('⚠️  No vendor found, using NULL');
    }
  } catch (error) {
    console.log('⚠️  Vendor lookup failed, continuing with NULL');
  }
  
  const student = await new Promise((resolve, reject) => {
    db.get('SELECT name, email, profile_picture FROM users WHERE uid = ?', [studentId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
  
  const compactItems = items.map(item => ({
    id: item.item_id || item.id,
    name: item.name,
    qty: item.quantity,
    price: item.price
  }));
  
  const qrPayload = { 
    orderId, 
    studentId,
    studentName: student?.name || 'Student',
    studentEmail: student?.email || '',
    studentImage: student?.profile_picture || '',
    items: compactItems, 
    total: totalAmount 
  };
  
  let qrCodeUrl;
  
  try {
    qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrPayload));
    console.log('✅ QR code generated');
  } catch (err) {
    console.error('❌ QR generation error:', err);
    return res.status(500).json({ error: 'Failed to generate QR code' });
  }
  
  const autoCancelAt = new Date(Date.now() + 30 * 60 * 1000);
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    db.run(`
      INSERT INTO orders (order_id, student_id, vendor_id, total_amount, status, 
                         payment_status, razorpay_order_id, razorpay_payment_id, 
                         razorpay_signature, qr_data, auto_cancel_at)
      VALUES (?, ?, ?, ?, 'active', 'success', ?, ?, ?, ?, ?)
    `, [orderId, studentId, vendorId, totalAmount, razorpayOrderId, razorpayPaymentId, 
        razorpaySignature, qrCodeUrl, autoCancelAt.toISOString()], 
    function(orderErr) {
      if (orderErr) {
        console.error('❌ Order creation error:', orderErr);
        db.run('ROLLBACK');
        return res.status(500).json({ error: 'Failed to create order: ' + orderErr.message });
      }
      
      console.log('✅ Order created successfully');
      
      let itemsProcessed = 0;
      const totalItems = items.length;
      let hasError = false;
      
      items.forEach((item) => {
        if (hasError) return;
        
        const itemId = item.item_id || item.id;
        
        db.run(`
  INSERT INTO order_items (order_id, item_id, item_name, quantity, price, image_url, is_default_meal, selected_addon)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`, [
  orderId, 
  itemId, 
  item.name, 
  item.quantity, 
  item.price, 
  item.image_url || null,
  item.is_default_meal ? 1 : 0,
  item.selectedAddon || null  // ✅ STORE THE ADDON
],
        function(itemErr) {
          if (itemErr) {
            console.error('❌ Order item insertion error:', itemErr);
            hasError = true;
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Failed to add order item' });
          }
          
          // ✅ Check if item is instant meal and deduct raw materials
          db.get('SELECT is_instant_meal, name FROM menu_items WHERE id = ?', [itemId], async (err, menuItem) => {
            if (menuItem && menuItem.is_instant_meal && MEAL_RECIPES[menuItem.name]) {
              try {
                await deductRawMaterials(menuItem.name, item.quantity);
                console.log(`✅ Deducted raw materials for ${menuItem.name} x${item.quantity}`);
              } catch (deductErr) {
                console.error('⚠️  Raw material deduction error:', deductErr);
              }
            } else {
              // Regular item - update stock
              db.run(`
                UPDATE menu_items 
                SET stock = stock - ? 
                WHERE id = ?
              `, [item.quantity, itemId], function(stockErr) {
                if (stockErr) {
                  console.error('⚠️  Stock update error:', stockErr);
                }
              });
            }
            
            itemsProcessed++;
            console.log(`✅ Item ${itemsProcessed}/${totalItems} processed`);
            
            if (itemsProcessed === totalItems && !hasError) {
              db.run(`
                INSERT INTO payment_history (user_id, order_id, amount, payment_method, payment_status, razorpay_payment_id)
                VALUES (?, ?, ?, 'razorpay', 'success', ?)
              `, [studentId, orderId, totalAmount, razorpayPaymentId],
              function(paymentErr) {
                if (paymentErr) {
                  console.error('❌ Payment history error:', paymentErr);
                  db.run('ROLLBACK');
                  return res.status(500).json({ error: 'Failed to record payment' });
                }
                
                db.run('COMMIT', (commitErr) => {
                  if (commitErr) {
                    console.error('❌ Commit error:', commitErr);
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: 'Failed to commit transaction' });
                  }
                  
                  console.log('✅ Transaction committed successfully');
                  
                  io.emit('new-order', { orderId, vendorId });
                  io.emit('stock-updated');
                  
                  res.json({
                    success: true,
                    orderId,
                    qrData: qrCodeUrl,
                    autoCancelAt: autoCancelAt.toISOString()
                  });
                });
              });
            }
          });
        });
      });
    });
  });
});

// Get User's Orders
app.get('/api/orders/my-orders', authenticateToken, (req, res) => {
  const { status } = req.query;
  
  let query = `SELECT * FROM orders WHERE student_id = ?`;
  const params = [req.user.uid];
  
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, orders) => {
    if (err) {
      console.error('❌ Orders fetch error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // ✅ Fetch items for each order with addon information
    const ordersWithItems = orders.map(order => {
      return new Promise((resolve) => {
        db.all(
          'SELECT *, selected_addon FROM order_items WHERE order_id = ?',
          [order.order_id],
          (err, items) => {
            if (err) {
              console.error('❌ Error fetching items for order:', order.order_id, err);
              resolve({ ...order, items: [] });
            } else {
              // ✅ Map items to include addon information
              const itemsWithAddons = items.map(item => ({
                ...item,
                selectedAddon: item.selected_addon,
                addon: item.selected_addon // Include both formats for compatibility
              }));
              
              resolve({ ...order, items: itemsWithAddons });
            }
          }
        );
      });
    });
    
    Promise.all(ordersWithItems).then(results => {
      console.log(`✅ Fetched ${results.length} orders with items for user ${req.user.uid}`);
      res.json(results);
    });
  });
});

// Get Order Details
app.get('/api/orders/:orderId', authenticateToken, (req, res) => {
  const { orderId } = req.params;

  console.log('📋 Fetching order:', orderId);

  db.get(`
    SELECT 
      o.*,
      u.name as student_name,
      u.email as student_email,
      u.profile_picture as student_image
    FROM orders o
    LEFT JOIN users u ON o.student_id = u.uid
    WHERE o.order_id = ?
  `, [orderId], (err, order) => {
    if (err) {
      console.error('❌ Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!order) {
      console.error('❌ Order not found:', orderId);
      return res.status(404).json({ error: 'Order not found' });
    }

    // ✅ FIXED: Fetch items with addon information
    db.all(
      'SELECT *, selected_addon FROM order_items WHERE order_id = ?',
      [orderId],
      (err, items) => {
        if (err) {
          console.error('❌ Items fetch error:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        // ✅ Map items to include addon in response
        const itemsWithAddons = items.map(item => ({
          ...item,
          selectedAddon: item.selected_addon,
          addon: item.selected_addon // ✅ Include both formats for compatibility
        }));
        
        console.log('✅ Order details fetched:', orderId);
        res.json({ 
          ...order, 
          items: itemsWithAddons
        });
      }
    );
  });
});
// ============ VENDOR ROUTES ============

// Get Vendor's Canteen Code
app.get('/api/vendor/canteen-code', authenticateToken, (req, res) => {
  if (req.user.role !== 'vendor') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  db.get('SELECT canteen_code FROM vendors WHERE uid = ?', [req.user.uid], (err, vendor) => {
    if (err || !vendor) return res.status(500).json({ error: 'Vendor not found' });
    res.json({ canteenCode: vendor.canteen_code });
  });
});

// Get Active Orders for Vendor
app.get('/api/vendor/orders/active', authenticateToken, (req, res) => {
  if (req.user.role !== 'vendor') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const query = `
    SELECT 
      o.*,
      u.name as student_name,
      u.email as student_email,
      u.profile_picture as student_image
    FROM orders o
    JOIN users u ON o.student_id = u.uid
    WHERE o.status = 'active' AND (o.vendor_id = ? OR o.vendor_id IS NULL)
    ORDER BY o.created_at DESC
  `;

  db.all(query, [req.user.uid], (err, orders) => {
    if (err) {
      console.error('❌ Active orders error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    console.log(`✅ Fetched ${orders.length} active orders for vendor`);
    res.json(orders);
  });
});

// Complete Order
// Complete Order - FIXED VERSION
app.post('/api/vendor/orders/:orderId/complete', authenticateToken, async (req, res) => {
  const { orderId } = req.params;
  
  console.log('📦 Completing order:', orderId);
  
  try {
    // Get order details
    const order = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM orders WHERE order_id = ?', [orderId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (order.status !== 'active') {
      return res.status(400).json({ error: 'Order is not active' });
    }
    
    // Update order status to completed
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE orders SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE order_id = ?',
        ['completed', orderId],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    
    console.log('✅ Order marked as completed:', orderId);
    
    // Emit socket events
    io.emit('order-completed', { orderId });
    io.emit('stock-updated');
    
    res.json({ success: true, orderId });
    
  } catch (error) {
    console.error('❌ Error completing order:', error);
    res.status(500).json({ error: 'Failed to complete order: ' + error.message });
  }
});
// ============ ANALYTICS ROUTES (Continuation from Part 1) ============

// Get Sales Analytics
app.get('/api/vendor/analytics/sales', authenticateToken, (req, res) => {
  if (req.user.role !== 'vendor') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { period } = req.query;
  
  let dateFilter = '';
  const now = new Date();
  
  if (period === 'week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    dateFilter = `AND o.created_at >= '${weekAgo.toISOString()}'`;
  } else if (period === 'month') {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    dateFilter = `AND o.created_at >= '${monthAgo.toISOString()}'`;
  } else if (period === 'year') {
    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    dateFilter = `AND o.created_at >= '${yearAgo.toISOString()}'`;
  }

  const query = `
    SELECT 
      COUNT(*) as total_orders,
      COALESCE(SUM(total_amount), 0) as total_revenue,
      COALESCE(AVG(total_amount), 0) as average_order_value,
      COUNT(DISTINCT student_id) as unique_customers
    FROM orders o
    WHERE (o.vendor_id = ? OR o.vendor_id IS NULL) 
      AND o.status = 'completed' 
      ${dateFilter}
  `;

  db.get(query, [req.user.uid], (err, analytics) => {
    if (err) {
      console.error('Analytics error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({
      total_orders: analytics.total_orders || 0,
      total_revenue: analytics.total_revenue || 0,
      average_order_value: analytics.average_order_value || 0,
      unique_customers: analytics.unique_customers || 0
    });
  });
});

// Get Daily Sales Trend
app.get('/api/vendor/analytics/daily-trend', authenticateToken, (req, res) => {
  if (req.user.role !== 'vendor') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { days = 7 } = req.query;
  const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const query = `
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as orders,
      COALESCE(SUM(total_amount), 0) as revenue
    FROM orders
    WHERE (vendor_id = ? OR vendor_id IS NULL)
      AND status = 'completed'
      AND created_at >= ?
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `;

  db.all(query, [req.user.uid, daysAgo.toISOString()], (err, trend) => {
    if (err) {
      console.error('Trend error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(trend || []);
  });
});

// Get Top Selling Items
app.get('/api/vendor/analytics/top-items', authenticateToken, (req, res) => {
  if (req.user.role !== 'vendor') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { limit = 10, period = 'month' } = req.query;
  
  let dateFilter = '';
  const now = new Date();
  
  if (period === 'week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    dateFilter = `AND o.created_at >= '${weekAgo.toISOString()}'`;
  } else if (period === 'month') {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    dateFilter = `AND o.created_at >= '${monthAgo.toISOString()}'`;
  }

  const query = `
    SELECT 
      oi.item_name,
      oi.item_id,
      SUM(oi.quantity) as total_sold,
      COALESCE(SUM(oi.quantity * oi.price), 0) as total_revenue,
      COUNT(DISTINCT o.order_id) as order_count
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.order_id
    WHERE (o.vendor_id = ? OR o.vendor_id IS NULL) 
      AND o.status = 'completed' 
      ${dateFilter}
    GROUP BY oi.item_id, oi.item_name
    ORDER BY total_sold DESC
    LIMIT ?
  `;

  db.all(query, [req.user.uid, parseInt(limit)], (err, items) => {
    if (err) {
      console.error('Top items error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(items || []);
  });
});

// Get Category Performance
app.get('/api/vendor/analytics/categories', authenticateToken, (req, res) => {
  if (req.user.role !== 'vendor') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { period = 'month' } = req.query;
  
  let dateFilter = '';
  const now = new Date();
  
  if (period === 'week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    dateFilter = `AND o.created_at >= '${weekAgo.toISOString()}'`;
  } else if (period === 'month') {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    dateFilter = `AND o.created_at >= '${monthAgo.toISOString()}'`;
  }

  const query = `
    SELECT 
      m.category,
      SUM(oi.quantity) as total_sold,
      COALESCE(SUM(oi.quantity * oi.price), 0) as total_revenue,
      COUNT(DISTINCT o.order_id) as order_count
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.order_id
    JOIN menu_items m ON oi.item_id = m.id
    WHERE (o.vendor_id = ? OR o.vendor_id IS NULL) 
      AND o.status = 'completed' 
      ${dateFilter}
    GROUP BY m.category
    ORDER BY total_revenue DESC
  `;

  db.all(query, [req.user.uid], (err, categories) => {
    if (err) {
      console.error('Categories error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(categories || []);
  });
});

// Get Peak Hours
app.get('/api/vendor/analytics/peak-hours', authenticateToken, (req, res) => {
  if (req.user.role !== 'vendor') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const query = `
    SELECT 
      CAST(strftime('%H', created_at) AS INTEGER) as hour,
      COUNT(*) as order_count,
      COALESCE(SUM(total_amount), 0) as revenue
    FROM orders
    WHERE (vendor_id = ? OR vendor_id IS NULL) 
      AND status = 'completed'
      AND created_at >= datetime('now', '-30 days')
    GROUP BY hour
    ORDER BY hour ASC
  `;

  db.all(query, [req.user.uid], (err, hours) => {
    if (err) {
      console.error('Peak hours error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(hours || []);
  });
});

// ✅ UPDATED: Stock Recommendations (considering instant meals)
app.get('/api/vendor/analytics/recommendations', authenticateToken, async (req, res) => {
  if (req.user.role !== 'vendor') {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const rawMaterials = await getRawMaterialsStock();

    const query = `
      SELECT 
        m.id,
        m.name,
        m.category,
        m.stock as current_stock,
        m.threshold,
        m.is_instant_meal,
        COALESCE(SUM(oi.quantity), 0) as sold_last_7_days,
        COALESCE(SUM(oi.quantity) / 7.0, 0) as daily_average
      FROM menu_items m
      LEFT JOIN order_items oi ON m.id = oi.item_id
      LEFT JOIN orders o ON oi.order_id = o.order_id 
        AND (o.vendor_id = ? OR o.vendor_id IS NULL)
        AND o.status = 'completed'
        AND o.created_at >= datetime('now', '-7 days')
      GROUP BY m.id
    `;

    db.all(query, [req.user.uid], (err, items) => {
      if (err) {
        console.error('Recommendations error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      const recommendations = items.map(item => {
        // ✅ Calculate actual stock for instant meals
        let actualStock = item.current_stock;
        if (item.is_instant_meal && MEAL_RECIPES[item.name]) {
          actualStock = calculateInstantMealStock(item.name, rawMaterials);
        }

        const dailyAvg = item.daily_average;
        const daysUntilStockout = dailyAvg > 0 ? actualStock / dailyAvg : 999;
        const recommendedStock = Math.ceil(dailyAvg * 14);
        
        let status = 'good';
        let action = 'No action needed';
        
        if (actualStock === 0) {
          status = 'critical';
          if (item.is_instant_meal) {
            action = 'Check raw materials! One or more ingredients depleted.';
          } else {
            action = `Restock immediately! Recommend: ${recommendedStock} units`;
          }
        } else if (daysUntilStockout < 3) {
          status = 'urgent';
          if (item.is_instant_meal) {
            action = `Low raw materials (${Math.floor(daysUntilStockout)} days left). Restock ingredients soon.`;
          } else {
            action = `Restock soon (${Math.floor(daysUntilStockout)} days left). Recommend: ${recommendedStock} units`;
          }
        } else if (actualStock <= item.threshold) {
          status = 'warning';
          if (item.is_instant_meal) {
            action = 'Consider restocking raw materials.';
          } else {
            action = `Consider restocking. Recommend: ${recommendedStock} units`;
          }
        } else if (dailyAvg === 0 && actualStock > 20) {
          status = 'overstocked';
          action = 'Low demand - consider reducing price or running promotion';
        }

        return {
          id: item.id,
          name: item.name,
          category: item.category,
          current_stock: actualStock,
          sold_last_7_days: item.sold_last_7_days,
          daily_average: parseFloat(dailyAvg.toFixed(2)),
          days_until_stockout: daysUntilStockout === 999 ? 'N/A' : Math.floor(daysUntilStockout),
          recommended_stock: item.is_instant_meal ? 'Based on raw materials' : recommendedStock,
          status,
          action,
          is_instant_meal: Boolean(item.is_instant_meal)
        };
      });

      const sorted = recommendations.sort((a, b) => {
        const priority = { critical: 0, urgent: 1, warning: 2, overstocked: 3, good: 4 };
        return priority[a.status] - priority[b.status];
      });

      res.json(sorted);
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get Revenue Comparison
app.get('/api/vendor/analytics/revenue-comparison', authenticateToken, (req, res) => {
  if (req.user.role !== 'vendor') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const queries = {
    this_week: `
      SELECT COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE (vendor_id = ? OR vendor_id IS NULL)
        AND status = 'completed'
        AND created_at >= datetime('now', '-7 days')
    `,
    last_week: `
      SELECT COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE (vendor_id = ? OR vendor_id IS NULL)
        AND status = 'completed'
        AND created_at >= datetime('now', '-14 days')
        AND created_at < datetime('now', '-7 days')
    `,
    this_month: `
      SELECT COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE (vendor_id = ? OR vendor_id IS NULL)
        AND status = 'completed'
        AND created_at >= datetime('now', '-30 days')
    `,
    last_month: `
      SELECT COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE (vendor_id = ? OR vendor_id IS NULL)
        AND status = 'completed'
        AND created_at >= datetime('now', '-60 days')
        AND created_at < datetime('now', '-30 days')
    `
  };

  const results = {};
  let completed = 0;

  Object.keys(queries).forEach(key => {
    db.get(queries[key], [req.user.uid], (err, row) => {
      if (!err) {
        results[key] = row.revenue || 0;
      }
      completed++;
      
      if (completed === Object.keys(queries).length) {
        const weekChange = results.last_week > 0 
          ? ((results.this_week - results.last_week) / results.last_week * 100).toFixed(1)
          : 0;
        
        const monthChange = results.last_month > 0
          ? ((results.this_month - results.last_month) / results.last_month * 100).toFixed(1)
          : 0;

        res.json({
          this_week: results.this_week,
          last_week: results.last_week,
          week_change: parseFloat(weekChange),
          this_month: results.this_month,
          last_month: results.last_month,
          month_change: parseFloat(monthChange)
        });
      }
    });
  });
});

// ============ PAYMENT HISTORY ROUTES ============

// Get Payment History
app.get('/api/payments/history', authenticateToken, (req, res) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  db.all(`
    SELECT ph.*, o.order_id, o.status as order_status
    FROM payment_history ph
    LEFT JOIN orders o ON ph.order_id = o.order_id
    WHERE ph.user_id = ? AND ph.created_at > ?
    ORDER BY ph.created_at DESC
  `, [req.user.uid, sevenDaysAgo.toISOString()], (err, history) => {
    if (err) {
      console.error('Payment history error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(history);
  });
});

// ============ PROFILE ROUTES ============

// Update User Profile
app.put('/api/users/profile', authenticateToken, (req, res) => {
  const { name, picture } = req.body;
  const userId = req.user.uid;

  db.run(
    'UPDATE users SET name = ?, profile_picture = ?, updated_at = CURRENT_TIMESTAMP WHERE uid = ?',
    [name, picture, userId],
    function(err) {
      if (err) {
        console.error('Profile update error:', err);
        return res.status(500).json({ error: 'Failed to update profile' });
      }
      res.json({ success: true });
    }
  );
});

// Change User Password
app.put('/api/users/password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.uid;

  db.get('SELECT * FROM users WHERE uid = ?', [userId], async (err, user) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.password === 'google_oauth') {
      return res.status(400).json({ error: 'Cannot change password for Google accounts' });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    db.run(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE uid = ?',
      [hashedPassword, userId],
      function(updateErr) {
        if (updateErr) {
          console.error('Password update error:', updateErr);
          return res.status(500).json({ error: 'Failed to update password' });
        }
        res.json({ success: true });
      }
    );
  });
});

// Legacy Profile Update
app.put('/api/profile/update', authenticateToken, async (req, res) => {
  const { name, profilePicture } = req.body;
  const { uid, role } = req.user;
  
  const table = role === 'vendor' ? 'vendors' : 'users';
  
  db.run(`
    UPDATE ${table} 
    SET name = ?, profile_picture = ?, updated_at = CURRENT_TIMESTAMP
    WHERE uid = ?
  `, [name, profilePicture, uid], function(err) {
    if (err) return res.status(500).json({ error: 'Update failed' });
    res.json({ success: true, message: 'Profile updated' });
  });
});

// Legacy Change Password
app.post('/api/profile/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const { uid, role } = req.user;
  
  const table = role === 'vendor' ? 'vendors' : 'users';
  
  db.get(`SELECT password FROM ${table} WHERE uid = ?`, [uid], async (err, user) => {
    if (err || !user) return res.status(500).json({ error: 'User not found' });
    
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    db.run(`UPDATE ${table} SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE uid = ?`, 
      [hashedPassword, uid], function(err) {
      if (err) return res.status(500).json({ error: 'Password update failed' });
      res.json({ success: true, message: 'Password changed successfully' });
    });
  });
});

// ============ FEEDBACK ROUTES ============

// Submit Feedback
app.post('/api/feedback', authenticateToken, (req, res) => {
  const { rating, category, message } = req.body;
  const userId = req.user.uid;
  const feedbackId = 'FDB_' + Date.now();

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Invalid rating' });
  }

  if (!category || !message) {
    return res.status(400).json({ error: 'Category and message are required' });
  }

  db.run(
    `INSERT INTO feedback (feedback_id, user_id, rating, category, message)
     VALUES (?, ?, ?, ?, ?)`,
    [feedbackId, userId, rating, category, message],
    function(err) {
      if (err) {
        console.error('Error submitting feedback:', err);
        return res.status(500).json({ error: 'Failed to submit feedback' });
      }
      res.json({ success: true, feedbackId });
    }
  );
});

// Get Vendor Feedback
app.get('/api/vendor/feedback', authenticateToken, (req, res) => {
  if (req.user.role !== 'vendor') {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.all(`
    SELECT f.*, u.name as user_name, u.email as user_email
    FROM feedback f
    JOIN users u ON f.user_id = u.uid
    ORDER BY f.created_at DESC
    LIMIT 100
  `, [], (err, feedback) => {
    if (err) {
      console.error('Error fetching feedback:', err);
      return res.status(500).json({ error: 'Failed to fetch feedback' });
    }
    res.json(feedback);
  });
});

// ============ HEALTH CHECK ENDPOINT ============
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    googleOAuth: !!googleClient,
    razorpay: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    database: 'connected'
  });
});

// ============ SOCKET.IO CONNECTION HANDLING ============
io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);

  socket.on('authenticate', (token) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.uid;
      socket.userRole = decoded.role;
      console.log(`👤 User authenticated: ${decoded.uid} (${decoded.role})`);
    } catch (error) {
      console.error('❌ Socket authentication failed:', error.message);
      socket.emit('auth-error', { error: 'Invalid token' });
    }
  });

  socket.on('vendor-join', (vendorId) => {
    socket.join(`vendor-${vendorId}`);
    console.log(`🏪 Vendor ${vendorId} joined their room`);
  });

  socket.on('student-join', (studentId) => {
    socket.join(`student-${studentId}`);
    console.log(`👤 Student ${studentId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// ============ ERROR HANDLING MIDDLEWARE ============
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  
  if (err.message === 'Only image files are allowed!') {
    return res.status(400).json({ error: err.message });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ============ 404 HANDLER ============
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// ============ START SERVER ============
server.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 CANTEEN BACKEND SERVER RUNNING');
  console.log('='.repeat(60));
  console.log(`📡 Server URL: http://localhost:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log('');
  console.log('💾 Database: SQLite (canteen.db)');
  console.log('🔌 WebSocket: Active');
  console.log('🖼️  Image Upload: Enabled');
  console.log(`📁 Upload Directory: ${uploadsDir}`);
  console.log('');
  console.log('🔐 Authentication:');
  console.log(`   Google OAuth: ${googleClient ? '✅ Configured' : '❌ Not Configured'}`);
  if (process.env.GOOGLE_CLIENT_ID) {
    console.log(`   - Client ID: ${process.env.GOOGLE_CLIENT_ID.substring(0, 30)}...`);
  }
  console.log('');
  console.log('💳 Payment Gateway:');
  console.log(`   Razorpay: ${process.env.RAZORPAY_KEY_ID ? '✅ Configured' : '❌ Not Configured'}`);
  if (process.env.RAZORPAY_KEY_ID) {
    console.log(`   - Key ID: ${process.env.RAZORPAY_KEY_ID}`);
  }
  console.log('');
  console.log('📧 Email Service:');
  console.log(`   ${process.env.EMAIL_USER ? '✅ Configured' : '❌ Not Configured'}`);
  console.log('');
  console.log('🍜 Raw Materials System: ✅ Enabled');
  console.log('');
  console.log('='.repeat(60));
  console.log('✨ Ready to serve!');
  console.log('');
  console.log('📋 Available Endpoints:');
  console.log('   Auth: /api/auth/login, /api/auth/signup, /api/auth/google');
  console.log('   Menu: /api/menu (GET/POST/PUT/DELETE)');
  console.log('   Raw Materials: /api/raw-materials (GET/PUT)');
  console.log('   Orders: /api/orders/*, /api/vendor/orders/*');
  console.log('   Analytics: /api/vendor/analytics/*');
  console.log('   Profile: /api/users/profile, /api/users/password');
  console.log('   Payments: /api/payments/history');
  console.log('   Feedback: /api/feedback');
  console.log('='.repeat(60));
  console.log('');
});

// ============ START CRON JOBS ============
try {
  startOrderCancellationJob();
  startPaymentHistoryCleanup();
  console.log('✅ Cron jobs started successfully\n');
} catch (error) {
  console.error('⚠️  Error starting cron jobs:', error.message);
}

// ============ GRACEFUL SHUTDOWN ============
process.on('SIGTERM', () => {
  console.log('\n📴 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ HTTP server closed');
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err);
      } else {
        console.log('✅ Database connection closed');
      }
      process.exit(0);
    });
  });
  
  setTimeout(() => {
    console.error('⚠️  Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
});

process.on('SIGINT', () => {
  console.log('\n📴 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ HTTP server closed');
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err);
      } else {
        console.log('✅ Database connection closed');
      }
      process.exit(0);
    });
  });
  
  setTimeout(() => {
    console.error('⚠️  Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
});

// ============ UNHANDLED ERRORS ============
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  server.close(() => {
    process.exit(1);
  });
});

// ============ EXPORT FOR TESTING ============
module.exports = { app, server, io };