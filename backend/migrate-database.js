const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'canteen.db');
const db = new sqlite3.Database(dbPath);

console.log('========================================');
console.log('DATABASE MIGRATION - Adding Missing Columns');
console.log('========================================\n');

// Define all columns that should exist in users table
const requiredColumns = [
  { name: 'phone', type: 'TEXT', default: null },
  { name: 'balance', type: 'REAL', default: 0 },
  { name: 'profile_picture', type: 'TEXT', default: null },
  { name: 'google_id', type: 'TEXT', default: null },
  { name: 'email_verified', type: 'INTEGER', default: 0 },
  { name: 'otp_code', type: 'TEXT', default: null },
  { name: 'otp_expires_at', type: 'DATETIME', default: null },
  { name: 'canteen_join_code', type: 'TEXT', default: null },
  { name: 'role', type: 'TEXT', default: "'student'" },
  { name: 'updated_at', type: 'DATETIME', default: 'CURRENT_TIMESTAMP' }
];

db.serialize(() => {
  // Get current table schema
  db.all("PRAGMA table_info(users)", [], (err, columns) => {
    if (err) {
      console.error('❌ Error checking table schema:', err);
      db.close();
      return;
    }

    console.log('📋 Current columns in users table:');
    const existingColumns = columns.map(col => {
      console.log(`   - ${col.name} (${col.type})`);
      return col.name;
    });
    
    console.log('\n🔍 Checking for missing columns...\n');

    // Find missing columns
    const missingColumns = requiredColumns.filter(
      req => !existingColumns.includes(req.name)
    );

    if (missingColumns.length === 0) {
      console.log('✅ All required columns exist - no migration needed!\n');
      console.log('========================================');
      console.log('✅ Database is up to date!');
      console.log('========================================\n');
      db.close();
      return;
    }

    console.log(`📝 Found ${missingColumns.length} missing column(s):\n`);
    missingColumns.forEach(col => {
      console.log(`   - ${col.name} (${col.type})`);
    });
    console.log('');

    // Add missing columns one by one
    let addedCount = 0;
    let errorCount = 0;

    missingColumns.forEach((col, index) => {
      const defaultValue = col.default !== null ? `DEFAULT ${col.default}` : '';
      const sql = `ALTER TABLE users ADD COLUMN ${col.name} ${col.type} ${defaultValue}`;
      
      console.log(`📝 Adding: ${col.name}...`);
      
      db.run(sql, (err) => {
        if (err) {
          console.error(`   ❌ Error adding ${col.name}:`, err.message);
          errorCount++;
        } else {
          console.log(`   ✅ Added ${col.name} successfully!`);
          addedCount++;
        }

        // When all columns have been processed
        if (index === missingColumns.length - 1) {
          setTimeout(() => {
            // Verify final schema
            db.all("PRAGMA table_info(users)", [], (err, finalColumns) => {
              console.log('\n========================================');
              console.log('📊 MIGRATION SUMMARY');
              console.log('========================================');
              console.log(`✅ Successfully added: ${addedCount} column(s)`);
              if (errorCount > 0) {
                console.log(`❌ Failed to add: ${errorCount} column(s)`);
              }
              
              console.log('\n✅ Final users table schema:');
              finalColumns.forEach(col => {
                console.log(`   - ${col.name} (${col.type})`);
              });
              
              console.log('\n========================================');
              console.log('✅ Migration completed!');
              console.log('You can now restart your server.');
              console.log('========================================\n');
              
              db.close();
            });
          }, 100);
        }
      });
    });
  });
});