// ─── Spotify API Client ───
// Thin wrapper around the Spotify Web API with rate-limit handling,
// exponential backoff, and batched track addition.

import type { ParsedTrack } from "./parser";

const API_BASE = "https://api.spotify.com/v1";

// ── Types ───────────────────────────────────────────────────────────────

export interface SpotifyUser {
  id: string;
  display_name: string;
  images: { url: string; width: number; height: number }[];
  email?: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string; width: number; height: number }[];
  };
  preview_url: string | null;
  external_urls: { spotify: string };
}

export interface SearchResult {
  parsed: ParsedTrack;
  match: SpotifyTrack | null;
  status: "found" | "ambiguous" | "not_found";
  candidates: SpotifyTrack[];
}

export interface CreatedPlaylist {
  id: string;
  external_urls: { spotify: string };
  uri: string;
  name: string;
}

// ── Core fetch with retry ───────────────────────────────────────────────

async function spotifyFetch(
  url: string,
  token: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get("Retry-After") ?? "1", 10);
    const backoff = Math.min(retryAfter * 1000, 2 ** retryCount * 1000, 30000);
    await new Promise((resolve) => setTimeout(resolve, backoff));
    return spotifyFetch(url, token, options, retryCount + 1);
  }

  return res;
}

// ── API methods ─────────────────────────────────────────────────────────

export async function getCurrentUser(token: string): Promise<SpotifyUser> {
  const res = await spotifyFetch(`${API_BASE}/me`, token);
  if (!res.ok) throw new Error(`Failed to fetch user: ${res.statusText}`);
  return res.json();
}

/**
 * Search for a track on Spotify.
 * First tries structured query `track:{title} artist:{artist}`,
 * then falls back to a raw query if no results.
 */
export async function searchTrack(
  parsed: ParsedTrack,
  token: string
): Promise<SearchResult> {
  const structuredQuery = [
    parsed.title ? `track:${parsed.title}` : "",
    parsed.artist ? `artist:${parsed.artist}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  let candidates = await doSearch(structuredQuery, token);

  // Fallback: raw query
  if (candidates.length === 0) {
    const rawQuery = `${parsed.title} ${parsed.artist}`.trim();
    candidates = await doSearch(rawQuery, token);
  }

  if (candidates.length === 0) {
    return { parsed, match: null, status: "not_found", candidates: [] };
  }

  // Pick best match
  const best = candidates[0];
  const isAmbiguous = candidates.length > 1 && !isStrongMatch(best, parsed);

  return {
    parsed,
    match: best,
    status: isAmbiguous ? "ambiguous" : "found",
    candidates,
  };
}

async function doSearch(query: string, token: string): Promise<SpotifyTrack[]> {
  const params = new URLSearchParams({
    q: query,
    type: "track",
    limit: "5",
  });

  const res = await spotifyFetch(`${API_BASE}/search?${params}`, token);
  if (!res.ok) return [];

  const data = await res.json();
  return data.tracks?.items ?? [];
}

function isStrongMatch(track: SpotifyTrack, parsed: ParsedTrack): boolean {
  const titleMatch = track.name.toLowerCase().includes(parsed.title.toLowerCase());
  const artistMatch =
    !parsed.artist ||
    track.artists.some((a) =>
      a.name.toLowerCase().includes(parsed.artist.toLowerCase())
    );
  return titleMatch && artistMatch;
}

/**
 * Search for multiple tracks with a small delay between requests
 * to be respectful of rate limits.
 */
export async function searchTracks(
  tracks: ParsedTrack[],
  token: string,
  onProgress?: (completed: number, total: number) => void
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  for (let i = 0; i < tracks.length; i++) {
    const result = await searchTrack(tracks[i], token);
    results.push(result);
    onProgress?.(i + 1, tracks.length);

    // Small delay to avoid hitting rate limits
    if (i < tracks.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Create a new playlist for the authenticated user.
 * Uses /me/playlists to avoid user-ID mismatch issues.
 */
export async function createPlaylist(
  _userId: string,
  token: string,
  name: string,
  description: string,
  isPublic: boolean
): Promise<CreatedPlaylist> {
  const res = await spotifyFetch(`${API_BASE}/me/playlists`, token, {
    method: "POST",
    body: JSON.stringify({
      name,
      description,
      public: isPublic,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("Spotify createPlaylist error:", res.status, JSON.stringify(err));
    throw new Error(`Failed to create playlist: ${err?.error?.message ?? res.statusText}`);
  }

  return res.json();
}

/**
 * Add tracks to a playlist in batches of 100 (Spotify API limit).
 */
export async function addTracksToPlaylist(
  playlistId: string,
  trackUris: string[],
  token: string,
  onProgress?: (completed: number, total: number) => void
): Promise<void> {
  const batchSize = 100;
  const total = trackUris.length;

  for (let i = 0; i < total; i += batchSize) {
    const batch = trackUris.slice(i, i + batchSize);

    const res = await spotifyFetch(
      `${API_BASE}/playlists/${playlistId}/items`,
      token,
      {
        method: "POST",
        body: JSON.stringify({ uris: batch }),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Failed to add tracks: ${err?.error?.message ?? res.statusText}`);
    }

    onProgress?.(Math.min(i + batchSize, total), total);
  }
}
