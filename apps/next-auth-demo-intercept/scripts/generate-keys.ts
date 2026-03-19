import * as jose from "jose";

async function generateKeys() {
  const { publicKey, privateKey } = await jose.generateKeyPair("RS256", {
    modulusLength: 2048,
    extractable: true,
  });

  const publicKeyPem = await jose.exportSPKI(publicKey);
  const privateKeyPem = await jose.exportPKCS8(privateKey);

  console.log("=== Add these to your .env file ===\n");
  console.log(`JWT_PUBLIC_KEY="${publicKeyPem.replace(/\n/g, "\\n")}"\n`);
  console.log(`JWT_PRIVATE_KEY="${privateKeyPem.replace(/\n/g, "\\n")}"\n`);
}

generateKeys().catch(console.error);
