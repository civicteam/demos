import { NextResponse } from "next/server";
import * as jose from "jose";
import { getPublicKey } from "@/lib/auth/keys";

// GET /api/keys/.well-known/jwks.json - Returns the public key in JWKS format
export async function GET() {
  try {
    const publicKey = await getPublicKey();
    const jwk = await jose.exportJWK(publicKey);

    return NextResponse.json({
      keys: [
        {
          ...jwk,
          kid: "federated-auth-demo-key-1",
          use: "sig",
          alg: "RS256",
        },
      ],
    });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to export JWKS" }, { status: 500 });
  }
}
