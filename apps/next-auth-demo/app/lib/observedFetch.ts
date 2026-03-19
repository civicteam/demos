import * as fs from "node:fs";
import path from "node:path";

import { debugAPI, debugTrace } from "./debug";

// Counter for request numbering
let requestCounter = 0;

// Threshold for long tool results that should be marked as ephemeral
const TOOL_RESULT_LENGTH_THRESHOLD = 1000;

/**
 * Applies provider-specific adaptations to the request body
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const applyProviderSpecificAdaptations = (requestBody: any): void => {
  // Check if the model is an Anthropic model (Claude)
  if (requestBody.model && /claude/i.test(requestBody.model)) {
    applyAnthropicAdaptations(requestBody);
  }
};

/**
 * Applies Anthropic-specific adaptations to the request body
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const applyAnthropicAdaptations = (requestBody: any): void => {
  // Check if the request has a tools section
  if (requestBody.tools && Array.isArray(requestBody.tools) && requestBody.tools.length > 0) {
    // Get the last element of the tools array
    const lastToolIndex = requestBody.tools.length - 1;

    // Add cache_control: { type: "ephemeral" } to the last tool
    requestBody.tools[lastToolIndex] = {
      ...requestBody.tools[lastToolIndex],
      cache_control: { type: "ephemeral" },
    };

    debugAPI("Applied Anthropic adaptation: Added cache_control: ephemeral to the last tool");
  }

  // Process messages - add cache_control to only one tool_result in the most recent message
  if (requestBody.messages && Array.isArray(requestBody.messages)) {
    // Find the most recent message that has content array
    for (let i = requestBody.messages.length - 1; i >= 0; i--) {
      const message = requestBody.messages[i];

      if (message.content && Array.isArray(message.content)) {
        // Look for the most recent tool_result item that needs cache_control
        for (let j = message.content.length - 1; j >= 0; j--) {
          const contentItem = message.content[j];

          if (
            contentItem.type === "tool_result" &&
            contentItem.content &&
            typeof contentItem.content === "string" &&
            contentItem.content.length > TOOL_RESULT_LENGTH_THRESHOLD
          ) {
            // Add cache_control: { type: "ephemeral" } to the long tool_result
            contentItem.cache_control = { type: "ephemeral" };
            debugAPI(
              "Applied Anthropic adaptation: Added cache_control: ephemeral to a long tool_result",
            );

            // Only add to one tool_result to avoid exceeding the limit
            return;
          }
        }
      }
    }
  }
};

const writeRequestToFile = (requestBodyStr: string): void => {
  // Increment request counter
  const requestNumber = ++requestCounter;

  // Save request to file
  const requestsDir = path.join(process.cwd(), "./requests");
  const filePath = path.join(requestsDir, `request${requestNumber}.json`);

  try {
    fs.writeFileSync(filePath, requestBodyStr);
  } catch (error) {
    debugTrace("Error writing request to file:", error);
  }
};

/**
 * A wrapper around fetch that logs request bodies, saves them to files,
 * and applies provider-specific adaptations
 */
export const observedFetch: typeof fetch = async (input, init) => {
  if (init?.body) {
    const requestBody = JSON.parse(init.body.toString());

    // Apply provider-specific adaptations
    applyProviderSpecificAdaptations(requestBody);

    // Convert back to string for logging and saving
    const requestBodyStr = JSON.stringify(requestBody, null, 2);
    debugTrace("Request body:", requestBodyStr);

    // Update the request body in init
    init.body = JSON.stringify(requestBody);

    if (process.env.SAVE_REQUESTS) {
      writeRequestToFile(requestBodyStr);
    }
  }

  return fetch(input, init);
};
