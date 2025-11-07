import { Task, ToolResult } from '../types';
import logger from '../utils/logger';

//  task storage
const tasks: Map<string, Task> = new Map();

export const taskTool = {
    name: 'task_manager',
    description: 'Manage tasks - create, list, update, and complete tasks',

    async execute(action: string, params: any = {}): Promise<ToolResult> {
        logger.info(`Executing task tool action: ${action}`, params);

        try {
            switch (action) {
                case 'create_task':
                    return createTask(params);

                case 'list_tasks':
                    return listTasks(params);

                case 'update_task':
                    return updateTask(params);

                case 'complete_task':
                    return completeTask(params);

                case 'delete_task':
                    return deleteTask(params);

                default:
                    return {
                        success: false,
                        error: `Unknown action: ${action}`,
                    };
            }
        } catch (error: any) {
            logger.error('Task tool error:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    },
};

function createTask(params: any): ToolResult {
    if (!params.title) {
        return {
            success: false,
            error: 'Task title is required',
        };
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const task: Task = {
        id: taskId,
        title: params.title,
        description: params.description || '',
        dueDate: params.dueDate,
        priority: params.priority || 'medium',
        status: 'pending',
        createdAt: now,
        updatedAt: now,
    };

    tasks.set(taskId, task);
    logger.info(`Created task: ${taskId}`);

    return {
        success: true,
        data: task,
        message: `Task "${task.title}" created successfully`,
    };
}

function listTasks(params: any): ToolResult {
    const allTasks = Array.from(tasks.values());

    let filteredTasks = allTasks;

    if (params.status) {
        filteredTasks = filteredTasks.filter(t => t.status === params.status);
    }

    if (params.priority) {
        filteredTasks = filteredTasks.filter(t => t.priority === params.priority);
    }

    // Sort by due date
    filteredTasks.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    return {
        success: true,
        data: filteredTasks,
        message: `Found ${filteredTasks.length} tasks`,
    };
}

function updateTask(params: any): ToolResult {
    if (!params.taskId) {
        return {
            success: false,
            error: 'Task ID is required',
        };
    }

    const task = tasks.get(params.taskId);
    if (!task) {
        return {
            success: false,
            error: 'Task not found',
        };
    }

    const updates = {
        ...task,
        ...params.updates,
        updatedAt: new Date().toISOString(),
    };

    tasks.set(params.taskId, updates);
    logger.info(`Updated task: ${params.taskId}`);

    return {
        success: true,
        data: updates,
        message: 'Task updated successfully',
    };
}

function completeTask(params: any): ToolResult {
    if (!params.taskId) {
        return {
            success: false,
            error: 'Task ID is required',
        };
    }

    const task = tasks.get(params.taskId);
    if (!task) {
        return {
            success: false,
            error: 'Task not found',
        };
    }

    task.status = 'completed';
    task.updatedAt = new Date().toISOString();
    tasks.set(params.taskId, task);

    logger.info(`Completed task: ${params.taskId}`);

    return {
        success: true,
        data: task,
        message: `Task "${task.title}" marked as completed`,
    };
}

function deleteTask(params: any): ToolResult {
    if (!params.taskId) {
        return {
            success: false,
            error: 'Task ID is required',
        };
    }

    const deleted = tasks.delete(params.taskId);
    if (!deleted) {
        return {
            success: false,
            error: 'Task not found',
        };
    }

    logger.info(`Deleted task: ${params.taskId}`);

    return {
        success: true,
        message: 'Task deleted successfully',
    };
}