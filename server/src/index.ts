import http from 'http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import { dbConnection } from './db/index.js';
import { setupWebSocket } from './services/websocket.js';
import v1Router from './routes/v1/index.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { notFoundMiddleware } from './middlewares/notFound.middleware.js';
import { logger } from './utils/logger.js';
import { sendSuccess } from './utils/response.util.js';

import { db } from './db/index.js';
import { seedDatabase } from './db/seed.js';

// Initialize Database connection & pragmas per AGENTS.md §6
dbConnection.initialize();

// Ensure properties and rooms are seeded if database is empty on boot
if (db.properties.count() === 0 || db.rooms.count() === 0) {
  logger.warn('[DB] Properties or rooms missing from local DB. Running auto-seed...');
  await seedDatabase(true);
}

const app = express();

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    // Allow local development and configured origins
    callback(null, true);
  },
  credentials: true,
}));
app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  return sendSuccess(
    res,
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'LumenStay API v1',
      version: '1.0.0',
    },
    'LumenStay service is operating nominally'
  );
});

// Mount /api/v1 sub-routers per AGENTS.md §3
app.use('/api/v1', v1Router);

// Maintain backward compatibility for legacy /api prefix
app.use('/api', v1Router);

// 404 & Global Error Handling per AGENTS.md §4
app.use(notFoundMiddleware);
app.use(errorMiddleware);

const server = http.createServer(app);

// Setup WebSocket server
setupWebSocket(server);

server.listen(config.port, () => {
  logger.info(`Server is running on http://localhost:${config.port}`);
});

export { app, server };
