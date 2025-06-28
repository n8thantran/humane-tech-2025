"""
VAPI Webhook Handler
Processes different types of VAPI webhook events and messages
"""

import asyncio
import json
from datetime import datetime
from typing import Any, Dict, Optional

from rich.console import Console
from transcript_manager import transcript_manager

console = Console()

class VAPIWebhookHandler:
    """Handles VAPI webhook events and processing"""
    
    def __init__(self):
        self.supported_events = {
            "transcript": self.handle_transcript,
            "status-update": self.handle_status_update,
            "function-call": self.handle_function_call,
            "call-start": self.handle_call_start,
            "call-end": self.handle_call_end,
            "conversation-update": self.handle_conversation_update
        }
    
    async def process_webhook(self, webhook_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process incoming webhook data from VAPI"""
        
        # Extract message from webhook data
        message = webhook_data.get("message", webhook_data)
        message_type = message.get("type", "unknown")
        
        # Log incoming message
        console.print(f"[blue]📨 Received VAPI event: {message_type}[/]")
        console.print(f"[yellow]🔍 Message keys: {list(message.keys())}[/]")
        
        # Process based on message type
        if message_type in self.supported_events:
            try:
                result = await self.supported_events[message_type](message)
                return {
                    "status": "success",
                    "message_type": message_type,
                    "processed": True,
                    "result": result
                }
            except Exception as e:
                console.print(f"[red]❌ Error processing {message_type}: {str(e)}[/]")
                return {
                    "status": "error",
                    "message_type": message_type,
                    "error": str(e)
                }
        else:
            console.print(f"[yellow]⚠️ Unsupported event type: {message_type}[/]")
            return {
                "status": "warning",
                "message_type": message_type,
                "processed": False,
                "reason": "unsupported_event_type"
            }
    
    async def handle_transcript(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle transcript events from VAPI"""
        
        role = message.get("role", "unknown")
        transcript_text = message.get("transcript", "")
        call_info = message.get("call", {})
        call_id = call_info.get("id", "unknown")
        
        # Console output with color coding
        role_color = "green" if role == "assistant" else "cyan"
        console.print(f"[{role_color}]🎤 {role.upper()}:[/] {transcript_text}")
        
        # Add to transcript manager (will broadcast to WebSocket clients)
        transcript_entry = await transcript_manager.add_transcript(message)
        
        return {
            "transcript_id": transcript_entry.id,
            "role": role,
            "call_id": call_id,
            "length": len(transcript_text)
        }
    
    async def handle_status_update(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle call status updates from VAPI"""
        
        # VAPI sends status directly in message, not in call object
        status = message.get("status", "unknown")
        call_id = message.get("callId", message.get("id", "unknown"))
        end_reason = message.get("endedReason", "")
        
        console.print(f"[yellow]📞 Call {call_id[:8] if call_id != 'unknown' else 'unknown'}... status: {status}[/]")
        if end_reason:
            console.print(f"[yellow]📞 End reason: {end_reason}[/]")
        
        # Create call info object for transcript manager
        call_info = {
            "id": call_id,
            "status": status
        }
        
        # Update call status in transcript manager
        await transcript_manager.update_call_status(call_info)
        
        return {
            "call_id": call_id,
            "status": status,
            "end_reason": end_reason,
            "updated_at": datetime.now().isoformat()
        }
    
    async def handle_function_call(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle function call events from VAPI"""
        
        function_call = message.get("functionCall", {})
        function_name = function_call.get("name", "unknown")
        parameters = function_call.get("parameters", {})
        
        console.print(f"[magenta]🔧 Function call: {function_name}[/]")
        console.print(f"[dim]Parameters: {json.dumps(parameters, indent=2)}[/]")
        
        # Broadcast function call to WebSocket clients
        await transcript_manager.broadcast_message({
            "type": "function_call",
            "data": {
                "function_name": function_name,
                "parameters": parameters,
                "timestamp": datetime.now().isoformat()
            }
        })
        
        return {
            "function_name": function_name,
            "parameter_count": len(parameters)
        }
    
    async def handle_call_start(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle call start events"""
        
        call_info = message.get("call", {})
        call_id = call_info.get("id", "unknown")
        
        console.print(f"[green]📞 Call started: {call_id[:8]}...[/]")
        
        # Initialize call session
        await transcript_manager.update_call_status({
            "id": call_id,
            "status": "active"
        })
        
        return {
            "call_id": call_id,
            "started_at": datetime.now().isoformat()
        }
    
    async def handle_call_end(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle call end events"""
        
        call_info = message.get("call", {})
        call_id = call_info.get("id", "unknown")
        end_reason = message.get("endedReason", "unknown")
        
        console.print(f"[red]📞 Call ended: {call_id[:8]}... (Reason: {end_reason})[/]")
        
        # Update call status to ended
        await transcript_manager.update_call_status({
            "id": call_id,
            "status": "ended"
        })
        
        return {
            "call_id": call_id,
            "end_reason": end_reason,
            "ended_at": datetime.now().isoformat()
        }
    
    async def handle_conversation_update(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle conversation update events"""
        
        conversation = message.get("conversation", [])
        call_info = message.get("call", {})
        call_id = call_info.get("id", "unknown")
        
        console.print(f"[blue]💬 Conversation update for call {call_id[:8]}... ({len(conversation)} messages)[/]")
        
        # Broadcast conversation update
        await transcript_manager.broadcast_message({
            "type": "conversation_update",
            "data": {
                "call_id": call_id,
                "message_count": len(conversation),
                "timestamp": datetime.now().isoformat()
            }
        })
        
        return {
            "call_id": call_id,
            "message_count": len(conversation)
        }
    
    def get_supported_events(self) -> list:
        """Get list of supported event types"""
        return list(self.supported_events.keys())
    
    async def validate_webhook_data(self, data: Dict[str, Any]) -> bool:
        """Validate incoming webhook data structure"""
        
        # Basic validation
        if not isinstance(data, dict):
            return False
        
        # Check for message or direct event structure
        message = data.get("message", data)
        if not isinstance(message, dict):
            return False
        
        # Must have a type field
        if "type" not in message:
            return False
        
        return True

# Global webhook handler instance
vapi_handler = VAPIWebhookHandler() 