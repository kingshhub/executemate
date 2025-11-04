import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { CalendarEvent, ToolResult } from '../types';
import logger from '../utils/logger';

export class GoogleCalendarService {
    private oauth2Client: OAuth2Client;
    private calendar: any;

    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        this.oauth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
        });

        this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    }

    async listEvents(
        maxResults: number = 10,
        timeMin?: string,
        timeMax?: string
    ): Promise<ToolResult> {
        try {
            const response = await this.calendar.events.list({
                calendarId: 'primary',
                timeMin: timeMin || new Date().toISOString(),
                timeMax: timeMax,
                maxResults: maxResults,
                singleEvents: true,
                orderBy: 'startTime',
            });

            const events = response.data.items || [];

            logger.info(`Retrieved ${events.length} calendar events`);

            return {
                success: true,
                data: events,
                message: `Found ${events.length} upcoming events`,
            };
        } catch (error: any) {
            logger.error('Error listing calendar events:', error);
            return {
                success: false,
                error: error.message,
                message: 'Failed to retrieve calendar events',
            };
        }
    }

    async createEvent(event: CalendarEvent): Promise<ToolResult> {
        try {
            const response = await this.calendar.events.insert({
                calendarId: 'primary',
                requestBody: event,
            });

            logger.info(`Created calendar event: ${event.summary}`);

            return {
                success: true,
                data: response.data,
                message: `Event "${event.summary}" created successfully`,
            };
        } catch (error: any) {
            logger.error('Error creating calendar event:', error);
            return {
                success: false,
                error: error.message,
                message: 'Failed to create calendar event',
            };
        }
    }

    async updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<ToolResult> {
        try {
            const response = await this.calendar.events.patch({
                calendarId: 'primary',
                eventId: eventId,
                requestBody: updates,
            });

            logger.info(`Updated calendar event: ${eventId}`);

            return {
                success: true,
                data: response.data,
                message: 'Event updated successfully',
            };
        } catch (error: any) {
            logger.error('Error updating calendar event:', error);
            return {
                success: false,
                error: error.message,
                message: 'Failed to update calendar event',
            };
        }
    }

    async deleteEvent(eventId: string): Promise<ToolResult> {
        try {
            await this.calendar.events.delete({
                calendarId: 'primary',
                eventId: eventId,
            });

            logger.info(`Deleted calendar event: ${eventId}`);

            return {
                success: true,
                message: 'Event deleted successfully',
            };
        } catch (error: any) {
            logger.error('Error deleting calendar event:', error);
            return {
                success: false,
                error: error.message,
                message: 'Failed to delete calendar event',
            };
        }
    }

    async getEventsForToday(): Promise<ToolResult> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return this.listEvents(50, today.toISOString(), tomorrow.toISOString());
    }

    async getEventsForWeek(): Promise<ToolResult> {
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        return this.listEvents(50, today.toISOString(), nextWeek.toISOString());
    }
}