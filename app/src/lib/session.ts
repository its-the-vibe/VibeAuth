export interface AthleteProfile {
  id: number;
  firstname: string | null;
  lastname: string | null;
  profile: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
}

export interface GoogleProfile {
  provider: "google";
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

export type SessionProfile = AthleteProfile | GoogleProfile;

type SessionPayload = SessionProfile & {
  exp: number;
};

const encoder = new TextEncoder();

function encodeBase64Url(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBase64Url(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0)).buffer as ArrayBuffer;
}

async function importSecret(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSessionToken(
  profile: SessionProfile,
  secret: string,
): Promise<string> {
  const header = encodeBase64Url(encoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const payload: SessionPayload = {
    ...profile,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  };
  const encodedPayload = encodeBase64Url(encoder.encode(JSON.stringify(payload)));
  const signingInput = `${header}.${encodedPayload}`;
  const signature = await crypto.subtle.sign(
    "HMAC",
    await importSecret(secret),
    encoder.encode(signingInput),
  );

  return `${signingInput}.${encodeBase64Url(new Uint8Array(signature))}`;
}

function isSessionProfile(value: unknown): value is SessionProfile {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const profile = value as Record<string, unknown>;
  const isAthlete =
    Number.isSafeInteger(profile.id) &&
    ["firstname", "lastname", "profile", "city", "state", "country"].every(
      (key) => profile[key] === null || typeof profile[key] === "string",
    );
  const isGoogle =
    profile.provider === "google" &&
    typeof profile.id === "string" &&
    ["name", "email", "image"].every(
      (key) => profile[key] === null || typeof profile[key] === "string",
    );

  return isAthlete || isGoogle;
}

export async function verifySessionToken(
  token: string,
  secret: string,
): Promise<SessionProfile | null> {
  const parts = token.split(".");
  if (parts.length !== 3 || !secret) {
    return null;
  }

  try {
    const [header, encodedPayload, signature] = parts;
    const parsedHeader: unknown = JSON.parse(new TextDecoder().decode(decodeBase64Url(header)));
    if (
      typeof parsedHeader !== "object" ||
      parsedHeader === null ||
      (parsedHeader as Record<string, unknown>).alg !== "HS256"
    ) {
      return null;
    }

    const isValid = await crypto.subtle.verify(
      "HMAC",
      await importSecret(secret),
      decodeBase64Url(signature),
      encoder.encode(`${header}.${encodedPayload}`),
    );
    if (!isValid) {
      return null;
    }

    const payload: unknown = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(encodedPayload)),
    );
    if (
      !isSessionProfile(payload) ||
      typeof (payload as SessionPayload).exp !== "number" ||
      (payload as SessionPayload).exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
