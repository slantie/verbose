// This is a placeholder for the actual Socket.io implementation
// In a real application, you would use the socket.io-client library

class SocketService {
  private socket: any;
  private connected: boolean = false;
  private listeners: Record<string, Function[]> = {};

  connect(token: string) {
    console.log("Connecting to socket server...");
    
    // Simulate connection
    setTimeout(() => {
      this.connected = true;
      console.log("Socket connected");
      
      // Trigger any connect listeners
      this.trigger("connect");
      
      // Simulate receiving messages
      setInterval(() => {
        this.trigger("message", {
          id: Math.random().toString(36).substring(7),
          content: "This is a simulated message",
          senderId: "2",
          receiverId: "1",
          timestamp: new Date(),
          read: false,
        });
      }, 30000); // Every 30 seconds
    }, 1000);
    
    return this;
  }

  disconnect() {
    console.log("Disconnecting from socket server...");
    this.connected = false;
    this.trigger("disconnect");
    return this;
  }

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return this;
  }

  off(event: string, callback?: Function) {
    if (!callback) {
      delete this.listeners[event];
    } else if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(
        (cb) => cb !== callback
      );
    }
    return this;
  }

  emit(event: string, data?: any) {
    console.log(`Emitting event: ${event}`, data);
    
    // Simulate sending to server
    if (event === "message" && this.connected) {
      // Simulate echo back for demo purposes
      setTimeout(() => {
        this.trigger("message:sent", {
          ...data,
          id: Math.random().toString(36).substring(7),
          timestamp: new Date(),
        });
      }, 500);
    }
    
    return this;
  }

  private trigger(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => {
        callback(data);
      });
    }
  }

  isConnected() {
    return this.connected;
  }
}

// Export a singleton instance
export const socketService = new SocketService();