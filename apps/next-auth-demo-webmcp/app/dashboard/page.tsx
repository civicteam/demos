import { auth } from "@/auth";
import { redirect } from "next/navigation";

import { UserMenu } from "../components/UserMenu";
import WebMCPDashboard from "../components/WebMCPDashboard";

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
          <UserMenu />
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
        <WebMCPDashboard />
      </main>
    </div>
  );
}
