import { NextResponse } from "next/server";
import { importJWK, exportSPKI } from "jose";
import { auth } from "@/lib/auth/server";

/**
 * Exports the public key from Better Auth's JWKS in PEM format.
 * Use this to copy the public key into Civic's Integration settings
 * when running locally (since Civic can't reach localhost JWKS).
 *
 * GET /api/keys/public
 */
export async function GET() {
  try {
    const jwks = await auth.api.getJwks();

    const pemKeys: string[] = [];
    for (const key of jwks.keys) {
      try {
        const cryptoKey = await importJWK(key, key.alg || "RS256");
        const pem = await exportSPKI(cryptoKey as CryptoKey);
        pemKeys.push(pem);
      } catch {
        // Skip keys that can't be converted
      }
    }

    if (pemKeys.length === 0) {
      return NextResponse.json(
        { error: "No public keys found. Start the app and make at least one request first." },
        { status: 404 },
      );
    }

    return new Response(pemKeys[0], {
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to export public key: ${error}` },
      { status: 500 },
    );
  }
}
