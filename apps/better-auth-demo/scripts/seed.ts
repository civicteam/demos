import { auth } from "../app/lib/auth/server";

try {
  const ctx = await auth.api.signUpEmail({
    body: {
      name: "Demo User",
      email: "demo@example.com",
      password: "demo12345",
    },
    asResponse: false,
  });

  if (ctx?.user) {
    console.log("Seeded demo user: demo@example.com / demo12345");
  }
} catch (error: unknown) {
  const err = error as { status?: string; body?: { code?: string } };
  if (err?.body?.code === "USER_ALREADY_EXISTS") {
    console.log("Demo user already exists, skipping seed.");
  } else {
    throw error;
  }
}
