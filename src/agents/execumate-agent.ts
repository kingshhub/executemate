import { Agent } from '@mastra/core';
import { calendarTool } from '../tools/calendar-tool';
import { gmailTool } from '../tools/gmail-tool';
import { taskTool } from '../tools/task-tool';
import { TelexService } from '../services/telex.service';
import { TelexRequest, TelexResponse } from '../types';
import logger from '../utils/logger';

const telexService = new TelexService();

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
        provider: 'openai',
        name: 'gpt-4-turbo-preview',
        toolChoice: 'auto',
    },
    tools: {
        calendar: {
            description: 'Manage calendar events',
            parameters: {
                action: {
                    type: 'string',
                    description: 'Action to perform: list_events, get_today, get_week, create_event, update_event, delete_event',
                },
                params: {
                    type: 'object',
                    description: 'Parameters for the action',
                },
            },
            execute: async ({ action, params }: any) => {
                return await calendarTool.execute(action, params);
            },
        },
        gmail: {
            description: 'Manage Gmail messages',
            parameters: {
                action: {
                    type: 'string',
                    description: 'Action to perform: list_messages, send_message, draft_reply, get_unread_count',
                },
                params: {
                    type: 'object',
                    description: 'Parameters for the action',
                },
            },
            execute: async ({ action, params }: any) => {
                return await gmailTool.execute(action, params);
            },
        },
        tasks: {
            description: 'Manage tasks',
            parameters: {
                action: {
                    type: 'string',
                    description: 'Action to perform: create_task, list_tasks, update_task, complete_task, delete_task',
                },
                params: {
                    type: 'object',
                    description: 'Parameters for the action',
                },
            },
            execute: async ({ action, params }: any) => {
                return await taskTool.execute(action, params);
            },
        },
    },
});

export async function processAgentRequest(request: TelexRequest): Promise<TelexResponse> {
    try {
        logger.info('Processing agent request', {
            messageCount: request.messages.length,
            userId: request.userId,
        });

        // Extract the latest user message
        const userMessages = request.messages.filter(m => m.role === 'user');
        const latestMessage = userMessages[userMessages.length - 1];

        if (!latestMessage) {
            throw new Error('No user message found in request');
        }

        // Generate response using Mastra agent
        const response = await execumateAgent.generate(latestMessage.content, {
            context: request.context,
        });

        logger.info('Agent response generated', {
            responseLength: response.text?.length || 0,
        });

        return {
            role: 'assistant',
            content: response.text || 'I apologize, but I was unable to process your request. Please try again.',
            metadata: {
                timestamp: new Date().toISOString(),
                toolsUsed: response.toolCalls?.map(tc => tc.name) || [],
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