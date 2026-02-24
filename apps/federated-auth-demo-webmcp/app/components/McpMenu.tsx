"use client";

import { useState, useRef, useEffect } from "react";
import { useWebMCP, type McpLogEntry } from "../hooks/useWebMCP";

export function McpMenu() {
  const { isRegistered, isLoading, error, tools, log } = useWebMCP();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const prevLogLengthRef = useRef(0);

  // Auto-open modal when a new log entry arrives or is updated
  useEffect(() => {
    if (log.length > 0 && log.length !== prevLogLengthRef.current) {
      setModalOpen(true);
    }
    prevLogLengthRef.current = log.length;
  }, [log]);

  // Also auto-open when a pending entry gets a response
  const pendingCount = log.filter((e) => !e.response && !e.error).length;
  const prevPendingRef = useRef(pendingCount);
  useEffect(() => {
    if (prevPendingRef.current > 0 && pendingCount < prevPendingRef.current) {
      setModalOpen(true);
    }
    prevPendingRef.current = pendingCount;
  }, [pendingCount]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
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
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setDropdownOpen((v) => !v)}
          className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
        >
          <span className={`w-2 h-2 rounded-full ${statusColor}`} />
          MCP
          {log.length > 0 && (
            <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-white/15 text-[10px] font-medium text-white/90 px-1">
              {log.length}
            </span>
          )}
          <svg
            className={`w-3 h-3 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {dropdownOpen && (
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
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400 mb-2">
                  Tools ({tools.length})
                </p>
                <ul className="space-y-1">
                  {tools.map((tool) => (
                    <li key={tool.name} className="text-sm font-mono text-gray-300">
                      {tool.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="px-4 py-3">
              <button
                onClick={() => {
                  setModalOpen(true);
                  setDropdownOpen(false);
                }}
                className="w-full text-left text-sm text-gray-300 hover:text-white transition-colors flex items-center justify-between"
              >
                <span>Tool call log</span>
                {log.length > 0 && (
                  <span className="text-xs text-gray-500">{log.length} call{log.length !== 1 ? "s" : ""}</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {modalOpen && <McpLogModal log={log} onClose={() => setModalOpen(false)} />}
    </>
  );
}

function McpLogModal({ log, onClose }: { log: McpLogEntry[]; onClose: () => void }) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when log updates
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="w-full max-w-2xl max-h-[80vh] mx-4 rounded-xl border border-white/15 bg-gray-950 shadow-2xl shadow-black/60 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-sm font-semibold text-white uppercase tracking-[0.15em]">
            MCP Tool Call Log
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {log.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No tool calls yet.</p>
          ) : (
            log.map((entry) => <LogEntry key={entry.id} entry={entry} />)
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}

function LogEntry({ entry }: { entry: McpLogEntry }) {
  const isPending = !entry.response && !entry.error;
  const elapsed = entry.respondedAt
    ? `${entry.respondedAt - entry.requestedAt}ms`
    : null;

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] overflow-hidden">
      {/* Request */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-sky-400">Request</span>
          <span className="text-xs font-mono font-medium text-white">{entry.toolName}</span>
          <span className="text-[10px] text-gray-500 ml-auto">
            {new Date(entry.requestedAt).toLocaleTimeString()}
          </span>
        </div>
        <pre className="text-xs text-gray-400 overflow-x-auto whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
          {JSON.stringify(entry.args, null, 2)}
        </pre>
      </div>

      {/* Response */}
      <div className="px-4 py-3">
        {isPending ? (
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-400">Response</span>
            <svg className="w-3.5 h-3.5 text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-xs text-gray-500">Waiting for response...</span>
          </div>
        ) : entry.error ? (
          <>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-red-400">Error</span>
              {elapsed && <span className="text-[10px] text-gray-500 ml-auto">{elapsed}</span>}
            </div>
            <p className="text-xs text-red-400">{entry.error}</p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400">Response</span>
              {elapsed && <span className="text-[10px] text-gray-500 ml-auto">{elapsed}</span>}
            </div>
            <pre className="text-xs text-gray-400 overflow-x-auto whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
              {JSON.stringify(entry.response, null, 2)}
            </pre>
          </>
        )}
      </div>
    </div>
  );
}
