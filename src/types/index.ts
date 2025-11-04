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
    messages: z.array(TelexMessageSchema),
    context: z.record(z.any()).optional(),
    userId: z.string().optional(),
    channelId: z.string().optional(),
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