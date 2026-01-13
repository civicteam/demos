/**
 * Utility functions for formatting MCP tool names into human-readable format.
 */

/**
 * Custom label overrides for specific tool names.
 * Maps tool names (with or without 'tool-' prefix) to their desired display labels.
 * Add new entries here to override the automatic formatting.
 *
 * @example
 * "manage-server": "Manage tool"
 * "civic-manager-manage-server": "Manage tool"
 */
export const TOOL_LABEL_OVERRIDES: Record<string, string> = {
  // NEXUS-513 - we want the user to be presented with 'tools' instead of 'servers'.
  "manage-server": "Manage tool",
  "civic-manager-manage-server": "Manage tool",
};

/**
 * Split camelCase strings into separate words.
 * @example splitCamelCase("updateUserProfile") -> "update User Profile"
 */
export function splitCamelCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/([A-Z])([A-Z][a-z])/g, "$1 $2");
}

/**
 * Remove duplicate server name from the beginning of tool name.
 * @example removeDuplicateServerPrefix("Hubspot", "Hubspot create contact") -> "Create contact"
 * @example removeDuplicateServerPrefix("n8n Basic", "n8n create workflow") -> "Create workflow"
 */
export function removeDuplicateServerPrefix(
  formattedServer: string,
  formattedTool: string,
): string {
  const serverNameLower = formattedServer.toLowerCase();
  const toolNameLower = formattedTool.toLowerCase();

  // Check if tool starts with full server name
  if (toolNameLower.startsWith(serverNameLower + " ")) {
    const result = formattedTool.substring(formattedServer.length + 1);
    // Guard against empty result after prefix removal
    if (!result || result.trim().length === 0) {
      return formattedTool;
    }
    return result.charAt(0).toUpperCase() + result.slice(1);
  }

  // Check if tool starts with first word of server name (e.g., "n8n" from "n8n Basic")
  const firstWord = formattedServer.split(" ")[0];
  if (firstWord && toolNameLower.startsWith(firstWord.toLowerCase() + " ")) {
    const result = formattedTool.substring(firstWord.length + 1);
    // Guard against empty result after prefix removal
    if (!result || result.trim().length === 0) {
      return formattedTool;
    }
    return result.charAt(0).toUpperCase() + result.slice(1);
  }

  return formattedTool;
}

/**
 * Apply brand-specific formatting rules to server names.
 */
function applyBrandingRules(formatted: string): string {
  // Civic services -> "Civic Nexus"
  if (formatted.toLowerCase().startsWith("civic")) {
    return "Civic Nexus";
  }

  // n8n -> keep lowercase with capitalized following words
  if (formatted.toLowerCase().startsWith("n8n")) {
    const parts = formatted.split(" ");
    if (parts[0]?.toLowerCase() === "n8n") {
      parts[0] = "n8n";
      return parts
        .map((part, i) =>
          i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
        )
        .join(" ");
    }
  }

  // ServiceTitan -> keep both capital letters
  if (formatted.toLowerCase() === "servicetitan") {
    return "ServiceTitan";
  }

  // Microsoft 365 services
  if (formatted.startsWith("Ms365 ")) {
    const ms365Base = formatted.replace("Ms365 ", "Microsoft 365 ");
    const specialCases: Record<string, string> = {
      Onedrive: "OneDrive",
      Onenote: "OneNote",
      Todo: "To Do",
    };
    for (const [oldCase, newCase] of Object.entries(specialCases)) {
      if (ms365Base.includes(` ${oldCase}`)) {
        return ms365Base.replace(` ${oldCase}`, ` ${newCase}`);
      }
    }
    return ms365Base;
  }

  return formatted;
}

/**
 * Format server names with proper capitalization and branding.
 * @example formatServerName("civic-manager") -> "Civic Nexus"
 */
