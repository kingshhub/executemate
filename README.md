# ExecuMate AI Assistant 🤖

> Executive AI Assistant powered by Mastra and integrated with Telex.im

ExecuMate is an AI assistant that helps busy professionals manage their calendars, emails, and tasks efficiently through natural language conversations on Telex.im.

## 🌟 Features

- **Calendar Management**: Schedule, update, and query Google Calendar events
- **Email Management**: Read, draft, and send emails via Gmail
- **Task Management**: Create, track, and organize tasks with priorities
- **Intelligent Scheduling**: Find optimal meeting times and prevent conflicts
- **Proactive Reminders**: Get timely notifications via Telex.im
- **Natural Language Interface**: Chat naturally to manage your workload

## 🏗️ Tech Stack

- **Framework**: Node.js + Express + TypeScript
- **AI**: Mastra Framework
- **Integration**: Telex.im A2A Protocol
- **APIs**: Google Calendar API, Gmail API
- **Deployment**: Railway

## 📋 Prerequisites

- Node.js 18+ installed
- Google Cloud Console account
- Telex.im account with organization access
- Railway account (for deployment)

## 🚀 Quick Start

### 1. Clone and Install
```bash
cd execumate-ai

# Install dependencies
npm install
```

### 2. Get Telex Access

Run this command in Telex.im:
```
/telex-invite your-email@example.com
```

Wait for organization access confirmation.

### 3. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project called "ExecuMate"
3. Enable Google Calendar API
4. Enable Gmail API
5. Create OAuth 2.0 credentials (Desktop app type)
6. Download the credentials

### 4. Get Google Refresh Token
```bash
# Run the OAuth flow helper
npm run oauth
```

Follow the prompts to authorize and get your refresh token.

### 5. Configure Environment
```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your values
nano .env
```

Fill in these required values:
- `GOOGLE_CLIENT_ID`: From Google Cloud Console
- `GOOGLE_CLIENT_SECRET`: From Google Cloud Console
- `GOOGLE_REFRESH_TOKEN`: From OAuth flow
- `TELEX_CHANNEL_ID`: From Telex.im URL

### 6. Run Locally
```bash
# Development mode with hot reload
npm run dev

# Production build
npm run build
npm start
```

The server will start on `http://localhost:3000`

### 7. Test the Endpoints
```bash
# Health check
curl http://localhost:3000/health

# Agent info
curl http://localhost:3000/agent/info

# Test A2A endpoint
curl -X POST http://localhost:3000/a2a/agent/execumate \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "What events do I have today?"
      }
    ]
  }'
```

## 🌐 Deployment to Railway

### Method 1: Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up

# Add environment variables
railway variables set GOOGLE_CLIENT_ID=your-value
railway variables set GOOGLE_CLIENT_SECRET=your-value
# ... add all other variables
```

### Method 2: GitHub Integration

1. Push code to GitHub
2. Connect repository in Railway dashboard
3. Add environment variables
4. Deploy automatically

### Post-Deployment

1. Get your Railway URL (e.g., `execumate.up.railway.app`)
2. Update `GOOGLE_REDIRECT_URI` in Railway variables
3. Update the workflow JSON with your Railway URL
4. Upload workflow to Telex.im

## 📝 Telex.im Integration

### Upload Workflow

1. Open the `workflows/execumate-workflow.json` file
2. Replace `YOUR_RAILWAY_URL` with your actual Railway URL
3. In Telex.im, create a new workflow
4. Paste the JSON content
5. Activate the workflow

### Get Channel ID

1. Go to Telex.im
2. Open any channel
3. Look at the URL: `https://telex.im/telex-im/home/colleagues/[CHANNEL-ID]/...`
4. Copy the first UUID (that's your channel ID)

### View Agent Logs

Visit: `https://api.telex.im/agent-logs/YOUR-CHANNEL-ID.txt`

## 💬 Usage Examples

Once deployed and integrated with Telex.im, you can chat with ExecuMate:

### Calendar Queries
```
"What's on my calendar today?"
"Schedule a meeting with udo@example.com tomorrow at 2 PM"
"Show me my events for this week"
"Cancel my 3 PM meeting"
```

### Email Management
```
"How many unread emails do I have?"
"Draft a reply to the latest email from Akpan"
"Send an email to team@netserve.com about the project update"
```

### Task Management
```
"Create a task: Finish quarterly report by Friday"
"Show me my high priority tasks"
"Mark task #123 as complete"
"What tasks are due this week?"
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3000) |
| `NODE_ENV` | Environment | No (default: development) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | Yes |
| `GOOGLE_REDIRECT_URI` | OAuth redirect URL | Yes |
| `GOOGLE_REFRESH_TOKEN` | Google refresh token | Yes |
| `TELEX_CHANNEL_ID` | Telex channel ID | Yes |
| `LOG_LEVEL` | Logging level | No (default: info) |

### Customization

Edit `src/agents/execumate-agent.ts` to:
- Modify agent instructions
- Add custom tools
- Change response formats
- Adjust AI model settings

## 📚 API Documentation

### Endpoints

#### POST /a2a/agent/execumate
Execute agent with Telex messages

**Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What's on my schedule?"
    }
  ],
  "context": {},
  "userId": "optional-user-id",
  "channelId": "optional-channel-id"
}
```

**Response:**
```json
{
  "role": "assistant",
  "content": "Here are your upcoming events...",
  "metadata": {
    "timestamp": "2025-11-03T12:00:00Z",
    "toolsUsed": ["calendar"]
  }
}
```

#### GET /health
Check service health

#### GET /agent/info
Get agent capabilities and info

## 🧪 Testing
```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format
```

## 🐛 Troubleshooting

### Common Issues

**1. Google API Errors**
- Ensure APIs are enabled in Google Cloud Console
- Check refresh token is valid
- Verify OAuth scopes include calendar and gmail

**2. Telex Connection Issues**
- Confirm channel ID is correct
- Check Railway URL is publicly accessible
- Verify workflow JSON is valid

**3. Build Errors**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check Node.js version (should be 18+)

### Logs

Check logs for debugging:
```bash
# Local development
tail -f combined.log

# Railway
railway logs
```

## 📖 Project Structure
```
execumate-ai/
├── src/
│   ├── agents/           # Mastra agent definitions
│   ├── tools/            # Custom tools (calendar, gmail, tasks)
│   ├── services/         # Business logic services
│   ├── routes/           # Express routes
│   ├── middleware/       # Error handling & validation
│   ├── types/            # TypeScript types
│   ├── config/           # Configuration files
│   ├── utils/            # Utility functions
│   └── server.ts         # Main application entry
├── workflows/            # Telex workflow JSON
├── .env.example          # Environment template
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── railway.json          # Railway deployment config
└── README.md             # This file
```

## 🤝 Contributing

This is a submission project, but feedback is welcome!

## 📄 License

MIT License - feel free to use this code for your own projects.

## 🎯 Submission

Built for HNG Internship Stage 3 Backend Task

**Features Implemented:**
✅ Mastra AI Framework integration  
✅ Google Calendar API integration  
✅ Gmail API integration  
✅ Task management system  
✅ Telex.im A2A Protocol  
✅ Production-ready code structure  
✅ Comprehensive error handling  
✅ Railway deployment config  
✅ Full documentation  

**Tags:** #HNGInternship #Mastra #TelexIM #AIAgent

---

Built with ❤️ using TypeScript, Mastra, and Telex.im#   e x e c u t e m a t e 
 
 