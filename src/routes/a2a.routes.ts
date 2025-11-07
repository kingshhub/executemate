import { Router, Request, Response } from 'express';
import { processAgentRequest } from '../agents/execumate-agent';
import { TelexRequestSchema } from '../types';
import { validateRequest } from '../middleware/validation.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import logger from '../utils/logger';

const router = Router();

// A2A endpoint for Telex
router.post(
    '/a2a/agent/execumate',
    validateRequest(TelexRequestSchema),
    asyncHandler(async (req: Request, res: Response) => {
        logger.info('Received A2A request from Telex', {
            messageCount: req.body.messages?.length,
            channelId: req.body.channelId,
        });

        const response = await processAgentRequest(req.body);

        res.json(response);
    })
);

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        service: 'ExecuMate AI',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});

router.get('/agent/info', (_req: Request, res: Response) => {
    res.json({
        name: 'ExecuMate',
        description: 'Executive AI Assistant powered by Mastra',
        capabilities: [
            'Calendar Management',
            'Email Management',
            'Task Management',
            'Intelligent Scheduling',
            'Proactive Reminders',
        ],
        endpoints: {
            a2a: '/a2a/agent/execumate',
            health: '/health',
            info: '/agent/info',
        },
    });
});

export default router;