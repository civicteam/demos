import { auth } from "@/auth";
import { redirect } from "next/navigation";

import { LoginForm } from "./components/LoginForm";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect("/chat");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <main className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Next Auth Demo (Intercept)</h1>
          <p className="text-gray-500">Sign in with email and password</p>
        </div>
        <LoginForm />
      </main>
    </div>
  );
}
