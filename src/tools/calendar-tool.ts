import { GoogleCalendarService } from '../services/google-calender.service';
import { CalendarEvent } from '../types';
import logger from '../utils/logger';

const calendarService = new GoogleCalendarService();

export const calendarTool = {
    name: 'calendar_manager',
    description: 'Manage calendar events - list, create, update, and delete events',

    async execute(action: string, params: any = {}) {
        logger.info(`Executing calendar tool action: ${action}`, params);

        try {
            switch (action) {
                case 'list_events':
                    return await calendarService.listEvents(
                        params.maxResults || 10,
                        params.timeMin,
                        params.timeMax
                    );

                case 'get_today':
                    return await calendarService.getEventsForToday();

                case 'get_week':
                    return await calendarService.getEventsForWeek();

                case 'create_event':
                    if (!params.event) {
                        return {
                            success: false,
                            error: 'Event data is required',
                        };
                    }
                    return await calendarService.createEvent(params.event as CalendarEvent);

                case 'update_event':
                    if (!params.eventId) {
                        return {
                            success: false,
                            error: 'Event ID is required',
                        };
                    }
                    return await calendarService.updateEvent(params.eventId, params.updates);

                case 'delete_event':
                    if (!params.eventId) {
                        return {
                            success: false,
                            error: 'Event ID is required',
                        };
                    }
                    return await calendarService.deleteEvent(params.eventId);

                default:
                    return {
                        success: false,
                        error: `Unknown action: ${action}`,
                    };
            }
        } catch (error: any) {
            logger.error('Calendar tool error:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    },
};