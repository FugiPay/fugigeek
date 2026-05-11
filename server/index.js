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
 
// ── Core middleware ────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
// Stripe webhooks need raw body
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rate limiting ─────────────────────────────────────────────────────────
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/users',    require('./routes/users'));
app.use('/api/reviews',  require('./routes/reviews'));

// ── Health check ──────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ status: 'ok', platform: 'Fugigeek' }));

// ── Global error handler ──────────────────────────────────────────────────
app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => console.log(`Fugigeek server running on port ${PORT}`));
