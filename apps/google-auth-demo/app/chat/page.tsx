import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Chatbot from "../components/Chatbot";
import { SignOutButton } from "../components/SignOutButton";

export default async function ChatPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="w-full bg-white dark:bg-gray-800 shadow-sm py-3 px-6">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <h2 className="text-lg font-semibold">Google Auth Demo</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
        <Chatbot />
      </main>
    </div>
  );
}
