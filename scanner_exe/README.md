# Document Scanner Application

A cross-platform application for interfacing with document scanners using a Python backend and React frontend.

## Overview

This application allows users to:

- Connect to local scanners through a Python executable
- Scan documents directly from the web interface
- Download scanned documents as images

## Architecture

The application consists of two main components:

1. **Python Backend**
   - FastAPI server with WebSocket support
   - Scanner integration using platform-specific libraries:
     - Windows: TWAIN
     - Linux: SANE
     - macOS: Demo/Mock implementation (real implementation TBD)
   - Packaged as an executable using PyInstaller

2. **React Frontend**
   - Modern UI built with React and Material-UI
   - Connects to the backend via WebSockets
   - Real-time scanner status and previews

## Requirements

### Backend

- Python 3.8+
- FastAPI
- uvicorn
- Pillow
- Platform-specific scanner libraries:
  - Windows: python-twain
  - Linux: python-sane
  - macOS: (currently using a demo implementation)

### Frontend

- Node.js 16+
- React 18+
- Material-UI

## Getting Started

### Quick Start

The easiest way to run the application is to use the startup script:

```bash
# Make the script executable
chmod +x start.sh

# Run the application
./start.sh
```

This will start both the backend and frontend servers.

### Manual Setup

#### Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

### Building the Executable

To create a standalone executable of the backend:

```bash
cd backend
python build.py
```

The executable will be created in the `backend/dist` directory.

## Usage

1. Start the application using one of the methods above
2. Open your browser to <http://localhost:3000>
3. Select a scanner from the dropdown menu
4. Click "Scan Document" to start the scanning process
5. View and download the scanned document

## Troubleshooting

### Scanner Not Detected

- Ensure your scanner is connected and powered on
- Verify that appropriate scanner drivers are installed
- For specific platforms:
  - Windows: Ensure TWAIN drivers are installed
  - Linux: Verify SANE is properly configured
  - macOS: Currently using a demo implementation

### Connection Issues

- Verify that both backend and frontend servers are running
- Check that the WebSocket connection is not blocked by firewalls
- The backend runs on port 8000 by default

## License

MIT

## Acknowledgements

- Uses [python-twain](https://github.com/denisenkom/twain-python) for Windows TWAIN support
- Uses [python-sane](https://github.com/python-pillow/Sane) for Linux SANE support
