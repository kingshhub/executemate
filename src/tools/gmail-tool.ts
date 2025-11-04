import { GmailService } from '../services/gmail.service';
import { GmailMessage } from '../types';
import logger from '../utils/logger';

const gmailService = new GmailService();

export const gmailTool = {
    name: 'gmail_manager',
    description: 'Manage Gmail - list messages, send emails, and draft replies',

    async execute(action: string, params: any = {}) {
        logger.info(`Executing Gmail tool action: ${action}`, params);

        try {
            switch (action) {
                case 'list_messages':
                    return await gmailService.listMessages(
                        params.maxResults || 10,
                        params.query
                    );

                case 'send_message':
                    if (!params.message) {
                        return {
                            success: false,
                            error: 'Message data is required',
                        };
                    }
                    return await gmailService.sendMessage(params.message as GmailMessage);

                case 'draft_reply':
                    if (!params.messageId || !params.replyContent) {
                        return {
                            success: false,
                            error: 'Message ID and reply content are required',
                        };
                    }
                    return await gmailService.draftReply(params.messageId, params.replyContent);

                case 'get_unread_count':
                    return await gmailService.getUnreadCount();

                default:
                    return {
                        success: false,
                        error: `Unknown action: ${action}`,
                    };
            }
        } catch (error: any) {
            logger.error('Gmail tool error:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    },
};