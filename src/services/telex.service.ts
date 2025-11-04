import logger from '../utils/logger';

export class TelexService {
    private baseUrl: string;
    private channelId: string;

    constructor() {
        this.baseUrl = process.env.TELEX_API_BASE || 'https://api.telex.im';
        this.channelId = process.env.TELEX_CHANNEL_ID || '';
    }

    async sendMessage(message: string, _metadata?: Record<string, any>): Promise<boolean> {
        try {
            logger.info(`Sending message to Telex channel: ${this.channelId}`);
            logger.info(`Message: ${message}`);
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