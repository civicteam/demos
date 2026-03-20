import { NextResponse } from "next/server";
import * as jose from "jose";
import { getPublicKey } from "@/lib/auth/keys";

export async function GET() {
  try {
    const publicKey = await getPublicKey();
    const jwk = await jose.exportJWK(publicKey);

    return NextResponse.json({
      keys: [
        {
          ...jwk,
          kid: "next-auth-webmcp-demo-key-1",
          use: "sig",
          alg: "RS256",
        },
      ],
    });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to export JWKS" }, { status: 500 });
  }
}
