// server/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import chatRoutes from './src/routes/chat.js';
import authRoutes from './src/routes/auth.js';
import inboxRoutes from './src/routes/inbox.js';
import outreachRoutes from './src/routes/outreach.js';
import updatesRoutes from './src/routes/updates.js';
import reviewsRoutes from './src/routes/reviews.js';
import projectRoutes from './src/routes/projects.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS Configuration (Supports localhost, custom domains, and Vercel previews)
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }

    // Allow your specific custom domains
    if (origin === 'https://isdl.tech' || origin === 'https://www.isdl.tech') {
      return callback(null, true);
    }

    // Allow all Vercel deployments (both your frontend and backend)
    if (origin.includes('vercel.app')) {
      return callback(null, true);
    }

    // If none match, block the request
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/inbox', inboxRoutes);
app.use('/api/outreach', outreachRoutes);
app.use('/api/updates', updatesRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/projects', projectRoutes);

// Root route (Fix for the 404 when visiting the base URL)
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'ISDL Backend API is running. Visit /api/health to verify.' 
  });
});

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

// Start server (for local development)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel
export default app;