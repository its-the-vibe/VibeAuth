import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { html } from "hono/html";
import { createSessionToken, verifySessionToken, type AthleteProfile } from "../lib/session";
import type { ProviderEnvironment } from "../config/providers";

interface StravaAthleteResponse {
  id: number;
  firstname?: string | null;
  lastname?: string | null;
  profile?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

interface StravaTokenResponse {
  access_token?: string;
}

const strava = new Hono<{ Bindings: ProviderEnvironment }>();
const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "Lax" as const,
  path: "/",
};

function clearOAuthCookies(c: Parameters<typeof deleteCookie>[0]): void {
  deleteCookie(c, "oauth_state", cookieOptions);
  deleteCookie(c, "oauth_verifier", cookieOptions);
}

function randomHex(byteLength: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function getNullableString(value: string | null | undefined): string | null {
  return typeof value === "string" ? value : null;
}

function isAthleteResponse(value: unknown): value is StravaAthleteResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    Number.isSafeInteger((value as Record<string, unknown>).id)
  );
}

strava.get("/auth/strava/login", (c) => {
  const { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET } = c.env;
  if (!STRAVA_CLIENT_ID?.trim() || !STRAVA_CLIENT_SECRET?.trim()) {
    return c.text("Missing Strava client credentials.", 500);
  }

  const state = randomHex(32);
  const verifier = randomHex(32);
  const authorizationUrl = new URL("https://www.strava.com/oauth/authorize");
  authorizationUrl.search = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID,
    redirect_uri: new URL("/auth/strava/callback", c.req.url).toString(),
    response_type: "code",
    approval_prompt: "auto",
    scope: "read,activity:read",
    state,
  }).toString();

  setCookie(c, "oauth_state", state, { ...cookieOptions, maxAge: 10 * 60 });
  setCookie(c, "oauth_verifier", verifier, { ...cookieOptions, maxAge: 10 * 60 });
  return c.redirect(authorizationUrl.toString(), 302);
});

strava.get("/auth/strava/callback", async (c) => {
  const { code, state } = c.req.query();
  const savedState = getCookie(c, "oauth_state");
  const verifier = getCookie(c, "oauth_verifier");
  if (!code || !state || !savedState || !verifier || state !== savedState) {
    clearOAuthCookies(c);
    return c.text("Invalid OAuth state or missing authorization code.", 400);
  }

  const { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, SESSION_SECRET } = c.env;
  if (!STRAVA_CLIENT_ID?.trim() || !STRAVA_CLIENT_SECRET?.trim() || !SESSION_SECRET?.trim()) {
    clearOAuthCookies(c);
    return c.text("Missing Strava or session secrets.", 500);
  }

  let accessToken: string;
  try {
    const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenResponse.ok) {
      throw new Error("Token exchange failed");
    }
    const token: unknown = await tokenResponse.json();
    if (
      typeof token !== "object" ||
      token === null ||
      typeof (token as StravaTokenResponse).access_token !== "string"
    ) {
      throw new Error("Invalid token response");
    }
    accessToken = (token as StravaTokenResponse).access_token!;
  } catch {
    clearOAuthCookies(c);
    return c.text("Unable to authenticate with Strava.", 502);
  }

  let athlete: AthleteProfile;
  try {
    const athleteResponse = await fetch("https://www.strava.com/api/v3/athlete", {
      headers: { Authorization: "Bearer " + accessToken },
    });
    if (!athleteResponse.ok) {
      throw new Error("Athlete request failed");
    }
    const profile: unknown = await athleteResponse.json();
    if (!isAthleteResponse(profile)) {
      throw new Error("Invalid athlete response");
    }

    athlete = {
      id: profile.id,
      firstname: getNullableString(profile.firstname),
      lastname: getNullableString(profile.lastname),
      profile: getNullableString(profile.profile),
      city: getNullableString(profile.city),
      state: getNullableString(profile.state),
      country: getNullableString(profile.country),
    };
  } catch {
    clearOAuthCookies(c);
    return c.text("Unable to retrieve the Strava athlete profile.", 502);
  }

  const sessionToken = await createSessionToken(athlete, SESSION_SECRET);
  setCookie(c, "session_token", sessionToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60,
  });
  clearOAuthCookies(c);
  return c.redirect("/dashboard", 302);
});

strava.get("/dashboard", async (c) => {
  const token = getCookie(c, "session_token");
  const athlete = token && c.env.SESSION_SECRET
    ? await verifySessionToken(token, c.env.SESSION_SECRET)
    : null;
  if (!athlete) {
    return c.redirect("/login", 302);
  }

  const name = [athlete.firstname, athlete.lastname].filter(Boolean).join(" ") || "Strava athlete";
  const location = [athlete.city, athlete.state, athlete.country].filter(Boolean).join(", ");
  return c.html(html`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Dashboard | VibeAuth</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 text-slate-900">
        <main class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div class="text-center">
            ${athlete.profile
              ? html`<img src="${athlete.profile}" alt="" class="mx-auto mb-4 h-24 w-24 rounded-full object-cover" />`
              : ""}
            <h1 class="text-2xl font-semibold">${name}</h1>
            <p class="mt-2 text-sm text-slate-600">Strava ID: ${athlete.id}</p>
            ${location ? html`<p class="mt-1 text-sm text-slate-600">${location}</p>` : ""}
          </div>
          <form action="/logout" method="post" class="mt-8">
            <button type="submit" class="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-700">
              Sign Out
            </button>
          </form>
        </main>
      </body>
    </html>`);
});

strava.post("/logout", (c) => {
  deleteCookie(c, "session_token", cookieOptions);
  return c.redirect("/login", 302);
});

export default strava;
