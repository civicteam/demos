import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "./components/GoogleSignInButton";

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect("/chat");
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <main className="flex flex-col items-center gap-8">
        <h1 className="text-2xl font-bold">Google Auth Demo</h1>
        <p>Sign in with your Google account</p>
        <GoogleSignInButton />
      </main>
    </div>
  );
}
