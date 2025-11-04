import axios from 'axios';
import logger from '../utils/logger';

export class TelexService {
    private baseUrl: string;
    private channelId: string;

    constructor() {
        this.baseUrl = process.env.TELEX_API_BASE || 'https://api.telex.im';
        this.channelId = process.env.TELEX_CHANNEL_ID || '';
    }

    async sendMessage(message: string, metadata?: Record<string, any>): Promise<boolean> {
        try {
            // Note: This is a placeholder. Actual Telex API endpoints may differ.
            // Adjust based on official Telex documentation.
            logger.info(`Sending message to Telex channel: ${this.channelId}`);
            logger.info(`Message: ${message}`);

            // For now, we'll log the message. Implement actual API call when available.
            return true;
        } catch (error: any) {
            logger.error('Error sending message to Telex:', error);
            return false;
        }
    }

    async sendReminder(title: string, message: string, time: string): Promise<boolean> {
        return this.sendMessage(`⏰ Reminder: ${title}\n${message}\nScheduled for: ${time}`);
    }

    async sendSummary(summary: string): Promise<boolean> {
        return this.sendMessage(`📊 Daily Summary\n\n${summary}`);
    }

    getAgentLogsUrl(): string {
        return `${this.baseUrl}/agent-logs/${this.channelId}.txt`;
    }
}