"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

type PythonToolsResponse = {
  tools: unknown;
};

type PythonToolCallResponse = {
  result: unknown;
};

function normalizeToolNames(toolsPayload: unknown): string[] {
  if (!toolsPayload) return [];

  if (Array.isArray(toolsPayload)) {
    // Expect objects like { name: "..." } but be tolerant.
    return toolsPayload
      .map((t) => {
        if (t && typeof t === "object") {
          const maybe = t as { name?: unknown; originalName?: unknown };
          const name = maybe.name ?? maybe.originalName;
          return typeof name === "string" && name.length > 0 ? name : null;
        }
        return null;
      })
      .filter((x): x is string => x !== null);
  }

  if (typeof toolsPayload === "object") {
    const payloadObj = toolsPayload as Record<string, unknown>;
    // Some clients might wrap tools inside another property.
    if (payloadObj.tools) {
      return normalizeToolNames(payloadObj.tools);
    }
    // Many MCP clients return a map keyed by tool name.
    return Object.keys(payloadObj);
  }

  return [];
}

export default function PythonBackendPage() {
  const [tools, setTools] = useState<string[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>("");
  const [argsText, setArgsText] = useState<string>("{}");

  const [health, setHealth] = useState<{ ok: boolean } | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toolResult, setToolResult] = useState<PythonToolCallResponse | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        setHealth(null);
        setHealthError(null);

        const res = await fetch("/api/python-backend/health", { cache: "no-store" });
        const data = (await res.json().catch(async () => ({ ok: false }))) as { ok?: boolean };

        if (!res.ok) {
          setHealthError(`Health failed (${res.status}): ${JSON.stringify(data)}`);
          return;
        }

        setHealth({ ok: data.ok !== false });
      } catch (e) {
        setHealthError(e instanceof Error ? e.message : "Unknown error");
      }
    };

    checkHealth();
  }, []);

  useEffect(() => {
    const loadTools = async () => {
      setLoading(true);
      setError(null);
      setToolResult(null);

      try {
        const res = await fetch("/api/python-backend/tools", { cache: "no-store" });
        const data = (await res.json().catch(async () => ({ raw: await res.text() }))) as PythonToolsResponse;

        if (!res.ok) {
          setError(`Failed to load tools (${res.status}): ${JSON.stringify(data)}`);
          setTools([]);
          return;
        }

        const toolNames = normalizeToolNames(data.tools);
        setTools(toolNames);
        setSelectedTool(toolNames[0] ?? "");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    loadTools();
  }, []);

  const canCall = useMemo(() => selectedTool.trim().length > 0 && !loading, [selectedTool, loading]);

  const onCall = async () => {
    setError(null);
    setToolResult(null);

    let parsedArgs: Record<string, unknown>;
    try {
      parsedArgs = JSON.parse(argsText) as Record<string, unknown>;
      if (!parsedArgs || typeof parsedArgs !== "object" || Array.isArray(parsedArgs)) {
        setError("args must be a JSON object, e.g. {\"foo\": \"bar\"}");
        return;
      }
    } catch {
      setError("Invalid JSON in args");
      return;
    }

    const res = await fetch("/api/python-backend/tools/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolName: selectedTool, args: parsedArgs }),
    });

    const data = (await res.json().catch(async () => ({ raw: await res.text() }))) as PythonToolCallResponse;

    if (!res.ok) {
      setError(`Tool call failed (${res.status}): ${JSON.stringify(data)}`);
      return;
    }

    setToolResult(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="w-full bg-white dark:bg-gray-800 shadow-sm py-3 px-6">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <h2 className="text-lg font-semibold">Python Backend Demo</h2>
          <div className="text-sm text-gray-600 dark:text-gray-300">Civic MCP tools via Python</div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
        <div className="mb-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Quick Start</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                This page demonstrates <code>civic-mcp-client</code> running in Python. Next.js forwards your
                Civic access token to the FastAPI backend.
              </p>

              <div className="flex items-center gap-3">
                {health === null && !healthError && (
                  <span className="text-sm text-gray-500">Checking backend...</span>
                )}
                {health !== null && health.ok && (
                  <span className="text-sm px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Backend reachable
                  </span>
                )}
                {healthError && (
                  <span className="text-sm px-2 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    Backend error
                  </span>
                )}
                {healthError && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 break-words">{healthError}</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>1. List Tools (via Python)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <p className="text-sm text-gray-600 dark:text-gray-300">Loading tools...</p>
              ) : error ? (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              ) : tools.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-300">No tools returned.</p>
              ) : (
                <>
                  <Select value={selectedTool} onValueChange={setSelectedTool}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a tool" />
                    </SelectTrigger>
                    <SelectContent>
                      {tools.map((tool) => (
                        <SelectItem key={tool} value={tool}>
                          {tool}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Tool count: {tools.length}
                  </p>
                  {tools.length > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      First tools: {tools.slice(0, 8).join(", ")}
                      {tools.length > 8 ? "..." : ""}
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Call Tool (via Python)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Args (JSON)</label>
                <Input
                  className="h-10"
                  value={argsText}
                  onChange={(e) => setArgsText(e.target.value)}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Example: <code>{"{\"limit\": 1}"}</code>
                </p>
              </div>

              <Button disabled={!canCall} onClick={onCall} className="w-full">
                Call tool
              </Button>

              {toolResult && (
                <div className="space-y-1">
                  <div className="text-sm font-medium">Result</div>
                  <pre className="text-xs whitespace-pre-wrap break-words bg-gray-100 dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-800">
                    {JSON.stringify(toolResult, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

