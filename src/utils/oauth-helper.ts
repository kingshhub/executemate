import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
);

const SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly'
];

const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
});

console.log('\n🔗 Authorize this app by visiting this URL:\n');
console.log(authUrl);
console.log('\nAfter authorization, paste the code below:\n');

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

readline.question('Enter the code from Google: ', async (code: string) => {
    try {
        const { tokens } = await oauth2Client.getToken(code);
        console.log('\n✅ Your refresh token:\n');
        console.log(tokens.refresh_token);
    } catch (error) {
        console.error('❌ Error retrieving access token:', error);
    } finally {
        readline.close();
    }
});
