import { ScanRequest, ScanResponse, Scanner } from "../types/scanner";

class ScannerService {
  private ws: WebSocket | null = null;
  public readonly clientId: string;
  private connectionAttempts = 0;
  private readonly retryDelay = 2000; // 2 seconds

  constructor() {
    this.clientId = `client_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`ScannerService initialized with client ID: ${this.clientId}`);
  }

  private async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async connect(): Promise<void> {
    console.log("Starting connection process...");
    while (true) {
      try {
        await this.attemptConnection();
        return;
      } catch (error) {
        this.connectionAttempts++;
        // Dispatch connection attempt event
        window.dispatchEvent(new Event("scannerConnectionAttempt"));
        console.log(
          `Connection attempt ${this.connectionAttempts} failed:`,
          error instanceof Error ? error.message : "Unknown error",
          `Retrying in ${this.retryDelay / 1000} seconds...`
        );
        await this.wait(this.retryDelay);
      }
    }
  }

  private attemptConnection(): Promise<void> {
    console.log("Attempting WebSocket connection...");
    return new Promise((resolve, reject) => {
      if (this.ws) {
        console.log("Closing existing WebSocket connection...");
        this.ws.close();
      }

      const wsUrl = `ws://localhost:8765/ws/${this.clientId}`;
      console.log(`Creating new WebSocket connection to: ${wsUrl}`);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("WebSocket connection established successfully");
        this.connectionAttempts = 0;
        resolve();
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket connection error:", error);
        reject(error);
      };

      this.ws.onclose = (event) => {
        console.log("WebSocket connection closed:", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        this.ws = null;
      };
    });
  }

  disconnect() {
    console.log("Disconnecting from scanner service...");
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      console.log("Disconnected successfully");
    } else {
      console.log("No active connection to disconnect");
    }
  }

  async listScanners(): Promise<Scanner[]> {
    console.log("Requesting scanner list...");
    if (!this.ws) {
      console.error("Cannot list scanners: WebSocket not connected");
      throw new Error(
        "WebSocket not connected. Please ensure the scanner service is running."
      );
    }

    return new Promise((resolve, reject) => {
      const messageHandler = (event: MessageEvent) => {
        try {
          console.log("Received message:", event.data);
          const response = JSON.parse(event.data);
          if (response.action === "list_scanners") {
            console.log("Received scanner list:", response.scanners);

            // Ensure scanners is an array
            let scanners = response.scanners;
            if (!Array.isArray(scanners)) {
              console.warn(
                "Scanners is not an array, converting to empty array"
              );
              scanners = [];
            }

            if (this.ws) {
              this.ws.removeEventListener("message", messageHandler);
            }
            resolve(scanners);
          }
        } catch (error) {
          console.error("Error parsing scanner list response:", error);
          reject(error);
        }
      };

      const ws = this.ws as WebSocket;
      ws.addEventListener("message", messageHandler);

      const request = {
        action: "list_scanners",
        data: {
          client_id: this.clientId,
        },
      };
      console.log("Sending scanner list request:", request);
      ws.send(JSON.stringify(request));
    });
  }

  async scan(settings: ScanRequest["data"]): Promise<ScanResponse> {
    console.log("Starting scan operation with settings:", settings);
    if (!this.ws) {
      console.error("Cannot scan: WebSocket not connected");
      throw new Error(
        "WebSocket not connected. Please ensure the scanner service is running."
      );
    }

    return new Promise((resolve, reject) => {
      let isResolved = false;

      const messageHandler = (event: MessageEvent) => {
        try {
          console.log("Received message during scan:", event.data);
          const response = JSON.parse(event.data);

          // Handle ping messages
          if (response.action === "ping") {
            console.log(`Scanner status update: ${response.status}`);
            return;
          }

          // Handle scan response
          if (response.action === "scan" && !isResolved) {
            console.log("Received scan response:", response);
            isResolved = true;
            if (this.ws) {
              this.ws.removeEventListener("message", messageHandler);
            }
            resolve(response);
          }
        } catch (error) {
          console.error("Error parsing scan response:", error);
          if (!isResolved) {
            isResolved = true;
            reject(error);
          }
        }
      };

      const ws = this.ws as WebSocket;
      ws.addEventListener("message", messageHandler);

      // Add error handler for WebSocket connection issues
      const errorHandler = (error: Event) => {
        console.error("WebSocket error during scan:", error);
        if (!isResolved) {
          isResolved = true;
          reject(new Error("WebSocket connection error during scan"));
        }
      };

      // Add close handler for WebSocket disconnection
      const closeHandler = (event: CloseEvent) => {
        console.log("WebSocket closed during scan:", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        if (!isResolved) {
          isResolved = true;
          reject(new Error("WebSocket connection closed during scan"));
        }
      };

      ws.addEventListener("error", errorHandler);
      ws.addEventListener("close", closeHandler);

      const request = {
        action: "scan",
        data: {
          ...settings,
          client_id: this.clientId,
        },
      };
      console.log("Sending scan request:", request);
      ws.send(JSON.stringify(request));
    });
  }
}

export const scannerService = new ScannerService();
