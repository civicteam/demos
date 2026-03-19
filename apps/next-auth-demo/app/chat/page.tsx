import { auth } from "@/auth";
import { redirect } from "next/navigation";

import Chatbot from "../components/Chatbot";
import { McpStatus } from "../components/McpStatus";
import { UserMenu } from "../components/UserMenu";
import { TokenProvider } from "../context/token-context";
import { encryptToken } from "../lib/utils";
import { cookies } from "next/headers";

async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionToken =
    cookieStore.get("authjs.session-token")?.value ??
    cookieStore.get("__Secure-authjs.session-token")?.value;
  return sessionToken ?? null;
}

export default async function ChatPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const sessionToken = await getSessionToken();
  if (!sessionToken) {
    redirect("/");
  }

  const encryptedToken = await encryptToken(sessionToken);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="w-full bg-white dark:bg-gray-800 shadow-sm py-3 px-6">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <h1 className="text-lg font-semibold">Next Auth Demo</h1>
          <div className="flex items-center gap-4">
            <McpStatus />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
        <TokenProvider encryptedAccessToken={encryptedToken}>
          <Chatbot />
        </TokenProvider>
      </main>
    </div>
  );
}
