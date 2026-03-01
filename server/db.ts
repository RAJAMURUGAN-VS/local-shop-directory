import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'database.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// Initialize Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS areas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS shops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    area_id INTEGER,
    address TEXT,
    contact_number TEXT,
    google_map_link TEXT,
    enable_product_table BOOLEAN DEFAULT 0,
    status TEXT DEFAULT 'active',
    FOREIGN KEY (area_id) REFERENCES areas(id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL,
    shop_id INTEGER,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    FOREIGN KEY (shop_id) REFERENCES shops(id)
  );

  CREATE TABLE IF NOT EXISTS product_table_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id INTEGER UNIQUE,
    columns TEXT, -- JSON array
    FOREIGN KEY (shop_id) REFERENCES shops(id)
  );

  CREATE TABLE IF NOT EXISTS product_rows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id INTEGER,
    data TEXT, -- JSON object
    FOREIGN KEY (shop_id) REFERENCES shops(id)
  );

  CREATE TABLE IF NOT EXISTS galleries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id INTEGER,
    folder_name TEXT NOT NULL,
    FOREIGN KEY (shop_id) REFERENCES shops(id)
  );

  CREATE TABLE IF NOT EXISTS gallery_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gallery_id INTEGER,
    image_url TEXT NOT NULL,
    FOREIGN KEY (gallery_id) REFERENCES galleries(id)
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    area_id INTEGER,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'Store',
    filters TEXT DEFAULT '[]',
    FOREIGN KEY (area_id) REFERENCES areas(id)
  );
`);

try { db.exec("ALTER TABLE categories ADD COLUMN filters TEXT DEFAULT '[]'"); } catch (e) {}
try { db.exec("ALTER TABLE shops ADD COLUMN active_filters TEXT DEFAULT '[]'"); } catch (e) {}
try { db.exec("ALTER TABLE shops ADD COLUMN is_open BOOLEAN DEFAULT 1"); } catch (e) {}
try { db.exec("ALTER TABLE shops ADD COLUMN auto_availability BOOLEAN DEFAULT 0"); } catch (e) {}
try { db.exec("ALTER TABLE shops ADD COLUMN schedule TEXT DEFAULT '{}'"); } catch (e) {}

// Seed Data
const seedData = () => {
  const adminExists = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@localshop.com');
  if (!adminExists) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (role, email, password_hash) VALUES (?, ?, ?)').run('admin', 'admin@localshop.com', hash);
  }

  const areaExists = db.prepare('SELECT * FROM areas LIMIT 1').get();
  if (!areaExists) {
    const areaId = db.prepare('INSERT INTO areas (name) VALUES (?)').run('Downtown').lastInsertRowid;
    
    const shopId = db.prepare(`
      INSERT INTO shops (name, description, category, area_id, address, contact_number, google_map_link, enable_product_table)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'The Fashion Hub',
      'Premium clothing and accessories.',
      'Apparel & Clothing',
      areaId,
      '123 Main St, Downtown',
      '555-0100',
      'https://maps.google.com/?q=123+Main+St',
      1
    ).lastInsertRowid;

    const ownerHash = bcrypt.hashSync('owner123', 10);
    db.prepare('INSERT INTO users (role, shop_id, email, password_hash) VALUES (?, ?, ?, ?)').run('shop_owner', shopId, 'owner@fashionhub.com', ownerHash);

    db.prepare('INSERT INTO product_table_configs (shop_id, columns) VALUES (?, ?)').run(shopId, JSON.stringify(['Item', 'Price', 'Size']));
    db.prepare('INSERT INTO product_rows (shop_id, data) VALUES (?, ?)').run(shopId, JSON.stringify({ Item: 'T-Shirt', Price: '$20', Size: 'M, L, XL' }));
    
    const galleryId = db.prepare('INSERT INTO galleries (shop_id, folder_name) VALUES (?, ?)').run(shopId, 'Collection').lastInsertRowid;
    db.prepare('INSERT INTO gallery_images (gallery_id, image_url) VALUES (?, ?)').run(galleryId, 'https://picsum.photos/seed/fashion1/400/400');
    db.prepare('INSERT INTO gallery_images (gallery_id, image_url) VALUES (?, ?)').run(galleryId, 'https://picsum.photos/seed/fashion2/400/400');

    const defaultCategories = [
      { name: 'Apparel & Clothing', icon: 'Shirt' },
      { name: 'Footwear', icon: 'ShoppingBag' },
      { name: 'Supermarkets & Groceries', icon: 'ShoppingBag' },
      { name: 'Restaurants & Cafés', icon: 'Utensils' },
      { name: 'Tea, Juice & Beverages', icon: 'Coffee' },
      { name: 'Electronics & Accessories', icon: 'Monitor' },
      { name: 'Beauty & Cosmetics', icon: 'Sparkles' },
      { name: 'Kids & Toys', icon: 'Baby' },
      { name: 'Home & Lifestyle', icon: 'Home' }
    ];
    
    const insertCat = db.prepare('INSERT INTO categories (area_id, name, icon) VALUES (?, ?, ?)');
    for (const cat of defaultCategories) {
      insertCat.run(areaId, cat.name, cat.icon);
    }
  }
};

seedData();

export default db;
