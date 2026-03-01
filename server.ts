import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db, { initDB } from './server/db.js';

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

function calculateIsOpen(shop: any) {
  if (!shop.auto_availability) return shop.is_open;
  try {
    const schedule = typeof shop.schedule === 'string' ? JSON.parse(shop.schedule || '{}') : (shop.schedule || {});
    const now = new Date();
    const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const daySchedule = schedule[currentDay] || [];
    return daySchedule.some((interval: any) => currentTime >= interval.start && currentTime <= interval.end) ? true : false;
  } catch (e) {
    return shop.is_open;
  }
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
};

const requireShopOwner = (req: any, res: any, next: any) => {
  if (req.user.role !== 'shop_owner') return res.status(403).json({ error: 'Forbidden' });
  next();
};

// --- AUTH ROUTES ---
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = userRes.rows[0];
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, role: user.role, shop_id: user.shop_id }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ token, user: { id: user.id, role: user.role, shop_id: user.shop_id, email: user.email } });
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hash = bcrypt.hashSync(password, 10);
    const info = await db.query('INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id', [email, hash, 'customer']);
    const user = { id: info.rows[0].id, role: 'customer', email };
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user });
  } catch (err: any) {
    if (err.code === '23505') { // PostgreSQL unique violation
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// --- PUBLIC ROUTES ---
app.get('/api/areas', async (req, res) => {
  const areas = await db.query("SELECT * FROM areas WHERE status = 'active'");
  res.json(areas.rows);
});

app.get('/api/areas/:id/categories', async (req, res) => {
  const categories = await db.query('SELECT * FROM categories WHERE area_id = $1', [req.params.id]);
  res.json(categories.rows.map(c => ({ ...c, filters: JSON.parse(c.filters || '[]') })));
});

app.get('/api/shops', async (req, res) => {
  const { area_id, category, search } = req.query;
  let query = "SELECT shops.*, areas.name as area_name FROM shops LEFT JOIN areas ON shops.area_id = areas.id WHERE shops.status = 'active'";
  const params: any[] = [];
  let paramIndex = 1;
  
  if (area_id) { query += ` AND area_id = $${paramIndex++}`; params.push(area_id); }
  if (category) { query += ` AND category = $${paramIndex++}`; params.push(category); }
  if (search) { query += ` AND shops.name ILIKE $${paramIndex++}`; params.push(`%${search}%`); }
  
  const shops = await db.query(query, params);
  res.json(shops.rows.map(s => ({ 
    ...s, 
    active_filters: JSON.parse(s.active_filters || '[]'),
    schedule: JSON.parse(s.schedule || '{}'),
    is_open: calculateIsOpen(s)
  })));
});

app.get('/api/shops/:id', async (req, res) => {
  const shopRes = await db.query('SELECT shops.*, areas.name as area_name FROM shops LEFT JOIN areas ON shops.area_id = areas.id WHERE shops.id = $1', [req.params.id]);
  const shop = shopRes.rows[0];
  if (!shop) return res.status(404).json({ error: 'Shop not found' });
  
  shop.is_open = calculateIsOpen(shop);
  
  const galleriesRes = await db.query('SELECT * FROM galleries WHERE shop_id = $1', [shop.id]);
  const galleries = galleriesRes.rows;
  for (const g of galleries) {
    const imagesRes = await db.query('SELECT * FROM gallery_images WHERE gallery_id = $1', [g.id]);
    g.images = imagesRes.rows;
  }
  shop.galleries = galleries;

  if (shop.enable_product_table) {
    const configRes = await db.query('SELECT * FROM product_table_configs WHERE shop_id = $1', [shop.id]);
    const config = configRes.rows[0];
    shop.product_columns = config ? JSON.parse(config.columns) : [];
    const rowsRes = await db.query('SELECT * FROM product_rows WHERE shop_id = $1', [shop.id]);
    shop.product_rows = rowsRes.rows.map(r => ({ id: r.id, ...JSON.parse(r.data) }));
  }
  
  res.json(shop);
});

// --- ADMIN ROUTES ---
app.get('/api/admin/dashboard', authenticate, requireAdmin, async (req, res) => {
  const totalAreas = await db.query('SELECT COUNT(*) as count FROM areas');
  const totalShops = await db.query('SELECT COUNT(*) as count FROM shops');
  const activeShops = await db.query("SELECT COUNT(*) as count FROM shops WHERE status = 'active'");
  res.json({ 
    totalAreas: parseInt(totalAreas.rows[0].count), 
    totalShops: parseInt(totalShops.rows[0].count), 
    activeShops: parseInt(activeShops.rows[0].count) 
  });
});

app.get('/api/admin/areas', authenticate, requireAdmin, async (req, res) => {
  const areas = await db.query('SELECT * FROM areas');
  res.json(areas.rows);
});

app.post('/api/admin/areas', authenticate, requireAdmin, async (req, res) => {
  const { name } = req.body;
  const info = await db.query('INSERT INTO areas (name) VALUES ($1) RETURNING id', [name]);
  res.json({ id: info.rows[0].id, name, status: 'active' });
});

app.put('/api/admin/areas/:id', authenticate, requireAdmin, async (req, res) => {
  const { name, status } = req.body;
  await db.query('UPDATE areas SET name = $1, status = $2 WHERE id = $3', [name, status, req.params.id]);
  res.json({ success: true });
});

app.post('/api/admin/areas/:id/categories', authenticate, requireAdmin, async (req, res) => {
  const { name, icon, filters } = req.body;
  const filtersJson = JSON.stringify(filters || []);
  const info = await db.query('INSERT INTO categories (area_id, name, icon, filters) VALUES ($1, $2, $3, $4) RETURNING id', [req.params.id, name, icon || 'Store', filtersJson]);
  res.json({ id: info.rows[0].id, area_id: req.params.id, name, icon: icon || 'Store', filters: filters || [] });
});

app.put('/api/admin/categories/:id', authenticate, requireAdmin, async (req, res) => {
  const { name, icon, filters } = req.body;
  const filtersJson = JSON.stringify(filters || []);
  const oldCatRes = await db.query('SELECT * FROM categories WHERE id = $1', [req.params.id]);
  const oldCat = oldCatRes.rows[0];
  if (oldCat && oldCat.name !== name) {
    await db.query('UPDATE shops SET category = $1 WHERE area_id = $2 AND category = $3', [name, oldCat.area_id, oldCat.name]);
  }
  await db.query('UPDATE categories SET name = $1, icon = $2, filters = $3 WHERE id = $4', [name, icon, filtersJson, req.params.id]);
  res.json({ success: true });
});

app.delete('/api/admin/categories/:id', authenticate, requireAdmin, async (req, res) => {
  const oldCatRes = await db.query('SELECT * FROM categories WHERE id = $1', [req.params.id]);
  const oldCat = oldCatRes.rows[0];
  if (oldCat) {
    await db.query('UPDATE shops SET category = NULL WHERE area_id = $1 AND category = $2', [oldCat.area_id, oldCat.name]);
  }
  await db.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

app.get('/api/admin/categories/:id/shops', authenticate, requireAdmin, async (req, res) => {
  const categoryRes = await db.query('SELECT * FROM categories WHERE id = $1', [req.params.id]);
  const category = categoryRes.rows[0];
  if (!category) return res.status(404).json({ error: 'Category not found' });
  const shops = await db.query('SELECT * FROM shops WHERE area_id = $1 AND category = $2', [category.area_id, category.name]);
  res.json(shops.rows);
});

app.get('/api/admin/shops', authenticate, requireAdmin, async (req, res) => {
  const shops = await db.query('SELECT shops.*, areas.name as area_name FROM shops LEFT JOIN areas ON shops.area_id = areas.id');
  res.json(shops.rows);
});

app.post('/api/admin/shops', authenticate, requireAdmin, async (req, res) => {
  const { name, category, area_id } = req.body;
  const info = await db.query('INSERT INTO shops (name, category, area_id) VALUES ($1, $2, $3) RETURNING id', [name, category, area_id]);
  res.json({ id: info.rows[0].id, name, category, area_id, status: 'active' });
});

app.put('/api/admin/shops/:id', authenticate, requireAdmin, async (req, res) => {
  const { status } = req.body;
  await db.query('UPDATE shops SET status = $1 WHERE id = $2', [status, req.params.id]);
  res.json({ success: true });
});

app.post('/api/admin/users', authenticate, requireAdmin, async (req, res) => {
  const { email, password, role, shop_id } = req.body;
  const hash = bcrypt.hashSync(password, 10);
  const info = await db.query('INSERT INTO users (email, password_hash, role, shop_id) VALUES ($1, $2, $3, $4) RETURNING id', [email, hash, role, shop_id || null]);
  res.json({ id: info.rows[0].id, email, role, shop_id });
});

// --- SHOP OWNER ROUTES ---
app.get('/api/owner/shop', authenticate, requireShopOwner, async (req: any, res) => {
  const shopRes = await db.query('SELECT * FROM shops WHERE id = $1', [req.user.shop_id]);
  const shop = shopRes.rows[0];
  if (shop) {
    shop.active_filters = JSON.parse(shop.active_filters || '[]');
    shop.schedule = JSON.parse(shop.schedule || '{}');
  }
  res.json(shop);
});

app.put('/api/owner/shop', authenticate, requireShopOwner, async (req: any, res) => {
  const { name, description, address, contact_number, google_map_link, enable_product_table, active_filters, is_open, auto_availability, schedule } = req.body;
  const filtersJson = JSON.stringify(active_filters || []);
  const scheduleJson = JSON.stringify(schedule || {});
  await db.query(`
    UPDATE shops SET name = $1, description = $2, address = $3, contact_number = $4, google_map_link = $5, enable_product_table = $6, active_filters = $7, is_open = $8, auto_availability = $9, schedule = $10
    WHERE id = $11
  `, [name, description, address, contact_number, google_map_link, enable_product_table ? true : false, filtersJson, is_open ? true : false, auto_availability ? true : false, scheduleJson, req.user.shop_id]);
  res.json({ success: true });
});

app.get('/api/owner/galleries', authenticate, requireShopOwner, async (req: any, res) => {
  const galleriesRes = await db.query('SELECT * FROM galleries WHERE shop_id = $1', [req.user.shop_id]);
  const galleries = galleriesRes.rows;
  for (const g of galleries) {
    const imagesRes = await db.query('SELECT * FROM gallery_images WHERE gallery_id = $1', [g.id]);
    g.images = imagesRes.rows;
  }
  res.json(galleries);
});

app.post('/api/owner/galleries', authenticate, requireShopOwner, async (req: any, res) => {
  const { folder_name } = req.body;
  const info = await db.query('INSERT INTO galleries (shop_id, folder_name) VALUES ($1, $2) RETURNING id', [req.user.shop_id, folder_name]);
  res.json({ id: info.rows[0].id, folder_name, images: [] });
});

app.post('/api/owner/galleries/:id/images', authenticate, requireShopOwner, async (req: any, res) => {
  const { image_url } = req.body;
  const info = await db.query('INSERT INTO gallery_images (gallery_id, image_url) VALUES ($1, $2) RETURNING id', [req.params.id, image_url]);
  res.json({ id: info.rows[0].id, image_url });
});

app.delete('/api/owner/galleries/images/:id', authenticate, requireShopOwner, async (req: any, res) => {
  await db.query('DELETE FROM gallery_images WHERE id = $1', [Number(req.params.id)]);
  res.json({ success: true });
});

app.delete('/api/owner/galleries/:id', authenticate, requireShopOwner, async (req: any, res) => {
  const galleryId = Number(req.params.id);
  const shopId = req.user.shop_id;
  
  const galleryRes = await db.query('SELECT id FROM galleries WHERE id = $1 AND shop_id = $2', [galleryId, shopId]);
  if (galleryRes.rows.length === 0) {
    return res.status(404).json({ error: 'Gallery not found or unauthorized' });
  }

  await db.query('DELETE FROM gallery_images WHERE gallery_id = $1', [galleryId]);
  await db.query('DELETE FROM galleries WHERE id = $1', [galleryId]);
  
  res.json({ success: true });
});

app.get('/api/owner/products', authenticate, requireShopOwner, async (req: any, res) => {
  const configRes = await db.query('SELECT * FROM product_table_configs WHERE shop_id = $1', [req.user.shop_id]);
  const config = configRes.rows[0];
  const rowsRes = await db.query('SELECT * FROM product_rows WHERE shop_id = $1', [req.user.shop_id]);
  res.json({
    columns: config ? JSON.parse(config.columns) : [],
    rows: rowsRes.rows.map(r => ({ id: r.id, ...JSON.parse(r.data) }))
  });
});

app.post('/api/owner/products/config', authenticate, requireShopOwner, async (req: any, res) => {
  const { columns } = req.body;
  await db.query('INSERT INTO product_table_configs (shop_id, columns) VALUES ($1, $2) ON CONFLICT(shop_id) DO UPDATE SET columns = EXCLUDED.columns', [req.user.shop_id, JSON.stringify(columns)]);
  res.json({ success: true });
});

app.post('/api/owner/products/rows', authenticate, requireShopOwner, async (req: any, res) => {
  const { data } = req.body;
  const info = await db.query('INSERT INTO product_rows (shop_id, data) VALUES ($1, $2) RETURNING id', [req.user.shop_id, JSON.stringify(data)]);
  res.json({ id: info.rows[0].id, ...data });
});

app.delete('/api/owner/products/rows/:id', authenticate, requireShopOwner, async (req: any, res) => {
  await db.query('DELETE FROM product_rows WHERE id = $1 AND shop_id = $2', [Number(req.params.id), req.user.shop_id]);
  res.json({ success: true });
});

// --- VITE MIDDLEWARE ---
async function startServer() {
  await initDB();
  
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
