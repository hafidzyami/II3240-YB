export class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.connect();
  }

  connect() {
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
      console.log("Closing existing connection before reconnecting");
      this.socket.close();
    }

    let wsUrl;
    if (process.env.NODE_ENV === "production") {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      wsUrl = `${protocol}//${window.location.host}/ws`;
    } else {
      wsUrl = "ws://localhost:8000/ws";
    }
    
    console.log(`Attempting to connect to WebSocket at: ${wsUrl}`);

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log("WebSocket connection established");
        this.emit("connected", true);

        // Send initial hello message
        this.send({
          type: "hello",
          client: "react-frontend",
          timestamp: Date.now(),
        });

        // Setup ping interval
        this.pingInterval = setInterval(() => {
          if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.send({
              type: "ping",
              timestamp: Date.now(),
            });
          }
        }, 30000);
      };

      this.socket.onmessage = (event) => {
        try {
          console.log("Received WebSocket message:", event.data);
          const message = JSON.parse(event.data);

          // Handle ping/pong
          if (message.type === "ping") {
            console.log("Received ping, sending pong response");
            this.send({
              type: "pong",
              timestamp: Date.now(),
              client_timestamp: message.timestamp,
            });
            return;
          }

          // Emit message to listeners
          this.emit(message.type, message);
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      };

      this.socket.onclose = (event) => {
        console.log("WebSocket connection closed:", event.code, event.reason);
        this.emit("connected", false);
        
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
        }

        // Attempt to reconnect after 5 seconds
        if (!this.reconnectInterval) {
          this.reconnectInterval = setTimeout(() => {
            this.reconnectInterval = null;
            this.connect();
          }, 5000);
        }
      };

      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.emit("error", error);
      };
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
      this.emit("error", error);
    }
  }

  send(data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn("WebSocket is not connected. Cannot send data.");
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }
  }
}
