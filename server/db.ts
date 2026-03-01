import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

// Use a local fallback for development if DATABASE_URL is not set
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/localshop';

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS areas (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        status TEXT DEFAULT 'active'
      );

      CREATE TABLE IF NOT EXISTS shops (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        area_id INTEGER REFERENCES areas(id),
        address TEXT,
        contact_number TEXT,
        google_map_link TEXT,
        enable_product_table BOOLEAN DEFAULT false,
        status TEXT DEFAULT 'active',
        active_filters TEXT DEFAULT '[]',
        is_open BOOLEAN DEFAULT true,
        auto_availability BOOLEAN DEFAULT false,
        schedule TEXT DEFAULT '{}'
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        role TEXT NOT NULL,
        shop_id INTEGER REFERENCES shops(id),
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS product_table_configs (
        id SERIAL PRIMARY KEY,
        shop_id INTEGER UNIQUE REFERENCES shops(id),
        columns TEXT
      );

      CREATE TABLE IF NOT EXISTS product_rows (
        id SERIAL PRIMARY KEY,
        shop_id INTEGER REFERENCES shops(id),
        data TEXT
      );

      CREATE TABLE IF NOT EXISTS galleries (
        id SERIAL PRIMARY KEY,
        shop_id INTEGER REFERENCES shops(id),
        folder_name TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS gallery_images (
        id SERIAL PRIMARY KEY,
        gallery_id INTEGER REFERENCES galleries(id),
        image_url TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        area_id INTEGER REFERENCES areas(id),
        name TEXT NOT NULL,
        icon TEXT DEFAULT 'Store',
        filters TEXT DEFAULT '[]'
      );
    `);

    // Seed Data
    const adminRes = await pool.query('SELECT * FROM users WHERE email = $1', ['admin@localshop.com']);
    if (adminRes.rows.length === 0) {
      const hash = bcrypt.hashSync('admin123', 10);
      await pool.query('INSERT INTO users (role, email, password_hash) VALUES ($1, $2, $3)', ['admin', 'admin@localshop.com', hash]);
    }

    const areaRes = await pool.query('SELECT * FROM areas LIMIT 1');
    if (areaRes.rows.length === 0) {
      const areaInsert = await pool.query('INSERT INTO areas (name) VALUES ($1) RETURNING id', ['Downtown']);
      const areaId = areaInsert.rows[0].id;
      
      const shopInsert = await pool.query(`
        INSERT INTO shops (name, description, category, area_id, address, contact_number, google_map_link, enable_product_table)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
      `, [
        'The Fashion Hub',
        'Premium clothing and accessories.',
        'Apparel & Clothing',
        areaId,
        '123 Main St, Downtown',
        '555-0100',
        'https://maps.google.com/?q=123+Main+St',
        true
      ]);
      const shopId = shopInsert.rows[0].id;

      const ownerHash = bcrypt.hashSync('owner123', 10);
      await pool.query('INSERT INTO users (role, shop_id, email, password_hash) VALUES ($1, $2, $3, $4)', ['shop_owner', shopId, 'owner@fashionhub.com', ownerHash]);

      await pool.query('INSERT INTO product_table_configs (shop_id, columns) VALUES ($1, $2)', [shopId, JSON.stringify(['Item', 'Price', 'Size'])]);
      await pool.query('INSERT INTO product_rows (shop_id, data) VALUES ($1, $2)', [shopId, JSON.stringify({ Item: 'T-Shirt', Price: '$20', Size: 'M, L, XL' })]);
      
      const galleryInsert = await pool.query('INSERT INTO galleries (shop_id, folder_name) VALUES ($1, $2) RETURNING id', [shopId, 'Collection']);
      const galleryId = galleryInsert.rows[0].id;
      await pool.query('INSERT INTO gallery_images (gallery_id, image_url) VALUES ($1, $2)', [galleryId, 'https://picsum.photos/seed/fashion1/400/400']);
      await pool.query('INSERT INTO gallery_images (gallery_id, image_url) VALUES ($1, $2)', [galleryId, 'https://picsum.photos/seed/fashion2/400/400']);

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
      
      for (const cat of defaultCategories) {
        await pool.query('INSERT INTO categories (area_id, name, icon) VALUES ($1, $2, $3)', [areaId, cat.name, cat.icon]);
      }
    }
    console.log("Database initialized successfully");
  } catch (err) {
    console.error("Failed to initialize database", err);
  }
};

export default pool;
