"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { exchangeCodeForToken } from "@/lib/spotify-auth";
import { Loader2 } from "lucide-react";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const authError = searchParams.get("error");

    if (authError) {
      setError(`Spotify auth denied: ${authError}`);
      return;
    }

    if (!code) {
      setError("No authorization code received.");
      return;
    }

    exchangeCodeForToken(code)
      .then((tokenData) => {
        sessionStorage.setItem("spotify_access_token", tokenData.access_token);
        sessionStorage.setItem("spotify_refresh_token", tokenData.refresh_token);
        sessionStorage.setItem(
          "spotify_token_expiry",
          String(Date.now() + tokenData.expires_in * 1000)
        );
        router.replace("/");
      })
      .catch((err) => {
        setError(err.message ?? "Token exchange failed.");
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-0">
      <div className="glass rounded-2xl p-10 text-center max-w-md mx-4 animate-fade-in">
        {error ? (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-danger/20 flex items-center justify-center">
              <span className="text-3xl">✕</span>
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Authentication Failed
            </h2>
            <p className="text-text-secondary mb-6">{error}</p>
            <button
              onClick={() => router.replace("/")}
              className="px-6 py-2.5 rounded-full bg-surface-2 hover:bg-surface-3 text-text-primary transition-colors cursor-pointer"
            >
              Back to App
            </button>
          </>
        ) : (
          <>
            <Loader2 className="w-10 h-10 mx-auto mb-4 text-spotify-green animate-spin" />
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Connecting to Spotify…
            </h2>
            <p className="text-text-secondary">
              Please wait while we complete authentication.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function CallbackPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-surface-0">
          <Loader2 className="w-10 h-10 text-spotify-green animate-spin" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
