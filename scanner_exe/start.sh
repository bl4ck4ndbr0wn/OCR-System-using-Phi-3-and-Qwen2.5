#!/bin/bash

# Scanner App Startup Script

echo "Starting Scanner Application..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed. Please install Python 3 to run the backend."
    exit 1
fi

# Check if Node.js is installed
if ! command -v npm &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js to run the frontend."
    exit 1
fi

# Function to stop all running processes on script exit
cleanup() {
    echo "Stopping all processes..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Set up trap for cleanup on script termination
trap cleanup SIGINT SIGTERM

# Start backend server
echo "Starting backend server..."
cd "$(dirname "$0")/backend"
echo "Installing backend dependencies..."
python3 -m pip install -r requirements.txt
echo "Starting FastAPI server on port 8765..."
python3 main.py &
BACKEND_PID=$!

# Wait a bit for the backend to start
sleep 2

# Start frontend server
echo "Starting frontend server..."
cd "$(dirname "$0")/frontend"
echo "Installing frontend dependencies..."
npm install
echo "Starting React development server..."
npm start &
FRONTEND_PID=$!

echo "Both servers are running!"
echo "Backend available at: http://localhost:8765"
echo "Frontend available at: http://localhost:3000"
echo "Press Ctrl+C to stop both servers."

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?
