"use client";

import { useWebMCP } from "../hooks/useWebMCP";

export default function WebMCPDashboard() {
  const { isRegistered, isLoading, error, toolCount, tools, refresh } = useWebMCP();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Status Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            WebMCP Tools
          </h2>
          <button
            onClick={refresh}
            disabled={isLoading}
            className="px-3 py-1.5 text-sm rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 mb-4">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isLoading
                ? "bg-gray-400 animate-pulse"
                : isRegistered
                  ? "bg-green-500"
                  : "bg-red-500"
            }`}
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {isLoading
              ? "Connecting to Nexus Hub..."
              : isRegistered
                ? `Registered ${toolCount} tool${toolCount !== 1 ? "s" : ""} with navigator.modelContext`
                : "Not connected"}
          </span>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}
      </div>

      {/* Tool List */}
      {tools.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Registered Tools
          </h3>
          <ul className="space-y-3">
            {tools.map((tool) => (
              <li
                key={tool.name}
                className="flex flex-col gap-1 p-3 rounded-md bg-gray-50 dark:bg-gray-750 border border-gray-100 dark:border-gray-700"
              >
                <span className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100">
                  {tool.name}
                </span>
                {tool.description && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {tool.description}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
