import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

import BasePathImage from "../components/BasePathImage";
import WebMCPDashboard from "../components/WebMCPDashboard";
import { McpStatus } from "../components/McpStatus";
import { UserMenu } from "../components/UserMenu";

export default async function ChatPage() {
  const session = await auth();

  // If not logged in, redirect to home page
  if (!session?.user) {
    console.log("User is not logged in!");
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="w-full bg-white dark:bg-gray-800 shadow-sm py-3 px-6">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link className="flex items-center" href="/">
            <BasePathImage
              priority
              alt="Civic logo"
              className="dark:invert"
              height={30}
              src="civic-logo-dark.svg"
              width={140}
            />
          </Link>
          <div className="flex items-center gap-4">
            <McpStatus />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
        <WebMCPDashboard />
      </main>
    </div>
  );
}
