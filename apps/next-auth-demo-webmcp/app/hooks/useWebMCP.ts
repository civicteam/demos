"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { CivicMcpClient, type CallToolResult } from "@civic/mcp-client";
import { anthropicAdapter } from "@civic/mcp-client/adapters/anthropic";

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
  const civicRef = useRef<CivicMcpClient | null>(null);
  const registeredToolNamesRef = useRef<string[]>([]);
  const initializingRef = useRef<AbortController | null>(null);

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

    if (civicRef.current) {
      await civicRef.current.close();
      civicRef.current = null;
    }
  }, []);

  const initialize = useCallback(async () => {
    if (initializingRef.current) {
      initializingRef.current.abort();
    }
    const controller = new AbortController();
    initializingRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      await cleanup();

      if (controller.signal.aborted) return;

      const response = await fetch("/api/auth/token");
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Token fetch failed: ${response.status}`);
      }
      const { accessToken, mcpUrl } = (await response.json()) as TokenResponse;

      if (!mcpUrl) {
        throw new Error("MCP server URL not configured");
      }

      const civicClient = new CivicMcpClient({
        url: mcpUrl,
        auth: { token: accessToken },
      });
      civicRef.current = civicClient;

      const mcpTools = await civicClient.getTools(anthropicAdapter());

      if (controller.signal.aborted) return;

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
            return await civicClient.callTool(tool.name, args);
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
      initializingRef.current = null;
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
      if (initializingRef.current) {
        initializingRef.current.abort();
      }
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
