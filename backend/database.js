const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'canteen.db');
const db = new sqlite3.Database(dbPath);

// Initialize database with ENHANCED schema for all features
db.serialize(() => {
  
  // ==========================================
  // USERS TABLE - Enhanced with Google Auth, Profile Picture, Join Code
  // ==========================================
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      uid TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password TEXT,
      profile_picture TEXT,
      google_id TEXT UNIQUE,
      email_verified INTEGER DEFAULT 0,
      otp_code TEXT,
      otp_expires_at DATETIME,
      canteen_join_code TEXT,
      balance REAL DEFAULT 0,
      role TEXT DEFAULT 'student',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
    // In database.js, update the order_items table creation:

  // ==========================================
  // VENDORS TABLE - Enhanced with Profile Picture, Canteen Code
  // ==========================================
  db.run(`
    CREATE TABLE IF NOT EXISTS vendors (
      uid TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      profile_picture TEXT,
      google_id TEXT UNIQUE,
      canteen_code TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ==========================================
  // MENU ITEMS TABLE - Enhanced with Images, Categories, Meal Time Lock
  // ==========================================
  db.run(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      category TEXT NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      threshold INTEGER DEFAULT 5,
      image TEXT,
      image_url TEXT,
      description TEXT,
      
      -- MEAL TIME LOCK FEATURE
      is_meal_locked INTEGER DEFAULT 0,
      meal_start_time TEXT,
      meal_end_time TEXT,
      
      vendor_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (vendor_id) REFERENCES vendors(uid)
    )
  `);

  // ==========================================
  // ORDERS TABLE - Enhanced with Auto-cancel, Refund Logic
  // ==========================================
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      order_id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      vendor_id TEXT NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'active',
      payment_status TEXT DEFAULT 'pending',
      payment_id TEXT,
      razorpay_order_id TEXT,
      razorpay_payment_id TEXT,
      razorpay_signature TEXT,
      qr_data TEXT,
      
      -- AUTO-CANCEL & REFUND FEATURE
      auto_cancel_at DATETIME,
      cancelled_at DATETIME,
      cancellation_reason TEXT,
      refund_amount REAL,
      refund_status TEXT,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      
      FOREIGN KEY (student_id) REFERENCES users(uid),
      FOREIGN KEY (vendor_id) REFERENCES vendors(uid)
    )
  `);

  // ==========================================
  // ORDER ITEMS TABLE
  // ==========================================
  db.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      image_url TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(order_id),
      FOREIGN KEY (item_id) REFERENCES menu_items(id)
    )
  `);

  // ==========================================
  // PAYMENT HISTORY TABLE - Auto-delete after 7 days
  // ==========================================
  db.run(`
    CREATE TABLE IF NOT EXISTS payment_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      order_id TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT,
      payment_status TEXT,
      razorpay_payment_id TEXT,
      refund_amount REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(uid),
      FOREIGN KEY (order_id) REFERENCES orders(order_id)
    )
  `);

  // ==========================================
  // CATEGORIES TABLE - For menu organization
  // ==========================================
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ==========================================
  // INSERT DEFAULT CATEGORIES
  // ==========================================
  const defaultCategories = [
    ['cat_snacks', 'Snacks', 1],
    ['cat_meals', 'Meals', 2],
    ['cat_beverages', 'Beverages', 3],
    ['cat_desserts', 'Desserts', 4],
    ['cat_stationery', 'Stationery', 5]
  ];

  const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO categories (id, name, display_order)
    VALUES (?, ?, ?)
  `);

  defaultCategories.forEach(cat => {
    insertCategory.run(cat);
  });
  insertCategory.finalize();

  // ==========================================
  // CREATE DEMO VENDOR with Unique Canteen Code
  // ==========================================
  const vendorPassword = bcrypt.hashSync('vendor123', 10);
  const canteenCode = 'CANTEEN' + Math.random().toString(36).substring(2, 8).toUpperCase();
  
  db.run(`
    INSERT OR IGNORE INTO vendors (uid, name, email, password, canteen_code, profile_picture)
    VALUES (?, ?, ?, ?, ?, ?)
  `, ['vendor1', 'Campus Canteen', 'vendor@canteen.com', vendorPassword, canteenCode, 
      'https://api.dicebear.com/7.x/initials/svg?seed=Campus+Canteen']);

  // ==========================================
  // CREATE DEMO STUDENT
  // ==========================================
  const studentPassword = bcrypt.hashSync('student123', 10);
  db.run(`
    INSERT OR IGNORE INTO users (uid, name, email, password, email_verified, canteen_join_code, profile_picture)
    VALUES (?, ?, ?, ?, 1, ?, ?)
  `, ['student1', 'Demo Student', 'student@canteen.com', studentPassword, canteenCode,
      'https://api.dicebear.com/7.x/avataaars/svg?seed=student']);

  // ==========================================
  // INSERT DEMO MENU ITEMS with Images and Categories
  // ==========================================
  const menuItems = [
    // SNACKS
    ['item1', 'Samosa', 25, 'Snacks', 30, 5, '🥟', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop', 'Crispy triangular pastry with spiced filling', 0, null, null, 'vendor1'],
    ['item2', 'Vada Pav', 30, 'Snacks', 25, 5, '🍔', 'https://images.unsplash.com/photo-1606491956391-1a4e6b0da41e?w=400&h=300&fit=crop', 'Mumbai special potato fritter burger', 0, null, null, 'vendor1'],
    ['item3', 'Pakora', 35, 'Snacks', 20, 5, '🍤', 'https://images.unsplash.com/photo-1606491048234-8f8f9bbb8a96?w=400&h=300&fit=crop', 'Mixed vegetable fritters', 0, null, null, 'vendor1'],
    ['item4', 'Sandwich', 50, 'Snacks', 15, 5, '🥪', 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop', 'Grilled vegetable sandwich', 0, null, null, 'vendor1'],
    
    // MEALS (with meal time lock)
    ['item5', 'Chicken Biryani', 150, 'Meals', 20, 3, '🍛', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop', 'Aromatic basmati rice with chicken', 1, '12:00', '14:30', 'vendor1'],
    ['item6', 'Egg Rice', 80, 'Meals', 25, 5, '🍚', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop', 'Fried rice with scrambled eggs', 1, '12:00', '14:30', 'vendor1'],
    ['item7', 'Paneer Butter Masala', 120, 'Meals', 15, 3, '🍛', 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=300&fit=crop', 'Creamy cottage cheese curry', 1, '12:00', '14:30', 'vendor1'],
    ['item8', 'Dal Tadka', 70, 'Meals', 20, 5, '🍲', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop', 'Yellow lentils with spices', 1, '12:00', '14:30', 'vendor1'],
    
    // BEVERAGES
    ['item9', 'Masala Chai', 15, 'Beverages', 50, 10, '☕', 'https://images.unsplash.com/photo-1578899952107-9d0fa0c7e23b?w=400&h=300&fit=crop', 'Indian spiced tea', 0, null, null, 'vendor1'],
    ['item10', 'Cold Coffee', 40, 'Beverages', 30, 5, '🥤', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop', 'Chilled coffee with ice cream', 0, null, null, 'vendor1'],
    ['item11', 'Fresh Juice', 35, 'Beverages', 20, 5, '🧃', 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=300&fit=crop', 'Seasonal fresh juice', 0, null, null, 'vendor1'],
    ['item12', 'Lassi', 30, 'Beverages', 25, 5, '🥛', 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=400&h=300&fit=crop', 'Sweet yogurt drink', 0, null, null, 'vendor1'],
    
    // DESSERTS
    ['item13', 'Gulab Jamun', 35, 'Desserts', 30, 5, '🍡', 'https://images.unsplash.com/photo-1589785431819-9d0c3f1d9fdf?w=400&h=300&fit=crop', 'Sweet fried dough balls', 0, null, null, 'vendor1'],
    ['item14', 'Ice Cream', 30, 'Desserts', 40, 5, '🍦', 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop', 'Assorted flavors', 0, null, null, 'vendor1'],
    ['item15', 'Kheer', 40, 'Desserts', 20, 5, '🍮', 'https://images.unsplash.com/photo-1591900550346-3c1b2115b5a8?w=400&h=300&fit=crop', 'Rice pudding with cardamom', 0, null, null, 'vendor1'],
    
    // STATIONERY
    ['item16', 'Notebook', 50, 'Stationery', 15, 3, '📓', null, 'A4 ruled notebook', 0, null, null, 'vendor1'],
    ['item17', 'Pen Set', 40, 'Stationery', 20, 5, '🖊️', null, 'Blue/black pen set', 0, null, null, 'vendor1']
  ];

  const insertItem = db.prepare(`
    INSERT OR IGNORE INTO menu_items 
    (id, name, price, category, stock, threshold, image, image_url, description, 
     is_meal_locked, meal_start_time, meal_end_time, vendor_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
    // ✅ Add migration to add selected_addon column if it doesn't exist
db.run(`
  ALTER TABLE order_items ADD COLUMN is_default_meal INTEGER DEFAULT 0
`, (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.error('⚠️  Migration error (is_default_meal):', err.message);
  }
});

db.run(`
  ALTER TABLE order_items ADD COLUMN selected_addon TEXT
`, (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.error('⚠️  Migration error (selected_addon):', err.message);
  } else {
    console.log('✅ Added selected_addon column to order_items');
  }
});
  menuItems.forEach(item => {
    insertItem.run(item);
  });
  insertItem.finalize();

  console.log('✅ Database initialized successfully!');
  console.log('\n📧 Demo Credentials:');
  console.log('Student: student@canteen.com / student123');
  console.log('Vendor: vendor@canteen.com / vendor123');
  console.log(`\n🔑 Canteen Join Code: ${canteenCode}`);
  console.log('\n🖼️  Menu items with images and categories created!');
  console.log('🔒 Meal items have time-based ordering locks');
});


module.exports = db;