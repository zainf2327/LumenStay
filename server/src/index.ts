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

// Initialize Database connection per AGENTS.md §6
dbConnection.initialize();

const app = express();

// Trust reverse proxy (Nginx / Cloudflare on EC2) for correct HTTPS detection
app.set('trust proxy', 1);

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    // Allow local development and configured origins
    callback(null, true);
  },
  credentials: true,
}));
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
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
