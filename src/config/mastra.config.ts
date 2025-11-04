import { Mastra } from '@mastra/core';
import dotenv from 'dotenv';

dotenv.config();

export const mastra = new Mastra({
    name: 'ExecuMate',
    apiKey: process.env.MASTRA_API_KEY,
    logLevel: process.env.LOG_LEVEL as any || 'info',
});

export default mastra;