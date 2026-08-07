'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * The Spotify Web Playback SDK turns the browser tab into a speaker that
 * Spotify can address like any other device. It is Premium only, which is
 * a product constraint rather than a bug, so the hook reports that plainly
 * instead of failing in a way nobody can act on.
 */

export type PlayerStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'needs-premium'
  | 'error';

type PlayerHandle = {
  status: PlayerStatus;
  deviceId: string | null;
  error: string | null;
  player: Spotify.Player | null;
};

const SDK_SRC = 'https://sdk.scdn.co/spotify-player.js';

/** How long to wait before deciding the SDK is never going to connect. */
const CONNECT_TIMEOUT_MS = 15_000;

/**
 * The SDK announces itself through a global callback, so that has to be in
 * place before the script runs. Loading it here rather than in a component
 * keeps that ordering guaranteed.
 */
function loadSdk(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.Spotify) return Promise.resolve();

  return new Promise((resolve) => {
    window.onSpotifyWebPlaybackSDKReady = () => resolve();

    if (!document.querySelector(`script[src="${SDK_SRC}"]`)) {
      const script = document.createElement('script');
      script.src = SDK_SRC;
      script.async = true;
      document.body.appendChild(script);
    }
  });
}

/** Premium is checked up front, so the reason is known before anything fails. */
async function hasPremium(token: string): Promise<boolean> {
  const res = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return false;
  const me = await res.json();
  return me.product === 'premium';
}

export function useSpotifyPlayer(token: string | null): PlayerHandle {
  const [status, setStatus] = useState<PlayerStatus>('idle');
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<Spotify.Player | null>(null);

  // The SDK asks for a token whenever it needs one, which can be long after
  // setup, so it reads from a ref rather than closing over a stale value.
  const tokenRef = useRef(token);
  tokenRef.current = token;

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    let player: Spotify.Player | null = null;

    (async () => {
      setStatus('loading');
      setError(null);

      if (!(await hasPremium(token))) {
        if (cancelled) return;
        setStatus('needs-premium');
        return;
      }

      await loadSdk();
      if (cancelled || !window.Spotify) return;

      player = new window.Spotify.Player({
        name: 'PowerPlay',
        getOAuthToken: (cb) => cb(tokenRef.current ?? ''),
        volume: 0.8,
      });
      playerRef.current = player;

      player.addListener('ready', ({ device_id }) => {
        if (cancelled) return;
        setDeviceId(device_id);
        setStatus('ready');
      });

      player.addListener('not_ready', () => {
        if (cancelled) return;
        setDeviceId(null);
        setStatus('idle');
      });

      // Premium is caught above, so reaching this means something else.
      player.addListener('account_error', () => {
        if (cancelled) return;
        setStatus('needs-premium');
      });

      player.addListener('authentication_error', () => {
        if (cancelled) return;
        setError('Spotify signed you out. Log in again to keep playing.');
        setStatus('error');
      });

      player.addListener('initialization_error', ({ message }) => {
        if (cancelled) return;
        setError(message || 'This browser cannot play Spotify audio.');
        setStatus('error');
      });

      player.addListener('playback_error', ({ message }) => {
        if (cancelled) return;
        setError(message || 'Spotify could not play that track.');
      });

      await player.connect();

      // The SDK can hang indefinitely when it cannot reach its own storage,
      // which happens with third-party cookies blocked or in private
      // windows. Waiting forever behind a spinner tells nobody anything.
      setTimeout(() => {
        if (cancelled) return;
        setStatus((current) => {
          if (current !== 'loading') return current;
          setError(
            'Spotify never finished connecting. This usually means third-party ' +
              'cookies are blocked, or the browser is in a private window.',
          );
          return 'error';
        });
      }, CONNECT_TIMEOUT_MS);
    })();

    return () => {
      cancelled = true;
      player?.disconnect();
      playerRef.current = null;
    };
  }, [token]);

  return { status, deviceId, error, player: playerRef.current };
}
