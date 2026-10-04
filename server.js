const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { DatabaseSync } = require('node:sqlite');

const app = express();
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || !process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD)) {
  throw new Error('JWT_SECRET, ADMIN_USERNAME, and ADMIN_PASSWORD must be set in production.');
}
const JWT_SECRET = process.env.JWT_SECRET || 'nairobi-blaze-admin-secret';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(path.join(dataDir, 'site.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin_users (
    username TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    date_of_birth TEXT,
    age_group TEXT,
    gender TEXT,
    preferred_position TEXT,
    previous_club TEXT,
    parent_guardian TEXT,
    guardian_phone TEXT,
    email TEXT,
    payment_method TEXT,
    payment_reference TEXT,
    medical_information TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

const setDefaultSetting = (key, value) => {
  const existing = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  if (!existing) {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(key, value);
  }
};

setDefaultSetting('registration_open', process.env.REGISTRATION_OPEN === 'true' ? 'true' : 'false');
setDefaultSetting('registration_fee', '4500');
setDefaultSetting('monthly_subscription', '3500');
setDefaultSetting('admin_email', 'khalito90@gmail.com');

const adminExists = db.prepare('SELECT 1 FROM admin_users WHERE username = ?').get(ADMIN_USERNAME);
if (!adminExists) {
  const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
  db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run(ADMIN_USERNAME, passwordHash);
}

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

app.get('/healthz', (req, res) => {
  res.sendStatus(200);
});

const authRequired = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

const getSettings = () => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
};

app.get('/api/site-status', (req, res) => {
  const settings = getSettings();
  res.json({
    registration_open: settings.registration_open === 'true',
    registration_fee: Number(settings.registration_fee || 4500),
    monthly_subscription: Number(settings.monthly_subscription || 3500),
    admin_email: settings.admin_email || 'khalito90@gmail.com',
    admin_username: ADMIN_USERNAME,
  });
});

app.post('/api/register', (req, res) => {
  const settings = getSettings();
  if (settings.registration_open !== 'true') {
    return res.status(403).json({ message: 'Registration is currently closed. Please contact the admin.' });
  }

  const payload = req.body || {};
  const required = [
    'player-name',
    'date-of-birth',
    'age-group',
    'gender',
    'parent-guardian',
    'guardian-phone',
    'email',
    'payment-method',
    'payment-reference',
  ];

  const missing = required.filter((field) => !String(payload[field] || '').trim());
  if (missing.length > 0) {
    return res.status(400).json({ message: 'Missing required registration fields.' });
  }

  const insert = db.prepare(`
    INSERT INTO registrations (
      full_name,
      date_of_birth,
      age_group,
      gender,
      preferred_position,
      previous_club,
      parent_guardian,
      guardian_phone,
      email,
      payment_method,
      payment_reference,
      medical_information
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    payload['player-name'],
    payload['date-of-birth'],
    payload['age-group'],
    payload['gender'],
    payload['preferred-position'] || '',
    payload['previous-club'] || '',
    payload['parent-guardian'],
    payload['guardian-phone'],
    payload['email'],
    payload['payment-method'],
    payload['payment-reference'],
    payload['medical-information'] || ''
  );

  res.status(201).json({ message: 'Registration received successfully.' });
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  const user = db.prepare('SELECT username, password_hash FROM admin_users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }

  const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, username: user.username });
});

app.get('/api/admin/registrations', authRequired, (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM registrations
    ORDER BY created_at DESC
  `).all();

  res.json(rows);
});

app.get('/api/admin/settings', authRequired, (req, res) => {
  res.json(getSettings());
});

app.put('/api/admin/settings', authRequired, (req, res) => {
  const { registration_open, registration_fee, monthly_subscription, admin_email } = req.body || {};

  if (typeof registration_open !== 'undefined') {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
      .run('registration_open', String(Boolean(registration_open)));
  }

  if (typeof registration_fee !== 'undefined') {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
      .run('registration_fee', String(registration_fee));
  }

  if (typeof monthly_subscription !== 'undefined') {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
      .run('monthly_subscription', String(monthly_subscription));
  }

  if (typeof admin_email !== 'undefined') {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
      .run('admin_email', String(admin_email));
  }

  res.json(getSettings());
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Nairobi Blaze server running at http://localhost:${PORT}`);
});
