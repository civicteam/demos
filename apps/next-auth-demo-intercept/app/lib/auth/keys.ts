import * as jose from "jose";

let privateKey: CryptoKey | null = null;
let publicKey: CryptoKey | null = null;

export async function getPrivateKey(): Promise<CryptoKey> {
  if (!privateKey) {
    const pemKey = process.env.JWT_PRIVATE_KEY;
    if (!pemKey) {
      throw new Error("JWT_PRIVATE_KEY environment variable is required");
    }
    privateKey = (await jose.importPKCS8(pemKey.replace(/\\n/g, "\n"), "RS256")) as CryptoKey;
  }
  return privateKey;
}

export async function getPublicKey(): Promise<CryptoKey> {
  if (!publicKey) {
    const pemKey = process.env.JWT_PUBLIC_KEY;
    if (!pemKey) {
      throw new Error("JWT_PUBLIC_KEY environment variable is required");
    }
    publicKey = (await jose.importSPKI(pemKey.replace(/\\n/g, "\n"), "RS256")) as CryptoKey;
  }
  return publicKey;
}

export function getPublicKeyPem(): string {
  const pemKey = process.env.JWT_PUBLIC_KEY;
  if (!pemKey) {
    throw new Error("JWT_PUBLIC_KEY environment variable is required");
  }
  return pemKey.replace(/\\n/g, "\n");
}
