#!/bin/bash

# Test script to verify frontend-backend connection

echo "🧪 Testing Frontend-Backend Connection..."

BACKEND_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:3000"

# Test backend health
echo "📡 Testing Backend Health..."
if curl -s $BACKEND_URL/health > /dev/null; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running. Start it with: cd backend && python3 main.py"
    exit 1
fi

# Test backend stats endpoint
echo "📊 Testing Backend Stats..."
if curl -s $BACKEND_URL/stats > /dev/null; then
    echo "✅ Stats endpoint working"
    curl -s $BACKEND_URL/stats | jq . 2>/dev/null || curl -s $BACKEND_URL/stats
else
    echo "❌ Stats endpoint not working"
fi

# Send test transcript
echo "📝 Sending Test Transcript..."
TEST_RESPONSE=$(curl -s -X POST $BACKEND_URL/test-webhook)
if [ $? -eq 0 ]; then
    echo "✅ Test transcript sent successfully"
    echo "$TEST_RESPONSE" | jq . 2>/dev/null || echo "$TEST_RESPONSE"
else
    echo "❌ Failed to send test transcript"
fi

# Test WebSocket info
echo "🔌 Testing WebSocket Info..."
WS_INFO=$(curl -s $BACKEND_URL/ws/info)
if [ $? -eq 0 ]; then
    echo "✅ WebSocket endpoint info:"
    echo "$WS_INFO" | jq . 2>/dev/null || echo "$WS_INFO"
else
    echo "❌ WebSocket endpoint not accessible"
fi

# Check if frontend is running
echo "🌐 Testing Frontend..."
if curl -s $FRONTEND_URL > /dev/null 2>&1; then
    echo "✅ Frontend is running"
else
    echo "⚠️  Frontend might not be running. Start it with: cd frontend && npm run dev"
fi

echo ""
echo "🎯 Test Complete!"
echo ""
echo "If all tests passed, visit:"
echo "  📊 Dashboard: $FRONTEND_URL/dashboard"
echo "  📡 Backend API: $BACKEND_URL"
echo ""
echo "The dashboard should now show:"
echo "  - Connection status: 'Connected to VAPI' (green dot)"
echo "  - Test transcript in the Live Transcript panel"
echo "  - Real-time stats in the bottom status bar" 