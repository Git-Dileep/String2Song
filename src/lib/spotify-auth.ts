// ─── Spotify PKCE Auth Utility ───
// Implements Authorization Code Flow with PKCE for browser-side auth.
// No server secret needed – everything runs in the client.

const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ?? "";
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI ?? "http://127.0.0.1:3000/callback";
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";

const SCOPES = [
  "playlist-modify-public",
  "playlist-modify-private",
  "user-read-private",
];

// ── Crypto helpers ──────────────────────────────────────────────────────

function generateRandomString(length: number): string {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => possible[v % possible.length]).join("");
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest("SHA-256", data);
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ── Public API ──────────────────────────────────────────────────────────

/**
 * Kick off the PKCE login flow.
 * Generates a code verifier, stores it in sessionStorage, and redirects to Spotify.
 */
export async function redirectToSpotifyAuth(): Promise<void> {
  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64UrlEncode(hashed);

  sessionStorage.setItem("spotify_code_verifier", codeVerifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPES.join(" "),
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    show_dialog: "true",
  });

  window.location.href = `${AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Exchange the authorization code for an access token using the stored verifier.
 */
export async function exchangeCodeForToken(code: string): Promise<SpotifyTokenResponse> {
  const codeVerifier = sessionStorage.getItem("spotify_code_verifier");
  if (!codeVerifier) throw new Error("Code verifier not found in session storage.");

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: codeVerifier,
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(`Token exchange failed: ${error?.error_description ?? res.statusText}`);
  }

  const data: SpotifyTokenResponse = await res.json();
  sessionStorage.removeItem("spotify_code_verifier");
  return data;
}

/**
 * Refresh the access token using a refresh token.
 */
export async function refreshAccessToken(refreshToken: string): Promise<SpotifyTokenResponse> {
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    throw new Error("Failed to refresh access token");
  }

  return res.json();
}

// ── Types ───────────────────────────────────────────────────────────────

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}
