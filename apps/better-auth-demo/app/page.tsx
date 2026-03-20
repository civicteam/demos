import { getBetterAuthSession } from "@/lib/ai/mcp";
import { redirect } from "next/navigation";

import { LoginForm } from "./components/LoginForm";

export default async function Home() {
  const session = await getBetterAuthSession();

  if (session?.user) {
    redirect("/chat");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <main className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Better Auth Demo</h1>
          <p className="text-gray-500">Sign in or create an account</p>
        </div>
        <LoginForm />
      </main>
    </div>
  );
}
