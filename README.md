[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/n8thantran/humane-tech-2025)

# Humane Tech 2025

A full-stack application for real-time call transcription and visualization, combining a FastAPI backend with a Next.js frontend.

## Overview
This project provides a platform for live call transcription using VAPI webhooks. The backend processes real-time audio streams, manages transcripts, and exposes data via REST and WebSocket APIs. The frontend visualizes this data, offering a modern dashboard for monitoring and analysis.

## Demo
Check out a short demo of the project in action:
[https://youtube.com/shorts/nQHImVZYsAA?si=76vgd3ak_DzBPdx9](https://youtube.com/shorts/nQHImVZYsAA?si=76vgd3ak_DzBPdx9)

## Features
- Real-time call transcription via VAPI webhooks
- WebSocket server for live transcript streaming
- REST API for call and transcript management
- Rich terminal dashboard for server monitoring
- Modern Next.js frontend with interactive UI

## Directory Structure
```
humane-tech-2025/
  backend/        # FastAPI backend for transcription and APIs
    main.py
    requirements.txt
    transcript_manager.py
    vapi.py
  frontend/       # Next.js frontend dashboard
    src/
    package.json
    ...
  FRONTEND_BACKEND_INTEGRATION.md  # Integration notes
  ...
```

## Backend Setup
1. **Install dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
2. **Configure environment:**
   - Copy `.env.example` to `.env` and set required variables (see code for details).
3. **Run the server:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```
4. **Endpoints:**
   - REST: `http://localhost:8000/`
   - WebSocket: `ws://localhost:8000/ws/transcript`
   - Webhook: `http://localhost:8000/vapi/webhook`

## Frontend Setup
1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```
2. **Run the development server:**
   ```bash
   npm run dev
   ```
   - App runs at [http://localhost:3000](http://localhost:3000)

## Integration
- The frontend communicates with the backend's REST and WebSocket endpoints to display live transcription data.
- See `FRONTEND_BACKEND_INTEGRATION.md` for more details on connecting the two services.
