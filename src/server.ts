import express, { Express, Request } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import a2aRoutes from './routes/a2a.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { validateEnvVariables } from './middleware/validation.middleware';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

// Validate environment variables
try {
    validateEnvVariables();
} catch (error: any) {
    logger.error('Environment validation failed:', error);
    process.exit(1);
}

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/a2a', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req: Request, _res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });
    next();
});

// Routes
app.use('/a2a', a2aRoutes);

// Root endpoint
app.get('/', (_req, res) => {
    res.json({
        message: 'ExecuMate AI Assistant',
        version: '1.0.0',
        status: 'running',
        documentation: '/agent/info',
    });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
});

// Unhandled rejection handler
process.on('unhandledRejection', (reason: any) => {
    logger.error('Unhandled Rejection:', reason);
    throw reason;
});

process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

// Start server
const server = app.listen(PORT, () => {
    logger.info(`🚀 ExecuMate AI Assistant running on port ${PORT}`);
    logger.info(`📡 A2A endpoint: http://localhost:${PORT}/a2a/agent/execumate`);
    logger.info(`💚 Health check: http://localhost:${PORT}/health`);
    logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;