import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { connectDatabase, disconnectDatabase, prisma } from './db';

// Import routes
import publicRoutes from './routes/public';
import postsRoutes from './routes/posts';
import webhookRoutes from './routes/webhook-n8n';
import rssRoutes from './routes/rss';

const app = express();
const port = process.env.PORT || 8080;
const feOrigin = process.env.FE_ORIGIN || 'http://127.0.0.1:5500';

// Make prisma available to routes
app.locals.prisma = prisma;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
}));

// CORS configuration
app.use(cors({
  origin: [
    feOrigin,
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5500',
    /^http:\/\/localhost:\d+$/,
    /^http:\/\/127\.0\.0\.1:\d+$/,
  ],
  credentials: true,
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', publicRoutes);
app.use('/api/admin/posts', postsRoutes);
app.use('/api/webhook/n8n', webhookRoutes);
app.use('/api/rss', rssRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Teacher AI Academy Backend API',
    version: '1.0.0',
    endpoints: {
      public: {
        posts: '/api/posts',
        post: '/api/posts/:slug',
        health: '/api/health',
        rss: '/api/rss',
      },
      admin: {
        posts: '/api/admin/posts',
        post: '/api/admin/posts/:id',
      },
      webhook: {
        n8n: '/api/webhook/n8n',
      },
    },
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
  });
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    
    // Start listening
    app.listen(port, () => {
      console.log('\n🚀 Teacher AI Academy Backend Server Started');
      console.log(`📍 Port: ${port}`);
      console.log(`🗄️  Database: ${process.env.DB_PATH || './data/blog.sqlite3'}`);
      console.log(`🌐 Allowed Origin: ${feOrigin}`);
      console.log(`🔐 Admin Token: ${process.env.ADMIN_BEARER_TOKEN ? 'Set' : 'Not Set'}`);
      console.log(`🔗 n8n Webhook Secret: ${process.env.N8N_WEBHOOK_SECRET ? 'Set' : 'Not Set'}`);
      console.log(`\n📡 API Endpoints:`);
      console.log(`   GET  /api/health`);
      console.log(`   GET  /api/posts`);
      console.log(`   GET  /api/posts/:slug`);
      console.log(`   GET  /api/rss`);
      console.log(`   POST /api/admin/posts (requires Bearer token)`);
      console.log(`   PUT  /api/admin/posts/:id (requires Bearer token)`);
      console.log(`   DELETE /api/admin/posts/:id (requires Bearer token)`);
      console.log(`   POST /api/webhook/n8n (requires x-n8n-secret header)`);
      console.log(`\n🔗 Frontend Integration:`);
      console.log(`   Blog page: ${feOrigin}/blog.html`);
      console.log(`   RSS feed: http://localhost:${port}/api/rss`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
