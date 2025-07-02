# Scanner WebSocket API

A high-performance native executable that provides WebSocket-based scanner access for web applications. This solution supports multiple operating systems and can handle high concurrent usage.

## Features

- WebSocket-based real-time communication
- Cross-platform support (Windows, macOS, Linux)
- Native scanner access using TWAIN (Windows), SANE (Linux)
- Scalable architecture supporting multiple concurrent connections
- Low-latency scanning operations

## Prerequisites

- Python 3.8 or higher
- Scanner drivers installed on your system
- For Windows: TWAIN drivers
- For Linux: SANE drivers

## Installation

1. Clone this repository
2. Install the required dependencies:

   ```bash
   pip install -r requirements.txt
   ```

## Building the Executable

To create a standalone executable:

1. Install PyInstaller (included in requirements.txt)
2. Run the build script:

   ```bash
   python build.py
   ```

3. The executable will be created in the `dist` directory:
   - Windows: `dist/scanner.exe`
   - macOS/Linux: `dist/scanner`
   - macOS also generates a proper installer package: `dist/scanner.pkg`

### Build Options

The build script now supports command-line arguments to customize the build process:

```bash
python build.py --platform [windows|linux|mac] --clean [--pkg-only]
```

Available options:

- `--platform`, `-p`: Specify the target platform (windows, linux, mac)
  - This allows cross-platform building (e.g., building a Windows executable on Linux)
- `--clean`, `-c`: Clean build artifacts before building
- `--pkg-only`: Skip PyInstaller and only build macOS package from existing dist directory
  - This is useful if you already built the executable and just need to recreate the pkg installer

Examples:

```bash
# Build for Windows (with cleanup)
python build.py --platform windows --clean

# Build for macOS
python build.py --platform mac

# Build for Linux
python build.py --platform linux

# Build for current platform with cleanup
python build.py --clean

# Only build macOS .pkg installer (if dist/ already exists)
python build.py --pkg-only
```

> **Note:** If you encounter any PyInstaller syntax errors, the build script uses the correct syntax for each platform automatically. For manual PyInstaller commands, use `--add-data=SOURCE:DEST` on Linux/macOS and `--add-data=SOURCE;DEST` on Windows.

### macOS Installation

For macOS, the build process now creates both a standalone executable and a proper installer package:

1. **Standalone Executable**: `dist/scanner` - Can be run directly from the terminal
2. **Installer Package**: `dist/scanner.pkg` - Can be installed system-wide:
   - Double-click the .pkg file to launch the installer
   - The installer will place the executable in `/usr/local/bin/scanner`
   - After installation, you can run it by typing `scanner` in the terminal

### Customizing the Build

To customize the build, you can modify `build.py`:

- Add custom icons (scanner.ico for Windows, scanner.icns for macOS)
- Include additional files
- Modify PyInstaller options

## Usage

### Running the Executable

1. Navigate to the `dist` directory
2. Run the executable:
   - Windows: Double-click `scanner.exe` or run from command line
   - macOS/Linux: Run `./scanner` from terminal
   - For macOS with installer: Run `scanner` from terminal after installation

2. The server will start on `ws://localhost:8765`

3. Connect to the WebSocket API from your web application:

   ```javascript
   const ws = new WebSocket(`ws://localhost:8765/ws/${clientId}`);
   
   // Send a scan request
   ws.send(JSON.stringify({
     action: "scan",
     data: {
       client_id: "unique_client_id",
       resolution: 300,
       color_mode: "color"
     }
   }));
   
   // Handle the response
   ws.onmessage = (event) => {
     const response = JSON.parse(event.data);
     if (response.success) {
       // Handle the scanned image (base64 encoded)
       const imageData = response.image_data;
     }
   };
   ```

## API Reference

### WebSocket Endpoint

- URL: `ws://localhost:8765/ws/{client_id}`
- Method: WebSocket

### Scan Request Format

```json
{
  "action": "scan",
  "data": {
    "client_id": "string",
    "resolution": 300,
    "color_mode": "color|grayscale|black_and_white"
  }
}
```

### Scan Response Format

```json
{
  "success": true,
  "message": "string",
  "image_data": "base64_encoded_image_string"
}
```

## Security Considerations

1. The WebSocket server runs locally on the client machine
2. Each client connection requires a unique client ID
3. All communication is encrypted using WebSocket's built-in security

## Performance Optimization

- The server is designed to handle multiple concurrent connections
- Image processing is optimized for low latency
- Scanner operations are performed asynchronously

## Troubleshooting

1. If the scanner is not detected:
   - Ensure scanner drivers are properly installed
   - Check system permissions
   - Verify scanner is connected and powered on

2. If connection fails:
   - Check if the server is running
   - Verify the WebSocket URL is correct
   - Ensure no firewall is blocking the connection

3. If the executable fails to start:
   - Check if all dependencies are installed
   - Verify system compatibility
   - Check system logs for error messages

## License

MIT License
