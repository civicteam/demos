import type { JSONRPCMessage, JSONRPCResponse, MCPTransport } from "@ai-sdk/mcp";

export class PingAwareTransportWrapper implements MCPTransport {
  private originalTransport: MCPTransport;

  onmessage?: (message: JSONRPCMessage | JSONRPCResponse) => void;
  onclose?: () => void;
  onerror?: (error: Error) => void;

  constructor(originalTransport: MCPTransport) {
    this.originalTransport = originalTransport;

    // Proxy the original transport's handlers
    this.originalTransport.onclose = () => this.onclose?.();
    this.originalTransport.onerror = (error) => this.onerror?.(error);
    this.originalTransport.onmessage = (message) => {
      // Handle ping messages first
      if ("method" in message && message.method === "ping") {
        this.handlePing(message);
        return;
      }

      // Pass all other messages to MCPClient's handler
      this.onmessage?.(message);
    };
  }

  private handlePing(message: JSONRPCMessage): void {
    if ("id" in message) {
      const response: JSONRPCResponse = {
        jsonrpc: "2.0",
        id: message.id,
        result: {},
      };
      this.originalTransport.send(response).catch((error) => {
        this.onerror?.(error);
      });
    }
    // If no ID is present (notification ping), we don't need to respond
  }

  async start(): Promise<void> {
    return this.originalTransport.start();
  }

  async send(message: JSONRPCMessage | JSONRPCResponse): Promise<void> {
    return this.originalTransport.send(message);
  }

  async close(): Promise<void> {
    return this.originalTransport.close();
  }
}
