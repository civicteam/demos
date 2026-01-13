import * as jose from "jose";
import type { JWT, JWTEncodeParams, JWTDecodeParams } from "next-auth/jwt";
import { getPrivateKey, getPublicKey } from "./keys";

const ISSUER = "https://localhost:3000";
const AUDIENCE = "civic-mcp";

export async function encodeJwt(params: JWTEncodeParams): Promise<string> {
  const { token, maxAge } = params;

  if (!token) {
    throw new Error("Token is required for encoding");
  }

  const privateKey = await getPrivateKey();
  const now = Math.floor(Date.now() / 1000);

  const jwt = await new jose.SignJWT({
    ...token,
    iat: now,
    exp: now + (maxAge ?? 24 * 60 * 60),
    iss: ISSUER,
    aud: AUDIENCE,
    scope: "openid profile email",
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .sign(privateKey);

  return jwt;
}

export async function decodeJwt(params: JWTDecodeParams): Promise<JWT | null> {
  const { token } = params;

  if (!token) return null;

  try {
    const publicKey = await getPublicKey();
    const { payload } = await jose.jwtVerify(token, publicKey, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    return payload as JWT;
  } catch (error) {
    console.error("JWT decode error:", error);
    return null;
  }
}
