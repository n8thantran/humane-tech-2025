"use client";

import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

// Mapbox configuration
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ4QIBpJI9A';

// Backend configuration
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8000';

// Types for backend data
interface TranscriptEntry {
  id: string;
  role: string;
  transcript: string;
  timestamp: string;
  call_id: string;
  confidence: number;
}

interface CallSession {
  call_id: string;
  status: string;
  start_time: string;
  participants: Record<string, any>;
  metadata: Record<string, any>;
}

interface WebSocketMessage {
  type: 'transcript' | 'call_status' | 'initial_data' | 'call_removed' | 'transcripts_cleared';
  data?: any;
  transcripts?: TranscriptEntry[];
  active_calls?: Record<string, CallSession>;
}

const Dashboard = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  
  // State for real-time data
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [activeCalls, setActiveCalls] = useState<Record<string, CallSession>>({});
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [stats, setStats] = useState({
    active_calls: 0,
    total_transcripts: 0,
    websocket_connections: 0
  });
  const [showClearMessage, setShowClearMessage] = useState(false);

  // Function to clear transcripts via backend API
  const clearTranscripts = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/clear-transcripts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        console.log('Transcripts cleared successfully');
        // Show success message
        setShowClearMessage(true);
        setTimeout(() => setShowClearMessage(false), 2000);
      } else {
        console.error('Failed to clear transcripts');
      }
    } catch (error) {
      console.error('Error clearing transcripts:', error);
    }
  };

  // Default call data for display when no active calls
  const [defaultStartTime, setDefaultStartTime] = useState("--:--:--");
  
  const defaultCallData = {
    id: "WAITING",
    status: "STANDBY",
    priority: "NORMAL",
    type: "SYSTEM",
    location: {
      address: "690 5th St, San Francisco, CA 94107",
      city: "San Francisco", 
      state: "CA",
      coordinates: [-122.3971, 37.7761] as [number, number]
    },
    caller: {
      phone: "Waiting for calls...",
      location: "N/A"
    },
    startTime: defaultStartTime,
    duration: "00:00:00"
  };

  // Set the default start time on client side only
  useEffect(() => {
    setDefaultStartTime(new Date().toLocaleTimeString());
  }, []);

  // Get current call data
  const getCurrentCall = () => {
    const activeCallIds = Object.keys(activeCalls);
    if (activeCallIds.length > 0) {
      const call = activeCalls[activeCallIds[0]];
      return {
        id: call.call_id,
        status: call.status.toUpperCase(),
        priority: "HIGH",
        type: "EMERGENCY",
        location: defaultCallData.location, // Use default location for now
        caller: {
          phone: call.participants?.phone || "Unknown",
          location: defaultCallData.location.address
        },
        startTime: new Date(call.start_time).toLocaleTimeString(),
        duration: calculateDuration(call.start_time)
      };
    }
    return defaultCallData;
  };

  const calculateDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Initialize WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      setConnectionStatus('connecting');
      
      const ws = new WebSocket(`${WEBSOCKET_URL}/ws/transcript`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        // Send a ping to keep connection alive
        ws.send(JSON.stringify({ type: 'ping' }));
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'initial_data':
              if (message.transcripts) {
                // Sort and deduplicate initial transcripts
                const uniqueTranscripts = message.transcripts
                  .sort((a: TranscriptEntry, b: TranscriptEntry) => 
                    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                  )
                  .filter((transcript: TranscriptEntry, index: number, arr: TranscriptEntry[]) => 
                    index === arr.findIndex(t => t.id === transcript.id)
                  );
                setTranscripts(uniqueTranscripts);
              }
              if (message.active_calls) {
                setActiveCalls(message.active_calls);
              }
              break;
              
            case 'transcript':
              if (message.data) {
                setTranscripts(prev => {
                  // Check if this transcript already exists (prevent duplicates)
                  const exists = prev.some(t => 
                    t.id === message.data.id || 
                    (t.transcript === message.data.transcript && 
                     t.role === message.data.role && 
                     Math.abs(new Date(t.timestamp).getTime() - new Date(message.data.timestamp).getTime()) < 1000)
                  );
                  
                  if (exists) {
                    return prev; // Don't add duplicate
                  }
                  
                  return [...prev, message.data].slice(-50); // Keep last 50 transcripts
                });
              }
              break;
              
            case 'call_status':
              if (message.data) {
                const callStatus = message.data.session.status.toLowerCase();
                
                setActiveCalls(prev => ({
                  ...prev,
                  [message.data.call_id]: message.data.session
                }));

                // Clear transcripts when call ends
                if (callStatus === 'ended' || callStatus === 'failed') {
                  console.log(`Call ${message.data.call_id} ended, clearing transcripts`);
                  setTranscripts([]);
                  setShowClearMessage(true);
                  setTimeout(() => setShowClearMessage(false), 3000);
                }
              }
              break;
              
            case 'call_removed':
              if (message.data?.call_id) {
                console.log(`Call ${message.data.call_id} removed, clearing transcripts`);
                setActiveCalls(prev => {
                  const newCalls = { ...prev };
                  delete newCalls[message.data.call_id];
                  return newCalls;
                });
                
                // Clear transcripts when call is removed
                setTranscripts([]);
                setShowClearMessage(true);
                setTimeout(() => setShowClearMessage(false), 3000);
              }
              break;
              
            case 'transcripts_cleared':
              console.log('Transcripts cleared by server');
              setTranscripts([]);
              setShowClearMessage(true);
              setTimeout(() => setShowClearMessage(false), 2000);
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('disconnected');
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('disconnected');
      };
    };

    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Auto-scroll to bottom when new transcripts arrive
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcripts]);

  // Fetch initial stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const currentCall = getCurrentCall();

  // Initialize map with hardcoded SF coordinates
  useEffect(() => {
    if (map.current) return;
    
    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

    // Hardcoded SF coordinates (Pylon - 690 5th St)
    const sfCoordinates: [number, number] = [-122.3971, 37.7761];

    if (mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: sfCoordinates,
        zoom: 12,
        antialias: true
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        if (!map.current) return;

        // Add emergency marker for the call location
        new mapboxgl.Marker({ color: '#ef4444', scale: 1.5 })
          .setLngLat(sfCoordinates)
          .setPopup(new mapboxgl.Popup().setHTML(
            `<div class="p-2">
              <h3 class="font-bold text-red-600">${currentCall.status === 'STANDBY' ? 'MONITORING LOCATION' : 'ACTIVE EMERGENCY CALL'}</h3>
              <p class="text-sm">Address: 690 5th St, San Francisco, CA 94107</p>
              <p class="text-sm">Caller: ${currentCall.caller.phone}</p>
            </div>`
          ))
          .addTo(map.current);

        // Add nearby emergency services
        const emergencyServices = [
          {
            coordinates: [-122.4089, 37.7849] as [number, number],
            title: "SFPD Central Station",
            type: "police"
          },
          {
            coordinates: [-122.4086, 37.7816] as [number, number],
            title: "SF Fire Station 13",
            type: "fire"
          },
          {
            coordinates: [-122.4133, 37.7756] as [number, number],
            title: "UCSF Medical Center",
            type: "medical"
          }
        ];

        emergencyServices.forEach(service => {
          const color = service.type === 'police' ? '#3b82f6' : 
                       service.type === 'fire' ? '#f59e0b' : '#10b981';
          
          new mapboxgl.Marker({ color, scale: 0.8 })
            .setLngLat(service.coordinates)
            .setPopup(new mapboxgl.Popup().setHTML(`<h3 class="font-bold">${service.title}</h3>`))
            .addTo(map.current!);
        });
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []); // Removed dependency on currentCall.location.coordinates

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      case 'resolved': 
      case 'ended': return 'bg-green-500';
      case 'standby': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected to VAPI';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      default: return 'Unknown';
    }
  };

  return (
    <div className="h-screen w-full relative bg-gray-900">
      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gray-800 border-b border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-white">Emergency Call Center</h1>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(currentCall.status)} animate-pulse`}></div>
              <span className="text-sm text-gray-300">
                {currentCall.status === 'STANDBY' ? 'Monitoring' : 'Live Call Active'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`}></div>
              <span className="text-xs text-gray-400">{getConnectionStatusText()}</span>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-sm text-gray-300">
              Duration: <span className="font-mono text-white">{currentCall.duration}</span>
            </div>
            <div className="text-sm text-gray-300">
              Call ID: <span className="font-mono text-white">{currentCall.id}</span>
            </div>
            <Link
              href="/"
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Exit Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Call Information Panel */}
      <div className="absolute top-16 left-6 z-10 bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-2xl p-6 w-80 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Call Information</h3>
          <div className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(currentCall.status)}`}>
            {currentCall.status}
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Priority</label>
            <div className="flex items-center space-x-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${currentCall.priority === 'HIGH' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
              <span className="text-sm text-white font-medium">{currentCall.priority}</span>
            </div>
          </div>
          
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Caller</label>
            <p className="text-sm text-white mt-1">{currentCall.caller.phone}</p>
            <p className="text-xs text-gray-300">{currentCall.caller.location}</p>
          </div>
          
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Location</label>
            <p className="text-sm text-white mt-1">{currentCall.location.address}</p>
          </div>
          
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Call Type</label>
            <p className="text-sm text-white mt-1">{currentCall.type}</p>
          </div>
          
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Start Time</label>
            <p className="text-sm text-white mt-1 font-mono">{currentCall.startTime}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Quick Actions</label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button className="bg-blue-600 text-white px-3 py-2 rounded text-xs font-medium hover:bg-blue-700 transition-colors">
              Transfer Call
            </button>
            <button className="bg-green-600 text-white px-3 py-2 rounded text-xs font-medium hover:bg-green-700 transition-colors">
              Dispatch Units
            </button>
            <button className="bg-yellow-600 text-white px-3 py-2 rounded text-xs font-medium hover:bg-yellow-700 transition-colors">
              Log Incident
            </button>
            <button className="bg-red-600 text-white px-3 py-2 rounded text-xs font-medium hover:bg-red-700 transition-colors">
              End Call
            </button>
          </div>
        </div>
      </div>

      {/* Live Transcript Panel */}
      <div className="absolute top-16 right-6 z-10 bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-2xl w-96 h-96 border border-gray-700 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Live Transcript</h3>
          <div className="flex items-center space-x-4">
            <button 
              onClick={clearTranscripts}
              className="text-xs bg-red-600/20 text-red-300 px-2 py-1 rounded hover:bg-red-600/30 transition-colors"
              title="Clear transcript"
            >
              Clear
            </button>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-300">
                {connectionStatus === 'connected' ? 'Recording' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {transcripts.length > 0 ? (
            transcripts
              .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) // Sort by timestamp
              .slice(-15) // Show last 15 entries
              .map((entry, index) => (
                <div key={`${entry.id}-${index}`} className="flex space-x-3 animate-fade-in">
                  <div className="flex-shrink-0">
                    <div className="text-xs text-gray-400 font-mono">{formatTime(entry.timestamp)}</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        entry.role === 'assistant' 
                          ? 'bg-blue-600/20 text-blue-300' 
                          : 'bg-green-600/20 text-green-300'
                      }`}>
                        {entry.role === 'assistant' ? 'Operator' : 'Caller'}
                      </span>
                      {entry.confidence < 0.8 && (
                        <span className="text-xs text-yellow-400">Low confidence</span>
                      )}
                    </div>
                    <p className="text-sm text-white leading-relaxed">{entry.transcript}</p>
                  </div>
                </div>
              ))
          ) : (
            <div className="text-center text-gray-400 py-8">
              {showClearMessage ? (
                <div className="text-center">
                  <p className="text-green-400">📞 Call ended</p>
                  <p className="text-xs mt-2 text-green-300">Transcript cleared</p>
                </div>
              ) : Object.keys(activeCalls).length === 0 ? (
                <>
                  <p>Waiting for transcript data...</p>
                  <p className="text-xs mt-2">Connection: {getConnectionStatusText()}</p>
                </>
              ) : (
                <>
                  <p>📞 Call active</p>
                  <p className="text-xs mt-2">Waiting for speech...</p>
                </>
              )}
            </div>
          )}
          <div ref={transcriptEndRef} />
        </div>
        
        <div className="p-4 border-t border-gray-700 bg-gray-900/50">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
            <span className="text-sm text-gray-300">
              {connectionStatus === 'connected' ? 'AI Assistant ready...' : 'Disconnected from VAPI'}
            </span>
          </div>
        </div>
      </div>

      {/* Emergency Services Legend */}
      <div className="absolute bottom-6 left-6 z-10 bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-2xl p-4 border border-gray-700">
        <h4 className="text-sm font-semibold text-white mb-3">Emergency Services</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-xs text-gray-300">Emergency Call Location</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-xs text-gray-300">Police Stations</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-xs text-gray-300">Fire Departments</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-300">Medical Centers</span>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gray-800 border-t border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-6">
            <div className="text-gray-300">
              System Status: <span className={`font-medium ${connectionStatus === 'connected' ? 'text-green-400' : 'text-red-400'}`}>
                {connectionStatus === 'connected' ? 'Operational' : 'Offline'}
              </span>
            </div>
            <div className="text-gray-300">
              Active Calls: <span className="text-white font-medium">{stats.active_calls}</span>
            </div>
            <div className="text-gray-300">
              Total Transcripts: <span className="text-white font-medium">{stats.total_transcripts}</span>
            </div>
            <div className="text-gray-300">
              WebSocket Connections: <span className="text-white font-medium">{stats.websocket_connections}</span>
            </div>
          </div>
          <div className="text-gray-400">
            Last Updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 