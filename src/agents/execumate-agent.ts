import { Agent } from '@mastra/core/agent';
import { calendarTool } from '../tools/calendar-tool';
import { gmailTool } from '../tools/gmail-tool';
import { taskTool } from '../tools/task-tool';
import { TelexRequest, TelexResponse } from '../types';
import logger from '../utils/logger';
import { z } from 'zod';

export const execumateAgent = new Agent({
    name: 'ExecuMate',
    instructions: `
You are ExecuMate, an advanced AI executive assistant designed to help busy professionals manage their calendars, emails, and tasks efficiently.

Your capabilities include:
1. **Calendar Management**: Schedule, update, and query calendar events
2. **Email Management**: Read, draft, and send emails via Gmail
3. **Task Management**: Create, track, and organize tasks
4. **Intelligent Scheduling**: Find optimal meeting times and prevent conflicts
5. **Proactive Reminders**: Send timely notifications for upcoming events

Guidelines for interaction:
- Be professional yet friendly and approachable
- Always confirm actions before executing them (unless explicitly told to proceed automatically)
- Provide clear summaries of calendar events and emails
- When scheduling, consider time zones and business hours
- For ambiguous requests, ask clarifying questions
- Prioritize user's time and efficiency
- Use natural language to explain technical results

When responding:
- Start with a brief acknowledgment of the request
- Provide the requested information clearly and concisely
- Suggest relevant follow-up actions when appropriate
- Format responses for easy readability

Remember: You're here to make the user's life easier by handling administrative tasks efficiently.
`,
    model: {
        id: 'google/gemini-2.5-flash',
        provider: 'google',
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY
    },

    tools: {
        calendar: {
            description: 'Manage calendar events',
            input: z.object({
                action: z.string().describe('Action to perform: list_events, get_today, get_week, create_event, update_event, delete_event'),
                params: z.record(z.any()).optional().describe('Parameters for the action'),
            }),
            execute: async ({ context }: any) => {
                const { action, params } = context;
                return await calendarTool.execute(action, params);
            },
        },
        gmail: {
            description: 'Manage Gmail messages',
            input: z.object({
                action: z.string().describe('Action to perform: list_messages, send_message, draft_reply, get_unread_count'),
                params: z.record(z.any()).optional().describe('Parameters for the action'),
            }),
            execute: async ({ context }: any) => {
                const { action, params } = context;
                return await gmailTool.execute(action, params);
            },
        },
        tasks: {
            description: 'Manage tasks',
            input: z.object({
                action: z.string().describe('Action to perform: create_task, list_tasks, update_task, complete_task, delete_task'),
                params: z.record(z.any()).optional().describe('Parameters for the action'),
            }),
            execute: async ({ context }: any) => {
                const { action, params } = context;
                return await taskTool.execute(action, params);
            },
        },
    },
});

export async function processAgentRequest(request: TelexRequest): Promise<TelexResponse> {
    try {
        logger.info('Processing agent request', {
            userId: request.params.message.metadata?.telex_user_id,
            messageId: request.params.message.messageId
        });

        // Extract the message text from parts
        const messageParts = request.params.message.parts;
        const textPart = messageParts.find(part =>
            part.kind === 'text' && part.text && !Array.isArray(part.data)
        );

        if (!textPart || !textPart.text) {
            throw new Error('No text message found in request');
        }

        // Generate response using Mastra agent
        const response = await execumateAgent.generate(textPart.text);

        logger.info('Agent response generated', {
            responseLength: response.text?.length || 0,
        });

        // Extract tool names from tool calls
        const toolsUsed = response.toolCalls?.map(tc => {
            if (typeof tc === 'object' && 'toolName' in tc) {
                return tc.toolName;
            }
            return 'unknown';
        }) || [];

        return {
            role: 'assistant',
            content: response.text || 'I apologize, but I was unable to process your request. Please try again.',
            metadata: {
                timestamp: new Date().toISOString(),
                toolsUsed,
            },
        };
    } catch (error: any) {
        logger.error('Error processing agent request:', error);

        return {
            role: 'assistant',
            content: 'I encountered an error while processing your request. Please try again or rephrase your question.',
            metadata: {
                error: error.message,
                timestamp: new Date().toISOString(),
            },
        };
    }
}