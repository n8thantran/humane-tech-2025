"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Mapbox configuration
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ4QIBpJI9A';

// Hardcoded call data from VAPI
const callData = {
  id: "CALL_001",
  status: "ACTIVE",
  priority: "HIGH",
  type: "EMERGENCY",
  location: {
    address: "690 5th St, San Francisco, CA 94107",
    city: "San Francisco",
    state: "CA",
    coordinates: [-122.3971, 37.7761] as [number, number] // Pylon - 690 5th St coordinates
  },
  caller: {
    phone: "+1 (555) 123-4567",
    location: "690 5th St, San Francisco, CA 94107"
  },
  startTime: "12:30:06",
  duration: "00:02:31"
};

const transcriptData = [
  { time: "12:30:06", role: "assistant", message: "Please tell me what's happening and your location." },
  { time: "12:30:07", role: "user", message: "Can you call forward this" },
  { time: "12:30:12", role: "user", message: "Can you forward my call?" },
  { time: "12:30:14", role: "assistant", message: "Please provide" },
  { time: "12:30:18", role: "assistant", message: "I can help with that. Could you please tell me the nature of the emergency and y..." },
  { time: "12:30:23", role: "assistant", message: "First? This information is crucial for ensuring you get the right assistance." },
  { time: "12:30:25", role: "user", message: "Yes. I'm in San Francisco, and my dog is dead." },
  { time: "12:30:31", role: "assistant", message: "I'm really sorry to hear about your dog. I understand this is a difficult time for you. I will transfer your call to someone who can assist you further. P..." },
  { time: "12:30:34", role: "assistant", message: "time for you. I will transfer your call to someone who can assist you further." },
  { time: "12:30:37", role: "assistant", message: "Transferring the call now." }
];

const Dashboard = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [currentTranscriptIndex, setCurrentTranscriptIndex] = useState(transcriptData.length - 1);

  useEffect(() => {
    if (map.current) return;
    
    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

    if (mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: callData.location.coordinates,
        zoom: 12,
        antialias: true
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        if (!map.current) return;

        // Add emergency marker for the call location
        new mapboxgl.Marker({ color: '#ef4444', scale: 1.5 })
          .setLngLat(callData.location.coordinates)
          .setPopup(new mapboxgl.Popup().setHTML(
            `<div class="p-2">
              <h3 class="font-bold text-red-600">ACTIVE EMERGENCY CALL</h3>
              <p class="text-sm">Address: ${callData.location.address}</p>
              <p class="text-sm">Caller: ${callData.caller.phone}</p>
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
  }, []);

  // Auto-scroll transcript (simulate live updates)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTranscriptIndex(prev => (prev + 1) % transcriptData.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const formatTime = (timeStr: string) => {
    return timeStr;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-red-500';
      case 'PENDING': return 'bg-yellow-500';
      case 'RESOLVED': return 'bg-green-500';
      default: return 'bg-gray-500';
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
              <div className={`w-3 h-3 rounded-full ${getStatusColor(callData.status)} animate-pulse`}></div>
              <span className="text-sm text-gray-300">Live Call Active</span>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-sm text-gray-300">
              Duration: <span className="font-mono text-white">{callData.duration}</span>
            </div>
            <div className="text-sm text-gray-300">
              Call ID: <span className="font-mono text-white">{callData.id}</span>
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
          <div className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(callData.status)}`}>
            {callData.status}
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Priority</label>
            <div className="flex items-center space-x-2 mt-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm text-white font-medium">{callData.priority}</span>
            </div>
          </div>
          
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Caller</label>
            <p className="text-sm text-white mt-1">{callData.caller.phone}</p>
            <p className="text-xs text-gray-300">{callData.caller.location}</p>
          </div>
          
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Location</label>
            <p className="text-sm text-white mt-1">{callData.location.address}</p>
          </div>
          
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Call Type</label>
            <p className="text-sm text-white mt-1">{callData.type}</p>
          </div>
          
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Start Time</label>
            <p className="text-sm text-white mt-1 font-mono">{callData.startTime}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 pt-4 border-t border-gray-700">
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
      <div className="absolute top-16 right-6 z-10 bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-2xl w-96 h-[calc(100vh-8rem)] border border-gray-700 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Live Transcript</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-300">Recording</span>
          </div>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {transcriptData.slice(0, currentTranscriptIndex + 1).map((entry, index) => (
            <div 
              key={index} 
              className={`flex space-x-3 ${index === currentTranscriptIndex ? 'animate-pulse' : ''}`}
            >
              <div className="flex-shrink-0">
                <div className="text-xs text-gray-400 font-mono">{formatTime(entry.time)}</div>
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
                </div>
                <p className="text-sm text-white leading-relaxed">{entry.message}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300">AI Assistant is responding...</span>
          </div>
        </div>
      </div>

      {/* Emergency Services Legend */}
      <div className="absolute bottom-6 left-6 z-10 bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-2xl p-4 border border-gray-700">
        <h4 className="text-sm font-semibold text-white mb-3">Emergency Services</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-xs text-gray-300">Active Emergency Call</span>
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
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gray-800 border-t border-gray-700 px-6 py-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-6">
            <div className="text-gray-300">
              System Status: <span className="text-green-400 font-medium">Operational</span>
            </div>
            <div className="text-gray-300">
              Active Calls: <span className="text-white font-medium">1</span>
            </div>
            <div className="text-gray-300">
              Available Operators: <span className="text-white font-medium">3</span>
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