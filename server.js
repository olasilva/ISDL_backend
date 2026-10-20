// server/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRoutes from './src/routes/chat.js';

// ✅ Correct paths — routes are inside the "src" folder
import authRoutes from './src/routes/auth.js';
import inboxRoutes from './src/routes/inbox.js';
import outreachRoutes from './src/routes/outreach.js';
import updatesRoutes from './src/routes/updates.js';
import reviewsRoutes from './src/routes/reviews.js';
import projectRoutes from './src/routes/projects.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api/projects', projectRoutes);

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/inbox', inboxRoutes);
app.use('/api/outreach', outreachRoutes);
app.use('/api/updates', updatesRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});