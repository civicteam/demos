import { LoginForm } from "./components/LoginForm";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <main className="flex flex-col items-center gap-8">
        <h1 className="text-2xl font-bold">Better Auth Demo</h1>
        <p>Sign in or create an account</p>
        <LoginForm />
      </main>
    </div>
  );
}
