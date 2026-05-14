const express    = require('express');
const http       = require('http');
const cors       = require('cors');
const dotenv     = require('dotenv');
const rateLimit  = require('express-rate-limit');
const { Server } = require('socket.io');
const connectDB  = require('./config/db');
const mongoose   = require('mongoose');

dotenv.config();
connectDB();
mongoose.connection.on('connected', () => {
  console.log('Connected to DB:', mongoose.connection.db.databaseName);
});
const app    = express();
const server = http.createServer(app);

// ── CORS origins ──────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL,
  'https://fugigeek-b7afc.web.app',
  'https://fugigeek.web.app',
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // mobile apps, Postman, curl
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
};

// Request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// ── Socket.io ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, methods: ['GET', 'POST'] },
});

// ── Trust proxy (required on Render/Heroku/Railway) ───────────────────────
app.set('trust proxy', 1);

// ── Core middleware ────────────────────────────────────────────────────────
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rate limiting ─────────────────────────────────────────────────────────
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  standardHeaders: true,
  legacyHeaders:   false,
}));

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/upload',        require('./routes/upload'));
app.use('/api/listings',      require('./routes/listings'));
app.use('/api/orders',        require('./routes/orders'));
app.use('/api/payments',      require('./routes/payments'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/reviews',       require('./routes/reviews'));
app.use('/api/messages',      require('./routes/messages'));
app.use('/api/notifications', require('./routes/notifications'));

// ── Health check ──────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ status: 'ok', platform: 'Fugigeek' }));

// ── Public categories (used by PostTask, Listings filters etc) ────────────
app.get('/api/categories', async (_, res) => {
  try {
    const Category = require('./models/Category');
    const categories = await Category.find({ isActive: true }).sort('order name').select('name icon');
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Platform stats (public) ───────────────────────────────────────────────
app.get('/api/stats', async (_, res) => {
  try {
    const User   = require('./models/User');
    const Task   = require('./models/Task');
    const Order  = require('./models/Order');
    const Review = require('./models/Review');

    const [professionals, clients, completedTasks, totalOrders, avgRating] = await Promise.all([
      User.countDocuments({ role: 'professional', isActive: true }),
      User.countDocuments({ role: { $in: ['business', 'individual'] }, isActive: true }),
      Task.countDocuments({ status: 'completed' }),
      Order.countDocuments({ status: 'completed' }),
      Review.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' } } }]),
    ]);

    const rating = avgRating[0]?.avg
      ? `${avgRating[0].avg.toFixed(1)}/5`
      : null;

    res.json({ success: true, stats: { professionals, clients, completedTasks, totalOrders, rating } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Global error handler ──────────────────────────────────────────────────
app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => console.log(`Fugigeek server running on port ${PORT}`));
