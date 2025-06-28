# Frontend-Backend Integration Guide

This document explains how the frontend and backend are now connected to display real-time VAPI transcripts.

## What Changed

### ✅ Backend (Already Working)
- **WebSocket Server**: Real-time transcript broadcasting at `ws://localhost:8000/ws/transcript`
- **REST API**: Status and data endpoints at `http://localhost:8000`
- **VAPI Integration**: Processes webhooks and manages transcript data

### ✅ Frontend (Now Connected)
- **Real-time WebSocket Connection**: Connects to backend for live transcript updates
- **Dynamic Data**: Replaces hardcoded transcript data with real backend data
- **Connection Status**: Shows connection status to VAPI backend
- **Auto-reconnection**: Automatically reconnects if connection is lost

## How to Run

### Option 1: Using the Startup Script (Recommended)
```bash
./start.sh
```

This will:
- Start the backend server on port 8000
- Start the frontend server on port 3000
- Show you the URLs to access each service
- Create log files in the `logs/` directory

### Option 2: Manual Start
**Terminal 1 - Backend:**
```bash
cd backend
python3 main.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## URLs

- **Frontend**: http://localhost:3000
- **Dashboard**: http://localhost:3000/dashboard
- **Backend API**: http://localhost:8000
- **WebSocket**: ws://localhost:8000/ws/transcript

## How It Works

### Real-time Data Flow
1. **VAPI → Backend**: VAPI sends webhook data to `/vapi/webhook`
2. **Backend Processing**: Processes transcript data and stores it
3. **WebSocket Broadcast**: Sends real-time updates to connected frontend clients
4. **Frontend Display**: Updates the dashboard with live transcript data

### Frontend Features
- **Live Connection Status**: Green dot = connected, Red dot = disconnected
- **Real-time Transcripts**: Shows actual VAPI transcript data as it arrives
- **Call Status**: Displays active call information from VAPI
- **Auto-refresh Stats**: Updates system statistics every 10 seconds
- **Connection Recovery**: Automatically reconnects if WebSocket drops

### Backend API Endpoints Used
- `GET /stats` - System statistics (active calls, transcript count, etc.)
- `GET /transcripts` - Recent transcript history
- `GET /calls` - Active call sessions
- `WebSocket /ws/transcript` - Real-time transcript stream

## Testing the Connection

### 1. Check Backend Status
Visit: http://localhost:8000
You should see:
```json
{
  "message": "VAPI Live Transcription Server with WebSocket Support",
  "status": "running",
  "active_calls": 0,
  "total_transcripts": 0,
  "websocket_connections": 1
}
```

### 2. Test Transcript Data
Send a test transcript:
```bash
curl -X POST http://localhost:8000/test-webhook
```

### 3. Check Dashboard
Visit: http://localhost:3000/dashboard
- Connection status should show "Connected to VAPI" (green dot)
- System status should show "Operational"
- Any test transcripts should appear in the Live Transcript panel

## Configuration

### Environment Variables (frontend/.env.local)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8000
```

### Backend Configuration
The backend automatically handles CORS and WebSocket connections. No additional configuration needed.

## Troubleshooting

### Frontend Can't Connect to Backend
1. Check if backend is running: `curl http://localhost:8000`
2. Check for CORS issues in browser console
3. Verify environment variables in `frontend/.env.local`

### WebSocket Connection Issues
1. Check WebSocket URL in browser developer tools (Network tab)
2. Verify backend WebSocket endpoint: `ws://localhost:8000/ws/transcript`
3. Check for firewall or proxy blocking WebSocket connections

### No Transcript Data
1. Verify VAPI webhook is configured to send to your backend
2. Test with the test endpoint: `POST /test-webhook`
3. Check backend logs for webhook processing errors

## VAPI Configuration

Make sure your VAPI assistant is configured to send webhooks to:
```
http://your-domain.com:8000/vapi/webhook
```

The backend handles these VAPI event types:
- `transcript` - Real-time speech-to-text
- `status-update` - Call status changes
- `call-start` / `call-end` - Call lifecycle events
- `function-call` - Function call events
- `conversation-update` - Conversation updates

## Logs

When using `./start.sh`, logs are saved to:
- Backend: `logs/backend.log`
- Frontend: `logs/frontend.log`

View logs in real-time:
```bash
tail -f logs/backend.log
tail -f logs/frontend.log
```

## Next Steps

The integration is now complete! Your frontend dashboard will:
- Show real VAPI transcript data instead of hardcoded data
- Update in real-time as VAPI sends webhook events
- Display connection status and system health
- Automatically handle reconnections and error recovery

Test it by making a call through VAPI and watching the transcript appear live in your frontend dashboard. 