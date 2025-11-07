import { z } from 'zod';

// Telex A2A Message Schema
export const TelexMessageSchema = z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
    timestamp: z.string().optional(),
    metadata: z.record(z.any()).optional(),
});

export type TelexMessage = z.infer<typeof TelexMessageSchema>;

// Telex A2A Request Schema
export const TelexRequestSchema = z.object({
    jsonrpc: z.literal('2.0'),
    id: z.string(),
    method: z.literal('message/send'),
    params: z.object({
        message: z.object({
            kind: z.literal('message'),
            role: z.string(),
            parts: z.array(z.object({
                kind: z.string(),
                text: z.string().optional(),
                data: z.array(z.any()).optional()
            })),
            metadata: z.object({
                telex_user_id: z.string(),
                telex_channel_id: z.string(),
                org_id: z.string()
            }).optional(),
            messageId: z.string()
        }),
        configuration: z.object({
            acceptedOutputModes: z.array(z.string()),
            historyLength: z.number(),
            pushNotificationConfig: z.any().optional(),
            blocking: z.boolean()
        })
    })
});

export type TelexRequest = z.infer<typeof TelexRequestSchema>;

// Telex A2A Response Schema
export const TelexResponseSchema = z.object({
    role: z.literal('assistant'),
    content: z.string(),
    metadata: z.record(z.any()).optional(),
});

export type TelexResponse = z.infer<typeof TelexResponseSchema>;

// Calendar Event Schema
export interface CalendarEvent {
    id?: string;
    summary: string;
    description?: string;
    start: {
        dateTime: string;
        timeZone?: string;
    };
    end: {
        dateTime: string;
        timeZone?: string;
    };
    attendees?: Array<{
        email: string;
        displayName?: string;
    }>;
    reminders?: {
        useDefault: boolean;
        overrides?: Array<{
            method: string;
            minutes: number;
        }>;
    };
}

// Gmail Message Schema
export interface GmailMessage {
    id?: string;
    threadId?: string;
    to: string;
    subject: string;
    body: string;
    from?: string;
    inReplyTo?: string;
}

// Task Schema
export interface Task {
    id: string;
    title: string;
    description?: string;
    dueDate?: string;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in-progress' | 'completed';
    createdAt: string;
    updatedAt: string;
}

// Tool Result Schema
export interface ToolResult {
    success: boolean;
    data?: any;
    error?: string;
    message?: string;
}

// Agent Context
export interface AgentContext {
    userId?: string;
    channelId?: string;
    conversationHistory: TelexMessage[];
    userPreferences?: Record<string, any>;
}