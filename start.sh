#!/bin/bash

# Start backend and frontend servers for the VAPI transcript application

echo "🚀 Starting VAPI Transcript Application..."

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed. Please install Python3 first."
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Create log directory
mkdir -p logs

echo "📡 Starting Backend Server..."
# Start backend in background
cd backend
python3 main.py > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

echo "🌐 Starting Frontend Server..."
# Start frontend in background
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo "✅ Both servers are starting..."
echo "📡 Backend: http://localhost:8000"
echo "🌐 Frontend: http://localhost:3000"
echo "📊 Dashboard: http://localhost:3000/dashboard"

# Function to cleanup processes
cleanup() {
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped."
    exit 0
}

# Set up trap to catch interrupt signal
trap cleanup INT TERM

echo "🎤 VAPI Transcript Application is running!"
echo "Press Ctrl+C to stop both servers"
echo ""
echo "📋 To view logs:"
echo "   Backend: tail -f logs/backend.log"
echo "   Frontend: tail -f logs/frontend.log"

# Wait for processes to finish
wait $BACKEND_PID $FRONTEND_PID 