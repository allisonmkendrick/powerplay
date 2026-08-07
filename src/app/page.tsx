'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Window from './components/Window';
import { Sparkle } from './components/Sparkles';
import PowerHour from './components/PowerHour';

const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI;
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const RESPONSE_TYPE = 'code';
const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
  'user-read-email',
  'user-read-private',
  'playlist-read-private',
  'playlist-read-collaborative',
].join(' ');

function handleLogin() {
  const authUrl = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI!,
  )}&response_type=${RESPONSE_TYPE}&scope=${encodeURIComponent(SCOPES)}`;
  window.location.href = authUrl;
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get('code');
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If there is a code, try exchanging it for an access token
    if (code && !token && !loading) {
      setLoading(true);
      fetch('/api/auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.access_token) {
            setToken(data.access_token);
            // Optionally store in localStorage: localStorage.setItem('spotify_token', data.access_token)
            // Remove code from the URL (for a clean look)
            router.replace('/');
          } else {
            setError('Failed to get access token from Spotify.');
          }
        })
        .catch(() => setError('Failed to get access token from Spotify.'))
        .finally(() => setLoading(false));
    }
  }, [code, token, loading, router]);

  if (loading) {
    return (
      <div className="center-screen">
        <Window title="connecting.exe" dialog>
          <p className="terminal center">Logging in with Spotify...</p>
        </Window>
      </div>
    );
  }

  if (token) {
    return <PowerHour token={token} />;
  }

  return (
    <div className="center-screen relative">
      <Sparkle size={28} style={{ top: '18%', left: '14%' }} />
      <Sparkle size={18} style={{ top: '26%', right: '18%' }} />
      <Sparkle size={22} style={{ bottom: '20%', left: '22%' }} />

      <div style={{ maxWidth: 460, width: '100%' }}>
        <Window title="powerplay.exe">
          <div className="stack center">
            <h1 className="pixel">POWERPLAY</h1>
            <p className="terminal">
              Sixty songs. One minute each.
              <br />
              Built from your own playlists.
            </p>
            <div className="btn-row" style={{ justifyContent: 'center' }}>
              <button className="btn btn--primary btn--big" onClick={handleLogin}>
                LOG IN WITH SPOTIFY
              </button>
            </div>
            {error && <p className="terminal danger">{error}</p>}
          </div>
        </Window>
      </div>
    </div>
  );
}

// useSearchParams opts the tree out of prerendering, so Next requires a
// Suspense boundary above it. Without one the production build fails.
export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="center-screen">
          <Window title="loading.exe" dialog>
            <p className="terminal center">Starting up...</p>
          </Window>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
