// Base namespace for all debug logs
const BASE_NAMESPACE = "whitelabel-web-app";

/**
 * Logger interface with multiple log levels
 */
export interface Logger {
  debug: (message: unknown, ...args: unknown[]) => void;
  info: (message: unknown, ...args: unknown[]) => void;
  warn: (message?: unknown, ...args: unknown[]) => void;
  error: (message?: unknown, ...args: unknown[]) => void;
}

/**
 * Creates a namespaced logger with multiple log levels using console
 */
export const createLogger = (namespace: string): Logger => {
  const fullNamespace = `${BASE_NAMESPACE}:${namespace}`;

  return {
    debug: (message: unknown, ...args: unknown[]) => {
      console.debug(`[${fullNamespace}]`, message, ...args);
    },
    info: (message: unknown, ...args: unknown[]) => {
      console.info(`[${fullNamespace}]`, message, ...args);
    },
    warn: (message?: unknown, ...args: unknown[]) => {
      console.warn(`[${fullNamespace}]`, message, ...args);
    },
    error: (message?: unknown, ...args: unknown[]) => {
      console.error(`[${fullNamespace}]`, message, ...args);
    },
  };
};

/**
 * Gets a default logger instance
 */
export const getLogger = (): Logger => createLogger("default");

// Convenience export for debug level (backward compatibility)
export const createDebug = (namespace: string) => createLogger(namespace).debug;

// Specific loggers for different app components
export const loggerAPI = createLogger("web:api");
export const loggerChat = createLogger("web:chat");
export const loggerAI = createLogger("web:ai");
export const loggerTools = createLogger("tools");
export const loggerAuth = createLogger("auth");
export const loggerTrace = createLogger("provider:trace");

// Convenience debug exports
export const debugAPI = loggerAPI.debug;
export const debugChat = loggerChat.debug;
export const debugAI = loggerAI.debug;
export const debugTools = loggerTools.debug;
export const debugAuth = loggerAuth.debug;
export const debugTrace = loggerTrace.debug;

// Export the logger factory as default
export default createLogger;
