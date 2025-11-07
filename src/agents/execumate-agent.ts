import { Agent } from '@mastra/core/agent';
import { calendarTool } from '../tools/calendar-tool';
import { gmailTool } from '../tools/gmail-tool';
import { taskTool } from '../tools/task-tool';
import { TelexRequest, TelexResponse, ToolResult } from '../types';
import logger from '../utils/logger';
import { z } from 'zod';

interface AgentResponse {
    text?: string;
    toolCalls?: Array<{
        toolName: string;
        args: {
            action: string;
            params?: Record<string, any>;
        };
    }>;
}

export const execumateAgent = new Agent({
    name: 'ExecuMate',
    instructions: `
You are ExecuMate, an advanced AI executive assistant designed to help busy professionals manage their calendars, emails, and tasks efficiently.

Tool Usage Guidelines:

1. Task Management (tasks tool):
   - For creation: Use 'create_task' with title, priority, description, due date
   - For listing: Use 'list_tasks' with status/priority filters
   - For updates: Use 'update_task' or 'complete_task' as needed
   Example:
   {
     action: "create_task",
     params: {
       title: "Walk the dog",
       priority: "medium",
       description: "Daily dog walking task"
     }
   }

2. Calendar Management (calendar tool):
   - Use appropriate actions: list_events, create_event, update_event
   - Include all relevant details: time, date, attendees
   - Consider timezone and business hours

3. Email Management (gmail tool):
   - Handle messages with list_messages, send_message, draft_reply
   - Provide clear subject lines and content
   - Include necessary attachments or references

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
                action: z.enum([
                    'list_events',
                    'get_today',
                    'get_week',
                    'create_event',
                    'update_event',
                    'delete_event'
                ]).describe('Action to perform with the calendar'),
                params: z.object({
                    summary: z.string().optional(),
                    description: z.string().optional(),
                    start: z.object({
                        dateTime: z.string(),
                        timeZone: z.string().optional()
                    }).optional(),
                    end: z.object({
                        dateTime: z.string(),
                        timeZone: z.string().optional()
                    }).optional(),
                    attendees: z.array(z.object({
                        email: z.string(),
                        displayName: z.string().optional()
                    })).optional()
                }).optional(),
            }),
            execute: async ({ context }: { context: { action: string; params?: Record<string, any> } }) => {
                const { action, params } = context;
                return await calendarTool.execute(action, params);
            },
        },
        gmail: {
            description: 'Manage Gmail messages',
            input: z.object({
                action: z.enum([
                    'list_messages',
                    'send_message',
                    'draft_reply',
                    'get_unread_count'
                ]).describe('Action to perform with Gmail'),
                params: z.object({
                    to: z.string().optional(),
                    subject: z.string().optional(),
                    body: z.string().optional(),
                    messageId: z.string().optional(),
                    query: z.string().optional()
                }).optional(),
            }),
            execute: async ({ context }: { context: { action: string; params?: Record<string, any> } }) => {
                const { action, params } = context;
                return await gmailTool.execute(action, params);
            },
        },
        tasks: {
            description: 'Manage tasks',
            input: z.object({
                action: z.enum([
                    'create_task',
                    'list_tasks',
                    'update_task',
                    'complete_task',
                    'delete_task'
                ]).describe('Action to perform with tasks'),
                params: z.object({
                    title: z.string().optional(),
                    description: z.string().optional(),
                    priority: z.enum(['low', 'medium', 'high']).optional(),
                    dueDate: z.string().optional(),
                    status: z.enum(['pending', 'in-progress', 'completed']).optional(),
                    taskId: z.string().optional(),
                    tasks: z.array(z.object({
                        title: z.string(),
                        description: z.string().optional(),
                        priority: z.enum(['low', 'medium', 'high']).optional(),
                        dueDate: z.string().optional()
                    })).optional()
                }).optional(),
            }),
            execute: async ({ context }: { context: { action: string; params?: Record<string, any> } }) => {
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

        // Extract and combine all relevant text from message parts
        const messageParts = request.params.message.parts;
        const textParts = messageParts
            .filter(part => part.kind === 'text' && part.text && !Array.isArray(part.data))
            .map(part => part.text as string);

        if (textParts.length === 0) {
            throw new Error('No valid text content found in request');
        }

        // Combine all text parts, removing any HTML tags and normalizing whitespace
        const cleanText = textParts
            .join('\n')
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/\s+/g, ' ')    // Normalize whitespace
            .trim();

        if (!cleanText) {
            throw new Error('No meaningful text content after cleaning');
        }

        logger.info('Processed message text:', {
            originalParts: textParts.length,
            cleanedText: cleanText.substring(0, 100) + '...'
        });

        // Generate response using Mastra agent with timeout and error handling
        let response: AgentResponse;
        try {
            const generatePromise = execumateAgent.generate(cleanText) as unknown as Promise<AgentResponse>;
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Response generation timed out')), 30000)
            );

            const timeoutId = (timeoutPromise as any)[Symbol.for('timeoutId')];
            response = await Promise.race([generatePromise, timeoutPromise]);

            if (!response) {
                throw new Error('Empty response from agent');
            }

            if (!response.text && !response.toolCalls?.length) {
                throw new Error('Response contains neither text nor tool calls');
            }

            logger.info('Agent response generated', {
                responseLength: response.text?.length || 0,
                toolCallsCount: response.toolCalls?.length || 0,
                hasText: !!response.text,
                hasToolCalls: !!response.toolCalls?.length
            });

            // Cancel timeout timer
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Error generating agent response:', {
                error: errorMessage,
                requestText: cleanText.substring(0, 100) + '...'
            });
            throw new Error('Failed to generate response: ' + errorMessage);
        }

        // Process tool calls and collect results
        const toolResults: ToolResult[] = [];
        const toolsUsed: string[] = [];

        interface ToolCall {
            toolName: string;
            args: {
                action: string;
                params?: Record<string, any>;
            };
        }

        if (response.toolCalls && response.toolCalls.length > 0) {
            for (const toolCall of response.toolCalls) {
                if (typeof toolCall === 'object' && 'toolName' in toolCall && 'args' in toolCall) {
                    const { toolName, args } = toolCall as ToolCall;
                    toolsUsed.push(toolName);

                    try {
                        let result: ToolResult;
                        if (toolName === 'tasks') {
                            // Special handling for task creation with multiple tasks
                            if (args.action === 'create_task' && Array.isArray(args.params?.tasks)) {
                                const batchResult: ToolResult = {
                                    success: true,
                                    data: [],
                                    message: "Multiple tasks created successfully"
                                };

                                for (const task of args.params.tasks) {
                                    const taskResult = await taskTool.execute('create_task', {
                                        ...task,
                                        priority: task.priority || args.params.priority || 'medium',
                                        dueDate: task.dueDate || args.params.dueDate,
                                        description: task.description || args.params.description
                                    });

                                    if (taskResult.success) {
                                        (batchResult.data as any[]).push(taskResult.data);
                                        if (taskResult.message) {
                                            batchResult.message += `\n- ${taskResult.message}`;
                                        }
                                    }
                                }
                                result = batchResult;
                            } else {
                                result = await taskTool.execute(args.action, args.params || {});
                            }
                            toolResults.push(result);
                        } else if (toolName === 'calendar') {
                            result = await calendarTool.execute(args.action, args.params || {});
                            toolResults.push(result);
                        } else if (toolName === 'gmail') {
                            result = await gmailTool.execute(args.action, args.params || {});
                            toolResults.push(result);
                        } else {
                            result = {
                                success: false,
                                error: `Unknown tool: ${toolName}`
                            };
                            toolResults.push(result);
                        }
                    } catch (error: unknown) {
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                        logger.error(`Error executing tool ${toolName}:`, error);
                        toolResults.push({ success: false, error: errorMessage });
                    }
                }
            }
        }

        // Construct final response based on tool results
        let finalContent = response.text || '';
        if (toolResults.length > 0) {
            const successResults = toolResults.filter(r => r.success);
            if (successResults.length > 0) {
                const messages = successResults
                    .map(r => (r as any).message || (r as any).data?.message)
                    .filter(Boolean);
                if (messages.length > 0) {
                    finalContent += '\n\n' + messages.join('\n');
                }
            }
        }

        return {
            role: 'assistant',
            content: finalContent || 'I apologize, but I was unable to process your request. Please try again.',
            metadata: {
                timestamp: new Date().toISOString(),
                toolsUsed,
                toolResults: toolResults.map(r => ({
                    success: r.success,
                    message: (r as any).message || (r as any).data?.message || (r as any).error
                }))
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