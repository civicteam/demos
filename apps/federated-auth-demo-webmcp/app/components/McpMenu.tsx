"use client";

import { useState, useRef, useEffect } from "react";
import { useWebMCP } from "../hooks/useWebMCP";

export function McpMenu() {
  const { isRegistered, isLoading, error, tools } = useWebMCP();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const statusColor = isLoading
    ? "bg-gray-400 animate-pulse"
    : isRegistered
      ? "bg-emerald-400"
      : "bg-red-400";

  const statusLabel = isLoading
    ? "Connecting..."
    : isRegistered
      ? "Connected"
      : "Not connected";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
      >
        <span className={`w-2 h-2 rounded-full ${statusColor}`} />
        MCP
        <svg
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-white/15 bg-gray-900 shadow-xl shadow-black/40 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${statusColor}`} />
              <span className="text-sm text-white">{statusLabel}</span>
            </div>
            {error && (
              <p className="text-xs text-red-400 mt-1 truncate" title={error}>
                {error}
              </p>
            )}
          </div>

          {isRegistered && tools.length > 0 && (
            <div className="px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400 mb-2">
                Tools ({tools.length})
              </p>
              <ul className="space-y-1">
                {tools.map((tool) => (
                  <li
                    key={tool.name}
                    className="text-sm font-mono text-gray-300"
                  >
                    {tool.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
