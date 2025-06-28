"""
Transcript Manager for WebSocket Broadcasting and Data Management
Handles real-time transcript distribution to connected clients
"""

import asyncio
import json
from datetime import datetime
from typing import Any, Dict, List, Set

from fastapi import WebSocket
from pydantic import BaseModel


class TranscriptEntry(BaseModel):
    id: str
    role: str
    transcript: str
    timestamp: str
    call_id: str
    confidence: float = 1.0

class CallSession(BaseModel):
    call_id: str
    status: str
    start_time: str
    participants: Dict[str, Any] = {}
    metadata: Dict[str, Any] = {}

class TranscriptManager:
    """Manages transcript storage and WebSocket broadcasting"""
    
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.transcripts: List[TranscriptEntry] = []
        self.call_sessions: Dict[str, CallSession] = {}
        self.max_transcripts = 1000  # Keep last 1000 transcripts
    
    async def connect(self, websocket: WebSocket):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        self.active_connections.add(websocket)
        
        # Send recent transcripts to new client
        recent_transcripts = self.transcripts[-20:]  # Last 20 transcripts
        if recent_transcripts:
            await websocket.send_text(json.dumps({
                "type": "initial_data",
                "transcripts": [t.dict() for t in recent_transcripts],
                "active_calls": {k: v.dict() for k, v in self.call_sessions.items()}
            }))
    
    def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection"""
        self.active_connections.discard(websocket)
    
    async def add_transcript(self, transcript_data: Dict[str, Any]) -> TranscriptEntry:
        """Add new transcript and broadcast to all clients"""
        transcript = TranscriptEntry(
            id=f"{transcript_data.get('call', {}).get('id', 'unknown')}_{len(self.transcripts)}",
            role=transcript_data.get("role", "unknown"),
            transcript=transcript_data.get("transcript", ""),
            timestamp=datetime.now().isoformat(),
            call_id=transcript_data.get("call", {}).get("id", "unknown"),
            confidence=transcript_data.get("confidence", 1.0)
        )
        
        self.transcripts.append(transcript)
        
        # Keep only recent transcripts
        if len(self.transcripts) > self.max_transcripts:
            self.transcripts = self.transcripts[-self.max_transcripts:]
        
        # Broadcast to all connected clients
        await self.broadcast_transcript(transcript)
        
        return transcript
    
    async def update_call_status(self, call_data: Dict[str, Any]):
        """Update call session status"""
        call_id = call_data.get("id", "unknown")
        status = call_data.get("status", "unknown")
        
        if call_id not in self.call_sessions:
            self.call_sessions[call_id] = CallSession(
                call_id=call_id,
                status=status,
                start_time=datetime.now().isoformat()
            )
        else:
            self.call_sessions[call_id].status = status
        
        # Broadcast call status update
        await self.broadcast_call_status(call_id, self.call_sessions[call_id])
        
        # Remove ended calls after a delay
        if status in ["ended", "failed"]:
            asyncio.create_task(self._remove_call_after_delay(call_id, 30))
    
    async def broadcast_transcript(self, transcript: TranscriptEntry):
        """Broadcast transcript to all connected WebSocket clients"""
        if not self.active_connections:
            return
        
        message = {
            "type": "transcript",
            "data": transcript.dict()
        }
        
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                disconnected.add(connection)
        
        # Remove disconnected clients
        for conn in disconnected:
            self.active_connections.discard(conn)
    
    async def broadcast_call_status(self, call_id: str, call_session: CallSession):
        """Broadcast call status update to all connected clients"""
        if not self.active_connections:
            return
        
        message = {
            "type": "call_status",
            "data": {
                "call_id": call_id,
                "session": call_session.dict()
            }
        }
        
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                disconnected.add(connection)
        
        # Remove disconnected clients
        for conn in disconnected:
            self.active_connections.discard(conn)
    
    async def broadcast_message(self, message: Dict[str, Any]):
        """Broadcast custom message to all connected clients"""
        if not self.active_connections:
            return
        
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                disconnected.add(connection)
        
        # Remove disconnected clients
        for conn in disconnected:
            self.active_connections.discard(conn)
    
    async def _remove_call_after_delay(self, call_id: str, delay: int):
        """Remove call session after delay"""
        await asyncio.sleep(delay)
        if call_id in self.call_sessions:
            del self.call_sessions[call_id]
            
            # Notify clients of call removal
            await self.broadcast_message({
                "type": "call_removed",
                "data": {"call_id": call_id}
            })
    
    def get_recent_transcripts(self, count: int = 20) -> List[TranscriptEntry]:
        """Get recent transcripts"""
        return self.transcripts[-count:] if self.transcripts else []
    
    def get_active_calls(self) -> Dict[str, CallSession]:
        """Get active call sessions"""
        return self.call_sessions.copy()
    
    def get_connection_count(self) -> int:
        """Get number of active WebSocket connections"""
        return len(self.active_connections)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get system statistics"""
        return {
            "active_connections": len(self.active_connections),
            "total_transcripts": len(self.transcripts),
            "active_calls": len(self.call_sessions),
            "recent_activity": len([t for t in self.transcripts 
                                  if (datetime.now() - datetime.fromisoformat(t.timestamp)).seconds < 300])
        }
    
    async def clear_transcripts(self):
        """Clear all stored transcripts and broadcast to clients"""
        self.transcripts.clear()
        
        # Broadcast clear event to all connected clients
        await self.broadcast_message({
            "type": "transcripts_cleared",
            "data": {"message": "All transcripts cleared", "timestamp": datetime.now().isoformat()}
        })

# Global transcript manager instance
transcript_manager = TranscriptManager() 