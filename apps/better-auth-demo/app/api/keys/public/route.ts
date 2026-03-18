import { NextResponse } from "next/server";

/**
 * Exports the public key from Better Auth's JWKS endpoint in PEM format.
 * Use this to copy the public key into Civic Auth's "Static public key" field
 * when running locally (since Civic Auth's servers can't reach localhost JWKS).
 *
 * GET /api/keys/public
 */
export async function GET() {
  try {
    // Fetch the JWKS from Better Auth's built-in endpoint
    const jwksRes = await fetch(
      `${process.env.BETTER_AUTH_URL || "https://localhost:3023"}/api/auth/jwks`,
      // Skip TLS verification for self-signed localhost cert
      { next: { revalidate: 0 } },
    );

    if (!jwksRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch JWKS" },
        { status: 500 },
      );
    }

    const jwks = await jwksRes.json();

    // Import jose dynamically to convert JWK to PEM
    const { importJWK, exportSPKI } = await import("jose");

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

    // Return the first public key as plain text PEM
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
