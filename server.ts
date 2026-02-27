import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from './server/db.js';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

function calculateIsOpen(shop: any) {
  if (!shop.auto_availability) return shop.is_open;
  try {
    const schedule = typeof shop.schedule === 'string' ? JSON.parse(shop.schedule || '{}') : (shop.schedule || {});
    const now = new Date();
    const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const daySchedule = schedule[currentDay] || [];
    return daySchedule.some((interval: any) => currentTime >= interval.start && currentTime <= interval.end) ? 1 : 0;
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
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, role: user.role, shop_id: user.shop_id }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ token, user: { id: user.id, role: user.role, shop_id: user.shop_id, email: user.email } });
});

app.post('/api/auth/register', (req, res) => {
  const { email, password } = req.body;
  try {
    const hash = bcrypt.hashSync(password, 10);
    const info = db.prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)').run(email, hash, 'customer');
    const user = { id: info.lastInsertRowid, role: 'customer', email };
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user });
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// --- PUBLIC ROUTES ---
app.get('/api/areas', (req, res) => {
  const areas = db.prepare("SELECT * FROM areas WHERE status = 'active'").all();
  res.json(areas);
});

app.get('/api/areas/:id/categories', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories WHERE area_id = ?').all(req.params.id) as any[];
  res.json(categories.map(c => ({ ...c, filters: JSON.parse(c.filters || '[]') })));
});

app.get('/api/shops', (req, res) => {
  const { area_id, category, search } = req.query;
  let query = "SELECT shops.*, areas.name as area_name FROM shops LEFT JOIN areas ON shops.area_id = areas.id WHERE shops.status = 'active'";
  const params: any[] = [];
  if (area_id) { query += ' AND area_id = ?'; params.push(area_id); }
  if (category) { query += ' AND category = ?'; params.push(category); }
  if (search) { query += ' AND shops.name LIKE ?'; params.push(`%${search}%`); }
  const shops = db.prepare(query).all(...params) as any[];
  res.json(shops.map(s => ({ 
    ...s, 
    active_filters: JSON.parse(s.active_filters || '[]'),
    schedule: JSON.parse(s.schedule || '{}'),
    is_open: calculateIsOpen(s)
  })));
});

app.get('/api/shops/:id', (req, res) => {
  const shop = db.prepare('SELECT shops.*, areas.name as area_name FROM shops LEFT JOIN areas ON shops.area_id = areas.id WHERE shops.id = ?').get(req.params.id) as any;
  if (!shop) return res.status(404).json({ error: 'Shop not found' });
  
  shop.is_open = calculateIsOpen(shop);
  
  const galleries = db.prepare('SELECT * FROM galleries WHERE shop_id = ?').all(shop.id) as any[];
  for (const g of galleries) {
    g.images = db.prepare('SELECT * FROM gallery_images WHERE gallery_id = ?').all(g.id);
  }
  shop.galleries = galleries;

  if (shop.enable_product_table) {
    const config = db.prepare('SELECT * FROM product_table_configs WHERE shop_id = ?').get(shop.id) as any;
    shop.product_columns = config ? JSON.parse(config.columns) : [];
    const rows = db.prepare('SELECT * FROM product_rows WHERE shop_id = ?').all(shop.id) as any[];
    shop.product_rows = rows.map(r => ({ id: r.id, ...JSON.parse(r.data) }));
  }
  
  res.json(shop);
});

// --- ADMIN ROUTES ---
app.get('/api/admin/dashboard', authenticate, requireAdmin, (req, res) => {
  const totalAreas = db.prepare('SELECT COUNT(*) as count FROM areas').get() as any;
  const totalShops = db.prepare('SELECT COUNT(*) as count FROM shops').get() as any;
  const activeShops = db.prepare("SELECT COUNT(*) as count FROM shops WHERE status = 'active'").get() as any;
  res.json({ totalAreas: totalAreas.count, totalShops: totalShops.count, activeShops: activeShops.count });
});

app.get('/api/admin/areas', authenticate, requireAdmin, (req, res) => {
  res.json(db.prepare('SELECT * FROM areas').all());
});

