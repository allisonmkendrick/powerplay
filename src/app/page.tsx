'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Container, Title, Text, Button, Stack, Center, Loader } from '@mantine/core';
import PlaylistList from './components/PlaylistList';

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

  useEffect(() => {
    // Only load the SDK if not already loaded and user is logged in
    if (typeof window !== 'undefined' && !window.Spotify && token) {
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, [token]);

  if (loading) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Loader size="xl" />
        <Text ta="center">Logging in with Spotify...</Text>
      </Center>
    );
  }

  if (token) {
    return <PlaylistList token={token} />;
  }

  return (
    <Center style={{ minHeight: '100vh' }}>
      <Container size="sm">
        <Stack align="center" gap="md">
          <Title ta="center" mb="md">
            🍻 PowerPlay!
          </Title>
          <Text ta="center" color="dimmed" mb="lg">
            The ultimate 60-minute music drinking game.
            <br />
            Login with Spotify to begin.
          </Text>
          <Button size="lg" radius="md" onClick={handleLogin} style={{ marginTop: 32 }}>
            Login with Spotify
          </Button>
          {error && (
            <Text color="red" ta="center">
              {error}
            </Text>
          )}
        </Stack>
      </Container>
    </Center>
  );
}

// useSearchParams opts the tree out of prerendering, so Next requires a
// Suspense boundary above it. Without one the production build fails.
export default function HomePage() {
  return (
    <Suspense
      fallback={
        <Center style={{ minHeight: '100vh' }}>
          <Loader size="xl" />
        </Center>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
