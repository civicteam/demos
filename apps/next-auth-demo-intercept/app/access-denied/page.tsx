import { auth } from "@/auth";
import Link from "next/link";

import BasePathImage from "../components/BasePathImage";
import { UserMenu } from "../components/UserMenu";
import SignOutButton from "./sign-out-button";

export default async function AccessDeniedPage() {
  const session = await auth();

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
          <UserMenu />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-500 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Access denied</h1>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            This application is restricted to authorized email addresses only.
            {session?.user?.email && (
              <span className="block mt-2">
                You&apos;re currently signed in as{" "}
                <span className="font-medium">{session.user.email}</span>
              </span>
            )}
          </p>

          <div className="flex flex-col space-y-3">
            <SignOutButton />
          </div>
        </div>
      </main>
    </div>
  );
}
