import asyncio
import json
import os
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any, Dict, Optional

import requests
import uvicorn
from dotenv import load_dotenv
from fastapi import (
    BackgroundTasks,
    FastAPI,
    HTTPException,
    Request,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rich import box
from rich.console import Console
from rich.layout import Layout
from rich.live import Live
from rich.panel import Panel
from rich.table import Table
from rich.text import Text

# Import our custom modules
from transcript_manager import TranscriptEntry, transcript_manager
from vapi import vapi_handler

# Load environment variables
load_dotenv()

# Rich console for colorful terminal output
console = Console()

# Global variables for live display
live_display = None

class VAPIMessage(BaseModel):
    message: Dict[str, Any]
    timestamp: Optional[str] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global live_display
    
    # Startup
    console.print("[bold green]🚀 VAPI Live Transcription Server + WebSocket Starting...[/]")
    console.print(f"[cyan]📡 Webhook URL: http://localhost:{os.getenv('PORT', 8000)}/vapi/webhook[/]")
    console.print(f"[cyan]🔌 WebSocket URL: ws://localhost:{os.getenv('PORT', 8000)}/ws/transcript[/]")
    console.print("[yellow]⚠️  Configure webhook URL in your VAPI dashboard[/]")
    console.print("[blue]🌐 Connect clients to WebSocket for real-time transcripts[/]")
    
    # Create live display
    layout = create_live_layout()
    live_display = Live(layout, console=console, refresh_per_second=4)
    live_display.start()
    
    yield
    
    # Shutdown
    if live_display:
        live_display.stop()
    console.print("[bold red]🛑 Server Shutting Down...[/]")

# Initialize FastAPI app
app = FastAPI(
    title="VAPI Live Transcription Server",
    description="Real-time call transcription display from VAPI webhooks",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def create_live_layout():
    """Create the live display layout"""
    layout = Layout()
    layout.split_column(
        Layout(name="header", size=3),
        Layout(name="main", ratio=1),
        Layout(name="footer", size=3),
    )
    layout["main"].split_row(
        Layout(name="calls", ratio=1),
        Layout(name="transcripts", ratio=2),
    )
    
    update_layout(layout)
    return layout

def update_layout(layout):
    """Update the live display layout with current data"""
    # Get data from transcript manager
    active_calls = transcript_manager.get_active_calls()
    recent_transcripts = transcript_manager.get_recent_transcripts(10)
    stats = transcript_manager.get_stats()
    
    # Header
    layout["header"].update(
        Panel(
            Text("🎤 VAPI Live Transcription Monitor + WebSocket Server", style="bold white"),
            style="bold blue",
            box=box.ROUNDED
        )
    )
    
    # Active calls panel
    calls_table = Table(title="Active Calls", box=box.ROUNDED)
    calls_table.add_column("Call ID", style="cyan")
    calls_table.add_column("Status", style="green")
    calls_table.add_column("Start Time", style="yellow")
    
    for call_id, session in active_calls.items():
        calls_table.add_row(
            call_id[:8] + "...",
            session.status,
            session.start_time.split("T")[1][:8] if "T" in session.start_time else session.start_time
        )
    
    if not active_calls:
        calls_table.add_row("No active calls", "-", "-")
    
    layout["calls"].update(Panel(calls_table, title="Call Sessions"))
    
    # Transcripts panel
    transcripts_table = Table(title="Live Transcripts", box=box.ROUNDED)
    transcripts_table.add_column("Time", style="blue", width=10)
    transcripts_table.add_column("Role", style="green", width=10)
    transcripts_table.add_column("Transcript", style="white")
    
    # Show recent transcripts
    for transcript in recent_transcripts:
        role_style = "green" if transcript.role == "assistant" else "cyan"
        time_part = transcript.timestamp.split("T")[1][:8] if "T" in transcript.timestamp else transcript.timestamp.split(" ")[1][:8]
        transcripts_table.add_row(
            time_part,
            f"[{role_style}]{transcript.role}[/]",
            transcript.transcript[:80] + "..." if len(transcript.transcript) > 80 else transcript.transcript
        )
    
    if not recent_transcripts:
        transcripts_table.add_row("Waiting for calls...", "-", "No transcripts yet")
    
    layout["transcripts"].update(Panel(transcripts_table, title="Real-time Transcripts"))
    
    # Footer with WebSocket connection count
    footer_text = f"Server: http://localhost:{os.getenv('PORT', 8000)} | "
    footer_text += f"Active Calls: {stats['active_calls']} | "
    footer_text += f"Total Transcripts: {stats['total_transcripts']} | "
    footer_text += f"WebSocket Clients: {stats['active_connections']}"
    
    layout["footer"].update(
        Panel(
            Text(footer_text, style="dim white"),
            style="dim blue",
            box=box.ROUNDED
        )
    )



@app.get("/")
async def root():
    """Root endpoint with server info"""
    stats = transcript_manager.get_stats()
    return {
        "message": "VAPI Live Transcription Server with WebSocket Support",
        "status": "running",
        "webhook_url": f"http://localhost:{os.getenv('PORT', 8000)}/vapi/webhook",
        "websocket_url": f"ws://localhost:{os.getenv('PORT', 8000)}/ws/transcript",
        "active_calls": stats["active_calls"],
        "total_transcripts": stats["total_transcripts"],
        "websocket_connections": stats["active_connections"],
        "supported_events": vapi_handler.get_supported_events()
    }

@app.websocket("/ws/transcript")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time transcript streaming"""
    await transcript_manager.connect(websocket)
    console.print("[green]🔌 New WebSocket client connected[/]")
    
    try:
        while True:
            # Keep connection alive by waiting for messages
            # Client can send ping messages or other data
            data = await websocket.receive_text()
            
            # Handle any client messages if needed
            try:
                message = json.loads(data)
                if message.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
            except json.JSONDecodeError:
                # Ignore invalid JSON
                pass
            
    except WebSocketDisconnect:
        transcript_manager.disconnect(websocket)
        console.print("[yellow]🔌 WebSocket client disconnected[/]")
        
        # Update live display to reflect connection count change
        if live_display and live_display.is_started:
            layout = create_live_layout()
            live_display.update(layout)

@app.post("/vapi/webhook")
async def vapi_webhook(request: Request, background_tasks: BackgroundTasks):
    """Main VAPI webhook endpoint"""
    try:
        # Get the raw body
        body = await request.body()
        
        # DEBUG: Log raw webhook data
        console.print(f"[blue]🔍 RAW WEBHOOK DATA: {body.decode()[:200]}...[/]")
        
        # Parse JSON
        try:
            data = json.loads(body.decode())
            console.print(f"[green]📋 PARSED DATA TYPE: {data.get('type', 'NO_TYPE')}[/]")
            console.print(f"[yellow]📋 FULL DATA: {json.dumps(data, indent=2)[:500]}...[/]")
        except json.JSONDecodeError as e:
            console.print(f"[red]JSON decode error: {e}[/]")
            raise HTTPException(status_code=400, detail="Invalid JSON")
        
        # Process webhook with the VAPI handler (skip validation for now)
        result = await vapi_handler.process_webhook(data)
        
        # Update live display
        if live_display and live_display.is_started:
            layout = create_live_layout()
            live_display.update(layout)
        
        return result
    
    except Exception as e:
        console.print(f"[red]Webhook error: {str(e)}[/]")
        import traceback
        console.print(f"[red]Full traceback: {traceback.format_exc()}[/]")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/calls")
async def get_active_calls():
    """Get list of active calls"""
    active_calls = transcript_manager.get_active_calls()
    return {
        "active_calls": {k: v.dict() for k, v in active_calls.items()},
        "count": len(active_calls)
    }

@app.get("/transcripts")
async def get_transcripts():
    """Get recent transcripts"""
    recent_transcripts = transcript_manager.get_recent_transcripts(20)
    return {
        "transcripts": [t.dict() for t in recent_transcripts],
        "total_count": len(transcript_manager.transcripts)
    }

@app.get("/stats")
async def get_system_stats():
    """Get system statistics"""
    return transcript_manager.get_stats()

@app.get("/ws/info")
async def websocket_info():
    """Get WebSocket connection information"""
    return {
        "websocket_url": f"ws://localhost:{os.getenv('PORT', 8000)}/ws/transcript",
        "active_connections": transcript_manager.get_connection_count(),
        "supported_message_types": ["transcript", "call_status", "function_call", "conversation_update"]
    }

@app.post("/test-webhook")
async def test_webhook():
    """Test endpoint to simulate VAPI webhook"""
    test_message = {
        "message": {
            "type": "transcript",
            "role": "user",
            "transcript": "Hello, this is a test message from the API",
            "call": {"id": "test-call-123"}
        }
    }
    
    # Use the VAPI handler to process the test message
    result = await vapi_handler.process_webhook(test_message)
    
    if live_display and live_display.is_started:
        layout = create_live_layout()
        live_display.update(layout)
    
    return {
        "status": "test message sent",
        "result": result,
        "websocket_clients_notified": transcript_manager.get_connection_count()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "server": "VAPI Live Transcription"
    }

if __name__ == "__main__":
    # Print startup banner
    console.print("\n[bold blue]" + "="*70 + "[/]")
    console.print("[bold white]🎤 VAPI Live Transcription Server + WebSocket[/]")
    console.print("[bold blue]" + "="*70 + "[/]")
    console.print(f"[cyan]📡 Webhook URL: http://localhost:{os.getenv('PORT', 8000)}/vapi/webhook[/]")
    console.print(f"[cyan]🔌 WebSocket URL: ws://localhost:{os.getenv('PORT', 8000)}/ws/transcript[/]")
    console.print("[yellow]⚠️  Configure webhook URL in your VAPI dashboard[/]")
    console.print("[blue]🌐 Connect clients to WebSocket for real-time data[/]")
    console.print("[green]🟢 Server starting...[/]\n")
    
    # Run the server
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=True,
        access_log=False  # Disable access logs for cleaner output
    )
