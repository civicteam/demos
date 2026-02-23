"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { NexusClient, type CallToolResult } from "@civic/nexus-client";
import { anthropicAdapter } from "@civic/nexus-client/adapters/anthropic";

declare global {
  interface Navigator {
    modelContext?: {
      registerTool: (tool: WebMCPTool) => void;
      unregisterTool: (name: string) => void;
    };
  }
}

interface WebMCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<CallToolResult>;
}

interface TokenResponse {
  accessToken: string;
  mcpUrl: string;
  expiresAt: string;
}

export interface WebMCPState {
  isRegistered: boolean;
  isLoading: boolean;
  error: string | null;
  toolCount: number;
  tools: Array<{ name: string; description: string }>;
  refresh: () => Promise<void>;
}

export function useWebMCP(): WebMCPState {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tools, setTools] = useState<Array<{ name: string; description: string }>>([]);
  const nexusRef = useRef<NexusClient | null>(null);
  const registeredToolNamesRef = useRef<string[]>([]);

  const cleanup = useCallback(async () => {
    const modelContext = navigator.modelContext;
    if (modelContext) {
      for (const name of registeredToolNamesRef.current) {
        modelContext.unregisterTool(name);
      }
    }
    registeredToolNamesRef.current = [];
    setIsRegistered(false);
    setTools([]);

    if (nexusRef.current) {
      await nexusRef.current.close();
      nexusRef.current = null;
    }
  }, []);

  const initialize = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await cleanup();

      // 1. Fetch access token from server (token exchange requires client secret)
      const response = await fetch("/api/auth/token");
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Token fetch failed: ${response.status}`);
      }
      const { accessToken, mcpUrl } = (await response.json()) as TokenResponse;

      if (!mcpUrl) {
        throw new Error("MCP server URL not configured");
      }

      console.log("[WebMCP] Connecting to", mcpUrl);

      // 2. Create NexusClient pointing directly at Nexus Hub
      const nexus = new NexusClient({
        url: mcpUrl,
        auth: { token: accessToken },
        headers: {
          "x-civic-profile": "default",
        },
      });
      nexusRef.current = nexus;

      // 3. Bootstrap MCP connection + get tools (adapter creates the transport)
      const mcpTools = await nexus.getTools(anthropicAdapter());

      console.log("[WebMCP] Got tools:", mcpTools.length, mcpTools.map((t: { name: string }) => t.name));

      // 4. Register with WebMCP if available
      const modelContext = navigator.modelContext;
      if (!modelContext) {
        console.warn("[WebMCP] navigator.modelContext not available — tools fetched but not registered with browser");
      }

      const toolSummaries: Array<{ name: string; description: string }> = [];
      const registeredNames: string[] = [];

      for (const tool of mcpTools) {
        const webmcpTool: WebMCPTool = {
          name: tool.name,
          description: tool.description ?? "",
          inputSchema: tool.input_schema as Record<string, unknown>,
          execute: async (args: Record<string, unknown>) => {
            console.log("[WebMCP] callTool", tool.name, args);
            return nexus.callTool(tool.name, args);
          },
        };

        if (modelContext) {
          modelContext.registerTool(webmcpTool);
          registeredNames.push(tool.name);
        }

        toolSummaries.push({
          name: tool.name,
          description: tool.description ?? "",
        });
      }

      registeredToolNamesRef.current = registeredNames;
      setTools(toolSummaries);
      setIsRegistered(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[WebMCP] Error:", message, err);
      setError(message);
      setIsRegistered(false);
    } finally {
      setIsLoading(false);
    }
  }, [cleanup]);

  useEffect(() => {
    initialize();
    return () => {
      cleanup();
    };
  }, [initialize, cleanup]);

  return {
    isRegistered,
    isLoading,
    error,
    toolCount: tools.length,
    tools,
    refresh: initialize,
  };
}