export function formatServerName(name: string): string {
  const formatted = name
    .replace(/[-_]/g, " ")
    .split(" ")
    .map((word) => {
      // Handle words with parentheses - e.g. "(Alternative)" should become "(Alternative)"
      if (word.startsWith("(") && word.length > 1) {
        return "(" + word.charAt(1).toUpperCase() + word.slice(2).toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");

  return applyBrandingRules(formatted);
}

/**
 * Format tool part in sentence case (first letter capitalized, rest lowercase).
 */
export function formatToolPart(toolPart: string): string {
  let formatted = splitCamelCase(toolPart)
    .replace(/[-_]/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());

  // Handle n8n - keep it lowercase
  if (formatted.toLowerCase().startsWith("n8n ")) {
    formatted = "n8n" + formatted.substring(3);
  }

  return formatted;
}

/**
 * Extract server and tool parts from a tool name with known brand prefixes.
 * Returns null if no brand prefix match is found.
 */
export function extractBrandedServerAndTool(
  cleanName: string,
): { serverPrefix: string; toolPart: string } | null {
  const brandPrefixes = ["civic", "google", "ms365", "microsoft365"] as const;

  for (const brand of brandPrefixes) {
    const match = cleanName.match(new RegExp(`^(${brand}[-_][^-_]+)[-_](.+)$`));
    if (match) {
      const [, prefix, tool] = match;
      if (prefix && tool) {
        return { serverPrefix: prefix, toolPart: tool };
      }
    }
  }

  return null;
}

/**
 * Extract server and tool parts from a tool name with single-part server prefix.
 * Skips common verbs to avoid false positives.
 * Returns null if no valid server prefix is found.
 */
export function extractSinglePartServerAndTool(
  cleanName: string,
): { serverPrefix: string; toolPart: string } | null {
  const commonVerbs = [
    "get",
    "list",
    "create",
    "update",
    "delete",
    "add",
    "remove",
    "set",
    "fetch",
    "search",
    "find",
    "query",
    "run",
    "execute",
    "send",
    "post",
    "put",
    "patch",
    "upload",
    "download",
    "move",
    "copy",
  ];

  const match = cleanName.match(/^([^_-]+)[-_](.+)$/);
  if (match) {
    const [, potentialPrefix, potentialTool] = match;
    if (potentialPrefix && potentialTool) {
      const potentialServer = potentialPrefix.toLowerCase();
      if (!commonVerbs.includes(potentialServer)) {
        return { serverPrefix: potentialPrefix, toolPart: potentialTool };
      }
    }
  }

  return null;
}

/**
 * Check if a tool name is an internal Civic tool that should be branded as Civic Nexus.
 */
export function isInternalCivicTool(cleanName: string): boolean {
  const internalCivicTools = ["continue_job", "continue-job"];
  return internalCivicTools.includes(cleanName);
}

/**
 * Format a tool name without a detected server prefix (standalone tool).
 */
export function formatStandaloneTool(cleanName: string): string {
  return splitCamelCase(cleanName)
    .replace(/[-_]/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Convert an MCP tool name into a Human Readable Format (HRF) with server prefix.
 *
 * @param rawName - The tool name to format
 * @param serverName - Optional server name to use as the prefix
 *
 * @example
 * formatToolName("google-workspace_users-list") -> "Google Workspace: Users list"
 * formatToolName("updateConfluencePage", "Atlassian") -> "Atlassian: Update confluence page"
 * formatToolName("civic-manager_sync") -> "Civic Nexus: Sync"
 * formatToolName("civic-account_foo") -> "Civic Nexus: Foo"
 */
export function formatToolName(rawName: string, serverName?: string): string {
  if (!rawName) return rawName;

  // Check for custom label overrides first
  if (TOOL_LABEL_OVERRIDES[rawName]) {
    return TOOL_LABEL_OVERRIDES[rawName];
  }

  // Remove common "tool-" prefix
  const cleanName = rawName.replace(/^tool-/, "");

  // Check for custom label overrides on the clean name
  if (TOOL_LABEL_OVERRIDES[cleanName]) {
    return TOOL_LABEL_OVERRIDES[cleanName];
  }

  // If server name is explicitly provided, use it
  if (serverName) {
    const formattedServer = formatServerName(serverName);
    let formattedTool = formatToolPart(cleanName);
    formattedTool = removeDuplicateServerPrefix(formattedServer, formattedTool);
    return `${formattedServer}: ${formattedTool}`;
  }

  // Internal Civic tools (hub tools) should be branded as Civic Nexus
  if (isInternalCivicTool(cleanName)) {
    const formattedTool = formatToolPart(cleanName);
    return `Civic Nexus: ${formattedTool}`;
  }

  // Try to extract branded server (google-*, civic-*, ms365-*, etc.)
  const branded = extractBrandedServerAndTool(cleanName);
  if (branded) {
    const formattedServer = formatServerName(branded.serverPrefix);
    let formattedTool = formatToolPart(branded.toolPart);
    formattedTool = removeDuplicateServerPrefix(formattedServer, formattedTool);
    return `${formattedServer}: ${formattedTool}`;
  }

  // Try to extract single-part server name
  const singlePart = extractSinglePartServerAndTool(cleanName);
  if (singlePart) {
    const formattedServer = formatServerName(singlePart.serverPrefix);
    let formattedTool = formatToolPart(singlePart.toolPart);
    formattedTool = removeDuplicateServerPrefix(formattedServer, formattedTool);
    return `${formattedServer}: ${formattedTool}`;
  }

  // No server prefix found, format as standalone tool
  return formatStandaloneTool(cleanName);
}
