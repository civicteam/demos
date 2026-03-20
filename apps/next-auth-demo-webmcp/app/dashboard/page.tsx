import { auth } from "@/auth";
import { redirect } from "next/navigation";

import { McpStatus } from "../components/McpStatus";
import { UserMenu } from "../components/UserMenu";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="w-full bg-white dark:bg-gray-800 shadow-sm py-3 px-6">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <h1 className="text-lg font-semibold">Next Auth WebMCP Demo</h1>
          <div className="flex items-center gap-4">
            <McpStatus />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            WebMCP Enabled
          </div>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            This app provides federated authentication and token exchange for WebMCP.
            Use a WebMCP-compatible chat client to interact with MCP tools.
          </p>
        </div>
      </main>
    </div>
  );
}
