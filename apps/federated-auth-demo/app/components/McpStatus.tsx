"use client";

import { useEffect, useState } from "react";
import type { McpStatusResponse } from "../api/mcp/status/route";

type StatusState = "loading" | "connected" | "partial" | "disconnected";

export function McpStatus() {
  const [status, setStatus] = useState<McpStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/mcp/status");
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        console.error("Failed to fetch MCP status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  const getStatusState = (): StatusState => {
    if (loading) return "loading";
    if (!status) return "disconnected";
    if (status.mcp.connected && status.tokenExchange.status === "success") {
      return "connected";
    }
    if (status.authenticated && status.tokenExchange.status === "failed") {
      return "partial";
    }
    return "disconnected";
  };

  const getStatusColor = (state: StatusState) => {
    switch (state) {
      case "loading":
        return "bg-gray-400";
      case "connected":
        return "bg-green-500";
      case "partial":
        return "bg-yellow-500";
      case "disconnected":
        return "bg-red-500";
    }
  };

  const getStatusText = (state: StatusState) => {
    switch (state) {
      case "loading":
        return "Checking...";
      case "connected":
        return "MCP connected";
      case "partial":
        return "MCP unavailable";
      case "disconnected":
        return "Not connected";
    }
  };

  const state = getStatusState();

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
      >
        <span className={`w-2 h-2 rounded-full ${getStatusColor(state)} ${state === "loading" ? "animate-pulse" : ""}`} />
        <span className="text-gray-700 dark:text-gray-300">{getStatusText(state)}</span>
        <svg
          className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && status && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50">
          <h4 className="font-medium text-sm mb-3 text-gray-900 dark:text-gray-100">Connection status</h4>

          <div className="space-y-3">
            {/* Authentication */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Authentication</span>
              <StatusBadge success={status.authenticated} />
            </div>

            {/* Token Exchange */}
            <div className="flex items-start justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Token exchange</span>
              <div className="text-right">
                <StatusBadge
                  success={status.tokenExchange.status === "success"}
                  pending={status.tokenExchange.status === "pending"}
                />
                {status.tokenExchange.error && (
                  <p className="text-xs text-red-500 mt-1 max-w-[160px] truncate" title={status.tokenExchange.error}>
                    {status.tokenExchange.error.includes("invalid_grant")
                      ? "Civic Auth not configured"
                      : status.tokenExchange.error}
                  </p>
                )}
              </div>
            </div>

            {/* MCP Connection */}
            <div className="flex items-start justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">MCP Hub</span>
              <div className="text-right">
                <StatusBadge success={status.mcp.connected} />
                {status.mcp.toolCount !== undefined && (
                  <p className="text-xs text-gray-500 mt-1">{status.mcp.toolCount} tools</p>
                )}
                {status.mcp.error && (
                  <p className="text-xs text-red-500 mt-1 max-w-[160px] truncate" title={status.mcp.error}>
                    {status.mcp.error}
                  </p>
                )}
              </div>
            </div>
          </div>

          {state === "partial" && (
            <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              Chat works but MCP tools are unavailable. Configure federated auth in Civic dashboard.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ success, pending }: { success: boolean; pending?: boolean }) {
  if (pending) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
        Pending
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        success
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      }`}
    >
      {success ? "OK" : "Failed"}
    </span>
  );
}
