import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { GmailMessage, ToolResult } from '../types';
import logger from '../utils/logger';

export class GmailService {
    private oauth2Client: OAuth2Client;
    private gmail: any;

    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        this.oauth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
        });

        this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    }

    async listMessages(maxResults: number = 10, query?: string): Promise<ToolResult> {
        try {
            const response = await this.gmail.users.messages.list({
                userId: 'me',
                maxResults: maxResults,
                q: query || 'is:unread',
            });

            const messages = response.data.messages || [];

            // Fetch full message details
            const detailedMessages = await Promise.all(
                messages.map(async (msg: any) => {
                    const details = await this.gmail.users.messages.get({
                        userId: 'me',
                        id: msg.id,
                        format: 'full',
                    });
                    return this.parseMessage(details.data);
                })
            );

            logger.info(`Retrieved ${detailedMessages.length} Gmail messages`);

            return {
                success: true,
                data: detailedMessages,
                message: `Found ${detailedMessages.length} messages`,
            };
        } catch (error: any) {
            logger.error('Error listing Gmail messages:', error);
            return {
                success: false,
                error: error.message,
                message: 'Failed to retrieve Gmail messages',
            };
        }
    }

    async sendMessage(message: GmailMessage): Promise<ToolResult> {
        try {
            const email = this.createEmail(message);
            const encodedEmail = Buffer.from(email)
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            const response = await this.gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: encodedEmail,
                },
            });

            logger.info(`Sent Gmail message: ${message.subject}`);

            return {
                success: true,
                data: response.data,
                message: `Email sent successfully to ${message.to}`,
            };
        } catch (error: any) {
            logger.error('Error sending Gmail message:', error);
            return {
                success: false,
                error: error.message,
                message: 'Failed to send email',
            };
        }
    }

    async draftReply(messageId: string, replyContent: string): Promise<ToolResult> {
        try {
            // Get original message
            const original = await this.gmail.users.messages.get({
                userId: 'me',
                id: messageId,
                format: 'full',
            });

            const headers = original.data.payload.headers;
            const to = headers.find((h: any) => h.name === 'From')?.value || '';
            const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';

            const draftMessage: GmailMessage = {
                to: to,
                subject: subject.startsWith('Re:') ? subject : `Re: ${subject}`,
                body: replyContent,
                inReplyTo: messageId,
            };

            const email = this.createEmail(draftMessage);
            const encodedEmail = Buffer.from(email)
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            const response = await this.gmail.users.drafts.create({
                userId: 'me',
                requestBody: {
                    message: {
                        raw: encodedEmail,
                        threadId: original.data.threadId,
                    },
                },
            });

            logger.info(`Created draft reply for message: ${messageId}`);

            return {
                success: true,
                data: response.data,
                message: 'Draft reply created successfully',
            };
        } catch (error: any) {
            logger.error('Error creating draft reply:', error);
            return {
                success: false,
                error: error.message,
                message: 'Failed to create draft reply',
            };
        }
    }

    async getUnreadCount(): Promise<ToolResult> {
        try {
            const response = await this.gmail.users.messages.list({
                userId: 'me',
                q: 'is:unread',
                maxResults: 1,
            });

            const count = response.data.resultSizeEstimate || 0;

            return {
                success: true,
                data: { count },
                message: `You have ${count} unread messages`,
            };
        } catch (error: any) {
            logger.error('Error getting unread count:', error);
            return {
                success: false,
                error: error.message,
                message: 'Failed to get unread count',
            };
        }
    }

    private parseMessage(message: any): any {
        const headers = message.payload?.headers || [];
        const getHeader = (name: string) =>
            headers.find((h: any) => h.name === name)?.value || '';

        return {
            id: message.id,
            threadId: message.threadId,
            from: getHeader('From'),
            to: getHeader('To'),
            subject: getHeader('Subject'),
            date: getHeader('Date'),
            snippet: message.snippet,
        };
    }

    private createEmail(message: GmailMessage): string {
        const lines = [
            `To: ${message.to}`,
            `Subject: ${message.subject}`,
            'Content-Type: text/plain; charset=utf-8',
            '',
            message.body,
        ];

        if (message.inReplyTo) {
            lines.splice(2, 0, `In-Reply-To: ${message.inReplyTo}`);
        }

        return lines.join('\r\n');
    }
}