app.post('/api/admin/areas', authenticate, requireAdmin, (req, res) => {
  const { name } = req.body;
  const info = db.prepare('INSERT INTO areas (name) VALUES (?)').run(name);
  res.json({ id: info.lastInsertRowid, name, status: 'active' });
});

app.put('/api/admin/areas/:id', authenticate, requireAdmin, (req, res) => {
  const { name, status } = req.body;
  db.prepare('UPDATE areas SET name = ?, status = ? WHERE id = ?').run(name, status, req.params.id);
  res.json({ success: true });
});

app.post('/api/admin/areas/:id/categories', authenticate, requireAdmin, (req, res) => {
  const { name, icon, filters } = req.body;
  const filtersJson = JSON.stringify(filters || []);
  const info = db.prepare('INSERT INTO categories (area_id, name, icon, filters) VALUES (?, ?, ?, ?)').run(req.params.id, name, icon || 'Store', filtersJson);
  res.json({ id: info.lastInsertRowid, area_id: req.params.id, name, icon: icon || 'Store', filters: filters || [] });
});

app.put('/api/admin/categories/:id', authenticate, requireAdmin, (req, res) => {
  const { name, icon, filters } = req.body;
  const filtersJson = JSON.stringify(filters || []);
  const oldCat = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id) as any;
  if (oldCat && oldCat.name !== name) {
    db.prepare('UPDATE shops SET category = ? WHERE area_id = ? AND category = ?').run(name, oldCat.area_id, oldCat.name);
  }
  db.prepare('UPDATE categories SET name = ?, icon = ?, filters = ? WHERE id = ?').run(name, icon, filtersJson, req.params.id);
  res.json({ success: true });
});

app.delete('/api/admin/categories/:id', authenticate, requireAdmin, (req, res) => {
  const oldCat = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id) as any;
  if (oldCat) {
    db.prepare('UPDATE shops SET category = NULL WHERE area_id = ? AND category = ?').run(oldCat.area_id, oldCat.name);
  }
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/admin/categories/:id/shops', authenticate, requireAdmin, (req, res) => {
  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id) as any;
  if (!category) return res.status(404).json({ error: 'Category not found' });
  const shops = db.prepare('SELECT * FROM shops WHERE area_id = ? AND category = ?').all(category.area_id, category.name);
  res.json(shops);
});

app.get('/api/admin/shops', authenticate, requireAdmin, (req, res) => {
  res.json(db.prepare('SELECT shops.*, areas.name as area_name FROM shops LEFT JOIN areas ON shops.area_id = areas.id').all());
});

app.post('/api/admin/shops', authenticate, requireAdmin, (req, res) => {
  const { name, category, area_id } = req.body;
  const info = db.prepare('INSERT INTO shops (name, category, area_id) VALUES (?, ?, ?)').run(name, category, area_id);
  res.json({ id: info.lastInsertRowid, name, category, area_id, status: 'active' });
});

