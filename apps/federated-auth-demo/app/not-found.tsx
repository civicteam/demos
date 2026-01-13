import Link from "next/link";
import BasePathImage from "./components/BasePathImage";

export default function NotFound() {
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
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-blue-500 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
                <line x1="9" x2="9.01" y1="9" y2="9" />
                <line x1="15" x2="15.01" y1="9" y2="9" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Page Not Found</h1>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We couldn&apos;t find the page you&apos;re looking for. It might have been moved,
            deleted, or never existed.
          </p>

          <div className="flex flex-col space-y-3">
            <Link
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              href="/"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
