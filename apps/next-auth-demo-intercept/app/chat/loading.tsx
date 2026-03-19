import Link from "next/link";
import BasePathImage from "../components/BasePathImage";

export default function Loading() {
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
          <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6">
        <div className="w-full h-[calc(100vh-160px)] bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col animate-pulse">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="h-7 w-32 bg-gray-200 dark:bg-gray-700 rounded-md" />
              <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded-md" />
            </div>
          </div>

          <div className="flex-grow p-4">
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-10 h-10 border-4 border-t-blue-500 border-gray-200 dark:border-gray-700 rounded-full animate-spin mb-4" />
              <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded-md" />
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <div className="h-10 flex-grow bg-gray-200 dark:bg-gray-700 rounded-md" />
              <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-md" />
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-md" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
