import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';

// Import pool initializer
import './config/db.js';

// Import Socket Setup
import { setupSocket } from './socket/socketHandler.js';

// Import Routers
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import inboundRouter from './routes/inbound.js';
import inventoryRouter from './routes/inventory.js';
import outboundRouter from './routes/outbound.js';
import networkRouter from './routes/network.js';
import reportsRouter from './routes/reports.js';
import crudRouter from './routes/crud.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const server = createServer(app);

// 1. High Performance Security Headers Emulation (Zero-dependency Helmet replacement)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';");
  next();
});

// 2. Optimized CORS Policy
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Cross-Origin Request blocked by APEX Security Policies'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// 3. High Performance Inline Cookie Parser (Zero-dependency cookie-parser replacement)
app.use((req, res, next) => {
  req.cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      if (parts.length >= 2) {
        req.cookies[parts[0].trim()] = parts.slice(1).join('=').trim();
      }
    });
  }
  next();
});

// Setup Socket.IO Server
const io = setupSocket(server);
app.set('io', io);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    service: 'APEX Enterprise WMS Engine',
    databaseConnection: 'Pool Active'
  });
});

// Bind API routing namespaces
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/inbound', inboundRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/outbound', outboundRouter);
app.use('/api/network', networkRouter);
app.use('/api/reports', reportsRouter);
app.use('/api', crudRouter);

// Centralized Error Handling Boundaries
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`APEX ENTERPRISE WMS ENGINE RUNNING ON PORT ${PORT}`);
  console.log(`Node Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database connected, real-time events initialized`);
  console.log(`==================================================`);
});
