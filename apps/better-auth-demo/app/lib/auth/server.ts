import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
import { oidcProvider } from "better-auth/plugins";
import Database from "better-sqlite3";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const auth: any = betterAuth({
  database: new Database("./auth.db"),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    jwt({
      jwks: {
        keyPairConfig: {
          alg: "RS256",
        },
      },
    }),
    oidcProvider({
      loginPage: "/",
      consentPage: "/",
      useJWTPlugin: true,
    }),
  ],
});
