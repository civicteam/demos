import { basePath } from "../next.config";

/**
 * Utility function to add the basePath to URL paths
 * This ensures all paths work correctly when the app is deployed with a basePath
 *
 * @param path The path to add the basePath to
 * @returns The path with basePath added
 */
export const withBasePath = (path: string): string => {
  // Ensure path starts with / but avoid double slashes
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${normalizedPath}`;
};

/**
 * Get the full URL with base URL and base path
 * @param path The path to append to the base URL
 */
export const getFullUrl = (path: string): string => {
  // Ensure path starts with / but avoid double slashes
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  return `${baseUrl}${basePath}${normalizedPath}`;
};
