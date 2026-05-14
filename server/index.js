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

// Request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// ── Socket.io ──────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL, methods: ['GET', 'POST'] },
});
app.set('io', io);
io.on('connection', socket => {
  console.log('Socket connected:', socket.id);
  socket.on('join_room', room => socket.join(room));
  socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));
});
 
// ── Trust proxy (required on Render/Heroku/Railway) ───────────────────────
app.set('trust proxy', 1);

// ── Core middleware ────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
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

// ── S3 debug (remove after confirming) ───────────────────────────────────
app.get('/api/debug/s3', (_, res) => res.json({
  bucket:    process.env.AWS_S3_BUCKET    || 'NOT SET',
  region:    process.env.AWS_REGION       || 'NOT SET',
  keyId:     process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.slice(0,6) + '...' : 'NOT SET',
  secretSet: !!process.env.AWS_SECRET_ACCESS_KEY,
}));

// ── S3 write test ─────────────────────────────────────────────────────────
app.get('/api/debug/s3-write', async (_, res) => {
  try {
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    const s3 = new S3Client({
      region:   process.env.AWS_REGION,
      endpoint: `https://s3.${process.env.AWS_REGION}.amazonaws.com`,
      credentials: {
        accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    await s3.send(new PutObjectCommand({
      Bucket:      process.env.AWS_S3_BUCKET,
      Key:         'test/connection-test.txt',
      Body:        'Fugigeek S3 connection test',
      ContentType: 'text/plain',
    }));
    res.json({ success: true, message: 'File written to S3 successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: err.Code || err.code });
  }
});

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