app.put('/api/admin/shops/:id', authenticate, requireAdmin, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE shops SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

app.post('/api/admin/users', authenticate, requireAdmin, (req, res) => {
  const { email, password, role, shop_id } = req.body;
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO users (email, password_hash, role, shop_id) VALUES (?, ?, ?, ?)').run(email, hash, role, shop_id || null);
  res.json({ id: info.lastInsertRowid, email, role, shop_id });
});

// --- SHOP OWNER ROUTES ---
app.get('/api/owner/shop', authenticate, requireShopOwner, (req: any, res) => {
  const shop = db.prepare('SELECT * FROM shops WHERE id = ?').get(req.user.shop_id) as any;
  if (shop) {
    shop.active_filters = JSON.parse(shop.active_filters || '[]');
    shop.schedule = JSON.parse(shop.schedule || '{}');
  }
  res.json(shop);
});

app.put('/api/owner/shop', authenticate, requireShopOwner, (req: any, res) => {
  const { name, description, address, contact_number, google_map_link, enable_product_table, active_filters, is_open, auto_availability, schedule } = req.body;
  const filtersJson = JSON.stringify(active_filters || []);
  const scheduleJson = JSON.stringify(schedule || {});
  db.prepare(`
    UPDATE shops SET name = ?, description = ?, address = ?, contact_number = ?, google_map_link = ?, enable_product_table = ?, active_filters = ?, is_open = ?, auto_availability = ?, schedule = ?
    WHERE id = ?
  `).run(name, description, address, contact_number, google_map_link, enable_product_table ? 1 : 0, filtersJson, is_open ? 1 : 0, auto_availability ? 1 : 0, scheduleJson, req.user.shop_id);
  res.json({ success: true });
});

app.get('/api/owner/galleries', authenticate, requireShopOwner, (req: any, res) => {
  const galleries = db.prepare('SELECT * FROM galleries WHERE shop_id = ?').all(req.user.shop_id) as any[];
  for (const g of galleries) {
    g.images = db.prepare('SELECT * FROM gallery_images WHERE gallery_id = ?').all(g.id);
  }
  res.json(galleries);
});

app.post('/api/owner/galleries', authenticate, requireShopOwner, (req: any, res) => {
  const { folder_name } = req.body;
  const info = db.prepare('INSERT INTO galleries (shop_id, folder_name) VALUES (?, ?)').run(req.user.shop_id, folder_name);
  res.json({ id: info.lastInsertRowid, folder_name, images: [] });
});

app.post('/api/owner/galleries/:id/images', authenticate, requireShopOwner, (req: any, res) => {
  const { image_url } = req.body;
  const info = db.prepare('INSERT INTO gallery_images (gallery_id, image_url) VALUES (?, ?)').run(req.params.id, image_url);
  res.json({ id: info.lastInsertRowid, image_url });
});

app.delete('/api/owner/galleries/images/:id', authenticate, requireShopOwner, (req: any, res) => {
  db.prepare('DELETE FROM gallery_images WHERE id = ?').run(Number(req.params.id));
  res.json({ success: true });
});

app.delete('/api/owner/galleries/:id', authenticate, requireShopOwner, (req: any, res) => {
  const galleryId = Number(req.params.id);
  const shopId = req.user.shop_id;
  
  // Verify the gallery belongs to the shop owner
  const gallery = db.prepare('SELECT id FROM galleries WHERE id = ? AND shop_id = ?').get(galleryId, shopId);
  if (!gallery) {
    return res.status(404).json({ error: 'Gallery not found or unauthorized' });
  }

  // Delete images first due to foreign key constraint (if not using ON DELETE CASCADE)
  db.prepare('DELETE FROM gallery_images WHERE gallery_id = ?').run(galleryId);
  // Delete the gallery
  db.prepare('DELETE FROM galleries WHERE id = ?').run(galleryId);
  
  res.json({ success: true });
});

app.get('/api/owner/products', authenticate, requireShopOwner, (req: any, res) => {
  const config = db.prepare('SELECT * FROM product_table_configs WHERE shop_id = ?').get(req.user.shop_id) as any;
  const rows = db.prepare('SELECT * FROM product_rows WHERE shop_id = ?').all(req.user.shop_id) as any[];
  res.json({
    columns: config ? JSON.parse(config.columns) : [],
    rows: rows.map(r => ({ id: r.id, ...JSON.parse(r.data) }))
  });
});

app.post('/api/owner/products/config', authenticate, requireShopOwner, (req: any, res) => {
  const { columns } = req.body;
  db.prepare('INSERT INTO product_table_configs (shop_id, columns) VALUES (?, ?) ON CONFLICT(shop_id) DO UPDATE SET columns = excluded.columns').run(req.user.shop_id, JSON.stringify(columns));
  res.json({ success: true });
});

app.post('/api/owner/products/rows', authenticate, requireShopOwner, (req: any, res) => {
  const { data } = req.body;
  const info = db.prepare('INSERT INTO product_rows (shop_id, data) VALUES (?, ?)').run(req.user.shop_id, JSON.stringify(data));
  res.json({ id: info.lastInsertRowid, ...data });
});

app.delete('/api/owner/products/rows/:id', authenticate, requireShopOwner, (req: any, res) => {
  db.prepare('DELETE FROM product_rows WHERE id = ? AND shop_id = ?').run(Number(req.params.id), req.user.shop_id);
  res.json({ success: true });
});

// --- VITE MIDDLEWARE ---
async function startServer() {
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
