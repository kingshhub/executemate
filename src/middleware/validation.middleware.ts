import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from './error.middleware';
import logger from '../utils/logger';

export const validateRequest = (schema: ZodSchema) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error: any) {
            logger.warn('Request validation failed:', {
                path: req.path,
                errors: error.errors,
            });

            const errorMessage = error.errors
                ?.map((err: any) => `${err.path.join('.')}: ${err.message}`)
                .join(', ') || 'Invalid request data';

            next(new AppError(errorMessage, 400));
        }
    };
};

export const validateEnvVariables = () => {
    const required = [
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'GOOGLE_REDIRECT_URI',
        'GOOGLE_REFRESH_TOKEN',
        'TELEX_CHANNEL_ID',
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}\n` +
            'Please check your .env file and ensure all required variables are set.'
        );
    }

    logger.info('Environment variables validated successfully');
};