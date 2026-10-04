"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Music,
  LogIn,
  LogOut,
  User,
  ChevronDown,
  Sparkles,
  Search,
  Trash2,
  RefreshCw,
  ExternalLink,
  ListMusic,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Play,
  Pause,
  Globe,
  Lock,
  ClipboardPaste,
  Loader2,
  PartyPopper,
} from "lucide-react";
import { redirectToSpotifyAuth } from "@/lib/spotify-auth";
import { parseRawText, type ParsedTrack } from "@/lib/parser";
import {
  getCurrentUser,
  searchTracks,
  searchTrack,
  createPlaylist,
  addTracksToPlaylist,
  type SpotifyUser,
  type SearchResult,
} from "@/lib/spotify-api";
import { PRESETS } from "@/lib/presets";

// ─── Main App ───────────────────────────────────────────────────────────

export default function HomePage() {
  // Auth state
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Playlist config
  const [playlistTitle, setPlaylistTitle] = useState("My Imported Playlist");
  const [playlistDesc, setPlaylistDesc] = useState("Created with Textify");
  const [isPublic, setIsPublic] = useState(false);

  // Text input
  const [rawText, setRawText] = useState("");
  const [presetsOpen, setPresetsOpen] = useState(false);

  // Parsing & search
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState({ done: 0, total: 0 });

  // Playlist creation
  const [isCreating, setIsCreating] = useState(false);
  const [createProgress, setCreateProgress] = useState({ done: 0, total: 0 });
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);

  // Audio preview
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Re-search modal
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editQuery, setEditQuery] = useState("");
  const [reSearching, setReSearching] = useState(false);

  // ── Bootstrap auth from sessionStorage ──
  useEffect(() => {
    const stored = sessionStorage.getItem("spotify_access_token");
    if (stored) {
      setToken(stored);
      getCurrentUser(stored)
        .then(setUser)
        .catch(() => {
          sessionStorage.removeItem("spotify_access_token");
          setToken(null);
        })
        .finally(() => setAuthLoading(false));
    } else {
      setAuthLoading(false);
    }
  }, []);

  // ── Handlers ──
  const handleLogout = useCallback(() => {
    sessionStorage.removeItem("spotify_access_token");
    sessionStorage.removeItem("spotify_refresh_token");
    sessionStorage.removeItem("spotify_token_expiry");
    setToken(null);
    setUser(null);
  }, []);

  const handleParseAndSearch = useCallback(async () => {
    if (!token || !rawText.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    setCreatedUrl(null);

    const parsed = parseRawText(rawText);
    setSearchProgress({ done: 0, total: parsed.length });

    const results = await searchTracks(parsed, token, (done, total) => {
      setSearchProgress({ done, total });
    });

    setSearchResults(results);
    setIsSearching(false);
  }, [token, rawText]);

  const handleRemoveTrack = useCallback((idx: number) => {
    setSearchResults((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleSelectCandidate = useCallback(
    (resultIdx: number, candidate: SearchResult["match"]) => {
      setSearchResults((prev) =>
        prev.map((r, i) =>
          i === resultIdx
            ? { ...r, match: candidate, status: candidate ? "found" : "not_found" }
            : r
        )
      );
    },
    []
  );

  const handleReSearch = useCallback(
    async (idx: number) => {
      if (!token || !editQuery.trim()) return;
      setReSearching(true);

      const fakeParsed: ParsedTrack = {
        id: crypto.randomUUID(),
        title: editQuery,
        artist: "",
        raw: editQuery,
      };

      const result = await searchTrack(fakeParsed, token);

      setSearchResults((prev) =>
        prev.map((r, i) =>
          i === idx
            ? {
                ...r,
                match: result.match,
                status: result.status,
                candidates: result.candidates,
                parsed: { ...r.parsed, title: editQuery },
              }
            : r
        )
      );

      setReSearching(false);
      setEditingIdx(null);
      setEditQuery("");
    },
    [token, editQuery]
  );

  const handleCreatePlaylist = useCallback(async () => {
    if (!token || !user) return;

    const matchedUris = searchResults
      .filter((r) => r.match)
      .map((r) => r.match!.uri);

    if (matchedUris.length === 0) return;

    setIsCreating(true);
    setCreateProgress({ done: 0, total: matchedUris.length });

    try {
      const playlist = await createPlaylist(
        user.id,
        token,
        playlistTitle,
        playlistDesc,
        isPublic
      );

      await addTracksToPlaylist(playlist.id, matchedUris, token, (done, total) => {
        setCreateProgress({ done, total });
      });

      setCreatedUrl(playlist.external_urls.spotify);
    } catch (err) {
      console.error("Playlist creation failed:", err);
    } finally {
      setIsCreating(false);
    }
  }, [token, user, searchResults, playlistTitle, playlistDesc, isPublic]);

  const togglePreview = useCallback(
    (url: string) => {
      if (playingPreview === url) {
        audioRef.current?.pause();
        setPlayingPreview(null);
      } else {
        if (audioRef.current) audioRef.current.pause();
        const audio = new Audio(url);
        audio.volume = 0.5;
        audio.play();
        audio.onended = () => setPlayingPreview(null);
        audioRef.current = audio;
        setPlayingPreview(url);
      }
    },
    [playingPreview]
  );

  const matchedCount = searchResults.filter((r) => r.status === "found").length;
  const ambiguousCount = searchResults.filter((r) => r.status === "ambiguous").length;
  const notFoundCount = searchResults.filter((r) => r.status === "not_found").length;
  const canCreate = token && searchResults.some((r) => r.match) && !isCreating;

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  // ─── Render ───
  return (
    <div className="min-h-screen bg-surface-0">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-spotify-green/[0.03] blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-spotify-green/[0.02] blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ─── Header ─── */}
        <header className="flex items-center justify-between mb-10 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-spotify-green/20 flex items-center justify-center">
              <Music className="w-5 h-5 text-spotify-green" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-text-primary">
                Textify<span className="text-spotify-green"> to Spotify</span>
              </h1>
              <p className="text-xs text-text-muted">
                Paste songs → Create playlists
              </p>
            </div>
          </div>

          {authLoading ? (
            <div className="h-10 w-40 shimmer rounded-full" />
          ) : token && user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass">
                {user.images?.[0] ? (
                  <img
                    src={user.images[0].url}
                    alt={user.display_name}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-surface-3 flex items-center justify-center">
                    <User className="w-4 h-4 text-text-secondary" />
                  </div>
                )}
                <span className="text-sm font-medium text-text-primary max-w-[120px] truncate">
                  {user.display_name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-surface-2 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                title="Disconnect"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => redirectToSpotifyAuth()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-spotify-green hover:bg-spotify-green-light text-black font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Connect Spotify
            </button>
          )}
        </header>

        {/* ─── Auth CTA when not logged in ─── */}
        {!token && !authLoading && (
          <div className="glass rounded-2xl p-8 mb-8 text-center animate-slide-up">
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-spotify-green/10 flex items-center justify-center glow-green">
              <Music className="w-10 h-10 text-spotify-green" />
            </div>
            <h2 className="text-2xl font-bold mb-2 gradient-text inline-block">
              Turn Text Into Playlists
            </h2>
            <p className="text-text-secondary max-w-md mx-auto mb-6">
              Paste any song list — from markdown, articles, Reddit posts, or
              messages — and we'll find every track on Spotify and build your
              playlist in seconds.
            </p>
            <button
              onClick={() => redirectToSpotifyAuth()}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-spotify-green hover:bg-spotify-green-light text-black font-bold transition-all hover:scale-[1.03] active:scale-[0.97] animate-pulse-glow cursor-pointer"
            >
              <LogIn className="w-5 h-5" />
              Connect Your Spotify Account
            </button>
          </div>
        )}

        {/* ─── Main content (only when authenticated) ─── */}
        {token && (
          <div className="space-y-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            {/* ── Playlist Config ── */}
            <section className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <ListMusic className="w-5 h-5 text-spotify-green" />
                <h2 className="text-lg font-semibold">Playlist Settings</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">
                    Title
                  </label>
                  <input
                    type="text"
                    value={playlistTitle}
                    onChange={(e) => setPlaylistTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-border text-text-primary placeholder-text-muted focus:border-spotify-green focus:ring-1 focus:ring-spotify-green/30 outline-none transition-all"
                    placeholder="My Imported Playlist"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">
                    Visibility
                  </label>
                  <div className="flex items-center gap-3 h-[42px]">
                    <button
                      onClick={() => setIsPublic(!isPublic)}
                      className="toggle-track cursor-pointer"
                      data-checked={isPublic}
                      role="switch"
                      aria-checked={isPublic}
                    >
                      <div className="toggle-thumb" />
                    </button>
                    <span className="flex items-center gap-1.5 text-sm text-text-secondary">
                      {isPublic ? (
                        <>
                          <Globe className="w-4 h-4" /> Public
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" /> Private
                        </>
                      )}
                    </span>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-text-secondary mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={playlistDesc}
                    onChange={(e) => setPlaylistDesc(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-border text-text-primary placeholder-text-muted focus:border-spotify-green focus:ring-1 focus:ring-spotify-green/30 outline-none transition-all resize-none"
                    placeholder="Created with Textify"
                  />
                </div>
              </div>
            </section>

            {/* ── Raw Text Input ── */}
            <section className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <ClipboardPaste className="w-5 h-5 text-spotify-green" />
                  <h2 className="text-lg font-semibold">Paste Your Songs</h2>
                </div>

                {/* Presets dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setPresetsOpen(!presetsOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Examples
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${presetsOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {presetsOpen && (
                    <div className="absolute right-0 mt-1 w-56 glass rounded-xl shadow-xl z-50 py-1 animate-fade-in">
                      {PRESETS.map((p) => (
                        <button
                          key={p.label}
                          onClick={() => {
                            setRawText(p.value);
                            setPresetsOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors cursor-pointer"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={10}
                className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-text-primary placeholder-text-muted focus:border-spotify-green focus:ring-1 focus:ring-spotify-green/30 outline-none transition-all resize-y font-mono text-sm leading-relaxed"
                placeholder={`Paste your songs here. Supported formats:\n\n1. **Bohemian Rhapsody** – Queen\n2. Blinding Lights - The Weeknd\nFlowers by Miley Cyrus\nArctic Monkeys – Do I Wanna Know?\nLose Yourself\tEminem`}
              />

              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-text-muted">
                  {rawText.trim()
                    ? `${rawText.trim().split("\n").filter(Boolean).length} lines detected`
                    : 'Supports numbered lists, dashes, "by", tabs, and more'}
                </p>
                <button
                  onClick={handleParseAndSearch}
                  disabled={!rawText.trim() || isSearching}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-spotify-green hover:bg-spotify-green-light disabled:opacity-40 disabled:hover:bg-spotify-green text-black font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  {isSearching ? "Searching…" : "Parse & Match Songs"}
                </button>
              </div>

              {/* Search progress */}
              {isSearching && searchProgress.total > 0 && (
                <div className="mt-4 animate-fade-in">
                  <div className="flex justify-between text-xs text-text-muted mb-1">
                    <span>Searching Spotify…</span>
                    <span>
                      {searchProgress.done} / {searchProgress.total}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(searchProgress.done / searchProgress.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </section>

            {/* ── Search Results ── */}
            {searchResults.length > 0 && (
              <section
                className="glass rounded-2xl p-6 animate-slide-up"
                style={{ animationDelay: "0.15s" }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-spotify-green" />
                    <h2 className="text-lg font-semibold">Matched Tracks</h2>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="badge badge-found">
                      <CheckCircle2 className="w-3 h-3" /> {matchedCount} found
                    </span>
                    {ambiguousCount > 0 && (
                      <span className="badge badge-ambiguous">
                        <AlertCircle className="w-3 h-3" /> {ambiguousCount}{" "}
                        ambiguous
                      </span>
                    )}
                    {notFoundCount > 0 && (
                      <span className="badge badge-not-found">
                        <XCircle className="w-3 h-3" /> {notFoundCount} not
                        found
                      </span>
                    )}
                  </div>
                </div>

                {/* Track list */}
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {searchResults.map((result, idx) => (
                    <div
                      key={result.parsed.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-surface-0/60 hover:bg-surface-2/60 transition-colors group animate-fade-in"
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      {/* Album art */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-surface-2 overflow-hidden">
                        {result.match?.album.images?.[0] ? (
                          <img
                            src={result.match.album.images[result.match.album.images.length > 1 ? 1 : 0]?.url}
                            alt={result.match.album.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music className="w-5 h-5 text-text-muted" />
                          </div>
                        )}
                      </div>

                      {/* Track info */}
                      <div className="flex-1 min-w-0">
                        {result.match ? (
                          <>
                            <p className="text-sm font-medium text-text-primary truncate">
                              {result.match.name}
                            </p>
                            <p className="text-xs text-text-secondary truncate">
                              {result.match.artists.map((a) => a.name).join(", ")}
                              <span className="text-text-muted"> · {result.match.album.name}</span>
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-medium text-text-primary truncate">
                              {result.parsed.title}
                            </p>
                            <p className="text-xs text-text-muted truncate">
                              {result.parsed.artist || "Unknown artist"}
                            </p>
                          </>
                        )}
                      </div>

                      {/* Status badge */}
                      <span
                        className={`badge flex-shrink-0 ${
                          result.status === "found"
                            ? "badge-found"
                            : result.status === "ambiguous"
                              ? "badge-ambiguous"
                              : "badge-not-found"
                        }`}
                      >
                        {result.status === "found" && <CheckCircle2 className="w-3 h-3" />}
                        {result.status === "ambiguous" && <AlertCircle className="w-3 h-3" />}
                        {result.status === "not_found" && <XCircle className="w-3 h-3" />}
                        {result.status === "found" ? "Found" : result.status === "ambiguous" ? "Ambiguous" : "Not Found"}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Audio preview */}
                        {result.match?.preview_url && (
                          <button
                            onClick={() => togglePreview(result.match!.preview_url!)}
                            className="p-1.5 rounded-lg hover:bg-surface-3 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                            title="Preview"
                          >
                            {playingPreview === result.match.preview_url ? (
                              <Pause className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}

                        {/* Re-search */}
                        <button
                          onClick={() => {
                            setEditingIdx(idx);
                            setEditQuery(
                              `${result.parsed.title} ${result.parsed.artist}`.trim()
                            );
                          }}
                          className="p-1.5 rounded-lg hover:bg-surface-3 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                          title="Edit & re-search"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>

                        {/* Open in Spotify */}
                        {result.match && (
                          <a
                            href={result.match.external_urls.spotify}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg hover:bg-surface-3 text-text-secondary hover:text-text-primary transition-colors"
                            title="Open in Spotify"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {/* Remove */}
                        <button
                          onClick={() => handleRemoveTrack(idx)}
                          className="p-1.5 rounded-lg hover:bg-danger/20 text-text-secondary hover:text-danger transition-colors cursor-pointer"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Candidates dropdown for ambiguous */}
                      {result.status === "ambiguous" &&
                        result.candidates.length > 1 && (
                          <div className="absolute hidden group-hover:block right-4 top-full mt-1 z-30">
                            {/* shown via re-search modal instead */}
                          </div>
                        )}
                    </div>
                  ))}
                </div>

                {/* ── Re-search modal ── */}
                {editingIdx !== null && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="glass rounded-2xl p-6 w-full max-w-lg mx-4 animate-slide-up">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-spotify-green" />
                        Edit & Re-search
                      </h3>
                      <p className="text-sm text-text-secondary mb-3">
                        Original:{" "}
                        <span className="text-text-primary">
                          {searchResults[editingIdx]?.parsed.raw}
                        </span>
                      </p>
                      <input
                        type="text"
                        value={editQuery}
                        onChange={(e) => setEditQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleReSearch(editingIdx)}
                        autoFocus
                        className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-border text-text-primary focus:border-spotify-green focus:ring-1 focus:ring-spotify-green/30 outline-none transition-all mb-4"
                        placeholder="Type new search query…"
                      />

                      {/* Show candidates if we have them */}
                      {searchResults[editingIdx]?.candidates.length > 1 && (
                        <div className="mb-4">
                          <p className="text-xs text-text-muted mb-2">
                            Or pick from existing matches:
                          </p>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {searchResults[editingIdx].candidates.map((c) => (
                              <button
                                key={c.id}
                                onClick={() => {
                                  handleSelectCandidate(editingIdx, c);
                                  setEditingIdx(null);
                                }}
                                className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg hover:bg-surface-2 transition-colors cursor-pointer"
                              >
                                {c.album.images?.[0] && (
                                  <img
                                    src={c.album.images[c.album.images.length - 1].url}
                                    alt=""
                                    className="w-8 h-8 rounded"
                                  />
                                )}
                                <div className="min-w-0">
                                  <p className="text-sm truncate">{c.name}</p>
                                  <p className="text-xs text-text-muted truncate">
                                    {c.artists.map((a) => a.name).join(", ")}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingIdx(null);
                            setEditQuery("");
                          }}
                          className="px-4 py-2 rounded-full bg-surface-2 hover:bg-surface-3 text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReSearch(editingIdx)}
                          disabled={!editQuery.trim() || reSearching}
                          className="flex items-center gap-2 px-5 py-2 rounded-full bg-spotify-green hover:bg-spotify-green-light disabled:opacity-40 text-black font-semibold text-sm transition-all cursor-pointer"
                        >
                          {reSearching ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Search className="w-4 h-4" />
                          )}
                          Search
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Create Playlist button ── */}
                <div className="mt-6 pt-5 border-t border-border">
                  {createdUrl ? (
                    <div className="flex items-center justify-between animate-fade-in">
                      <div className="flex items-center gap-2 text-spotify-green">
                        <PartyPopper className="w-5 h-5" />
                        <span className="font-semibold">Playlist created!</span>
                      </div>
                      <a
                        href={createdUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-spotify-green hover:bg-spotify-green-light text-black font-semibold text-sm transition-all hover:scale-[1.02] cursor-pointer"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open in Spotify
                      </a>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={handleCreatePlaylist}
                        disabled={!canCreate}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-spotify-green hover:bg-spotify-green-light disabled:opacity-40 disabled:hover:bg-spotify-green text-black font-bold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed cursor-pointer"
                      >
                        {isCreating ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <ListMusic className="w-5 h-5" />
                        )}
                        {isCreating
                          ? "Creating Playlist…"
                          : `Create Spotify Playlist (${
                              searchResults.filter((r) => r.match).length
                            } tracks)`}
                      </button>

                      {/* Create progress */}
                      {isCreating && createProgress.total > 0 && (
                        <div className="mt-3 animate-fade-in">
                          <div className="flex justify-between text-xs text-text-muted mb-1">
                            <span>Adding tracks…</span>
                            <span>
                              {createProgress.done} / {createProgress.total}
                            </span>
                          </div>
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${(createProgress.done / createProgress.total) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ─── Footer ─── */}
        <footer className="mt-16 pb-8 text-center text-xs text-text-muted animate-fade-in">
          <p>
            Textify to Spotify · Built with Next.js & Spotify Web API ·{" "}
            <a
              href="https://developer.spotify.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-spotify-green transition-colors"
            >
              Powered by Spotify
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
