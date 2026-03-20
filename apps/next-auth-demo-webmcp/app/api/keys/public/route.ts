import { NextResponse } from "next/server";
import { getPublicKeyPem } from "@/lib/auth/keys";

export async function GET() {
  try {
    const publicKey = getPublicKeyPem();

    return new NextResponse(publicKey, {
      headers: {
        "Content-Type": "application/x-pem-file",
        "Content-Disposition": 'attachment; filename="public-key.pem"',
      },
    });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to export public key" }, { status: 500 });
  }
}
