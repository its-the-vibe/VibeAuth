import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { createSessionToken, type GoogleProfile } from "../lib/session";
import type { ProviderEnvironment } from "../config/providers";

interface GoogleTokenResponse {
  access_token?: unknown;
}

interface GoogleUserInfo {
  sub?: unknown;
  name?: unknown;
  given_name?: unknown;
  family_name?: unknown;
  email?: unknown;
  email_verified?: unknown;
  picture?: unknown;
}

const google = new Hono<{ Bindings: ProviderEnvironment }>();
const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "Lax" as const,
  path: "/",
};

function randomBase64Url(byteLength: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function clearOAuthCookies(c: Parameters<typeof deleteCookie>[0]): void {
  deleteCookie(c, "oauth_state", cookieOptions);
  deleteCookie(c, "oauth_verifier", cookieOptions);
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

google.get("/auth/google/login", async (c) => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = c.env;
  if (!GOOGLE_CLIENT_ID?.trim() || !GOOGLE_CLIENT_SECRET?.trim()) {
    return c.text("Missing Google client credentials.", 500);
  }

  const state = randomBase64Url(32);
  const verifier = randomBase64Url(32);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challengeBytes = new Uint8Array(digest);
  let challengeBinary = "";
  for (const byte of challengeBytes) {
    challengeBinary += String.fromCharCode(byte);
  }
  const codeChallenge = btoa(challengeBinary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizationUrl.search = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: new URL("/auth/google/callback", c.req.url).toString(),
    response_type: "code",
    scope: "openid profile email",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  }).toString();

  setCookie(c, "oauth_state", state, { ...cookieOptions, maxAge: 10 * 60 });
  setCookie(c, "oauth_verifier", verifier, { ...cookieOptions, maxAge: 10 * 60 });
  return c.redirect(authorizationUrl.toString(), 302);
});

google.get("/auth/google/callback", async (c) => {
  const { code, state } = c.req.query();
  const savedState = getCookie(c, "oauth_state");
  const verifier = getCookie(c, "oauth_verifier");
  if (!code || !state || !savedState || !verifier || state !== savedState) {
    clearOAuthCookies(c);
    return c.text("Invalid OAuth state or missing authorization code.", 400);
  }

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SESSION_SECRET } = c.env;
  if (!GOOGLE_CLIENT_ID?.trim() || !GOOGLE_CLIENT_SECRET?.trim() || !SESSION_SECRET?.trim()) {
    clearOAuthCookies(c);
    return c.text("Missing Google or session secrets.", 500);
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        code_verifier: verifier,
        grant_type: "authorization_code",
        redirect_uri: new URL("/auth/google/callback", c.req.url).toString(),
      }),
    });
    if (!tokenResponse.ok) {
      throw new Error("Token exchange failed");
    }
    const token: unknown = await tokenResponse.json();
    if (
      typeof token !== "object" ||
      token === null ||
      typeof (token as GoogleTokenResponse).access_token !== "string" ||
      !(token as GoogleTokenResponse).access_token
    ) {
      throw new Error("Invalid token response");
    }
    const accessToken = (token as GoogleTokenResponse).access_token as string;

    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: {
        Authorization: "Bearer " + accessToken,
      },
    });
    if (!profileResponse.ok) {
      throw new Error("User info request failed");
    }
    const userInfo: unknown = await profileResponse.json();
    if (
      typeof userInfo !== "object" ||
      userInfo === null ||
      typeof (userInfo as GoogleUserInfo).sub !== "string" ||
      !(userInfo as GoogleUserInfo).sub
    ) {
      throw new Error("Invalid user info response");
    }

    const user = userInfo as GoogleUserInfo;
    const composedName = [user.given_name, user.family_name]
      .filter((part): part is string => typeof part === "string" && part.length > 0)
      .join(" ");
    const profile: GoogleProfile = {
      provider: "google",
      id: user.sub as string,
      name: nullableString(user.name) ?? (composedName || null),
      email: nullableString(user.email),
      image: nullableString(user.picture),
    };
    const sessionToken = await createSessionToken(profile, SESSION_SECRET);
    setCookie(c, "session_token", sessionToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60,
    });
    clearOAuthCookies(c);
    return c.redirect("/dashboard", 302);
  } catch {
    clearOAuthCookies(c);
    return c.text("Unable to authenticate with Google.", 502);
  }
});

export default google;
