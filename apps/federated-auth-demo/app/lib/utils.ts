import type { ModelMessage } from "ai";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as jose from "jose";

const publicKeyString =
  process.env.TOKEN_ENCRYPTION_PUBLIC_KEY ||
  "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsu+oMpl/yT5oiqLMvfuQ\ne43S8S0eu59Qbax4M7DfWjimw3gVmK5KcR7TB4v4vlZsvF91vCT6ArYs8Ke9gGsB\nDNgVS20WE6GB5biEUIiYDKlremBGlYxzHoVIrOvTH7WS8KpogpNJpqFV735aTVoy\nHOetl4Ap6tXkznLeBllirMpntJS3vVUW/+L5YGiY7aSuRwfoXphLItfamWos3/Ff\nz33FjrQY6bb6g+vdTtq8JLkiOXKynEcaGYXGibnkDc5C+jKx2JS63TOpp1LbvEmh\njEXpaee94YTs99H3LdqsporedAwEXKFrmX76eXrlIYei+ZUubrCToFkCXRzjwGMU\n9wIDAQAB\n-----END PUBLIC KEY-----\n";

/**
 * Utility function for merging Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isToolMessage = (message: ModelMessage): boolean => message.role === "tool";
export const isUserMessage = (message: ModelMessage): boolean => message.role === "user";

/**
 * It seems that a user message can still contain a tool result (contrary to the API). This checks if that is the case.
 * @param message
 */
export const messageHasToolResult = (message: ModelMessage) => {
  if (isToolMessage(message) || isUserMessage(message)) {
    if (Array.isArray(message.content)) {
      return message.content.some((message) => message.type === "tool-result");
    }
  }

  return false;
};

/**
 * Encrypts a token using JOSE JWE format (which handles hybrid encryption internally)
 * This handles tokens of any size by using RSA to encrypt a symmetric key
 * and using that symmetric key to encrypt the actual token.
 *
 * @param token The token to encrypt
 * @returns Compact JWE format encrypted token
 */
export async function encryptToken(token: string): Promise<string> {
  try {
    // Format key correctly (replace \n with actual newlines)
    const formattedKey = publicKeyString.replace(/\\n/g, "\n");

    // Import the public key
    const publicKey = await jose.importSPKI(formattedKey, "RSA-OAEP-256");

    // Encode the token as Uint8Array (required by JOSE)
    const tokenBytes = new TextEncoder().encode(token);

    // Encrypt using JOSE's JWE format, which handles the hybrid encryption process
    const jwe = await new jose.CompactEncrypt(tokenBytes)
      .setProtectedHeader({
        alg: "RSA-OAEP-256", // Key encryption algorithm
        enc: "A256GCM", // Content encryption algorithm
      })
      .encrypt(publicKey);

    return jwe;
  } catch (error) {
    console.error("Error encrypting token:", error);
    throw new Error("Failed to encrypt token");
  }
}
