const WebSocket = require('ws');

class NativeWebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws'
    });
    
    this.clients = new Set();
    this.ledCommandCallback = null;
    this.servoCommandCallback = null;
    
    this.wss.on('connection', (ws) => {
      console.log('New WebSocket client connected');
      this.clients.add(ws);
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connection',
        message: 'Connected to IoT WebSocket server'
      }));
      
      // Setup ping interval to keep connection alive
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'ping',
            timestamp: Date.now()
          }));
        }
      }, 30000); // Ping every 30 seconds
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('Received from client:', message);
          
          switch (message.type) {
            case 'hello':
              ws.send(JSON.stringify({
                type: 'hello_response',
                message: 'Hello from IoT server',
                timestamp: Date.now()
              }));
              break;
              
            case 'pong':
              console.log('Received pong response from client');
              break;
              
            case 'led_control':
              if (this.ledCommandCallback) {
                this.ledCommandCallback(message);
              }
              ws.send(JSON.stringify({
                type: 'led_control_ack',
                success: true,
                state: message.state
              }));
              break;
              
            case 'servo_control':
              if (this.servoCommandCallback) {
                this.servoCommandCallback(message);
              }
              ws.send(JSON.stringify({
                type: 'servo_control_ack',
                success: true,
                angle: message.angle
              }));
              break;
              
            default:
              console.log('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Error processing client message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Error processing message'
          }));
        }
      });
      
      ws.on('close', () => {
        console.log('Client disconnected');
        this.clients.delete(ws);
        clearInterval(pingInterval);
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
        clearInterval(pingInterval);
      });
    });
  }
  
  broadcast(data) {
    const message = JSON.stringify({
      type: 'iot_data',
      data: data
    });
    
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
  
  getClientCount() {
    return this.clients.size;
  }
  
  setLedCommandCallback(callback) {
    this.ledCommandCallback = callback;
  }
  
  setServoCommandCallback(callback) {
    this.servoCommandCallback = callback;
  }
}

module.exports = NativeWebSocketServer;
