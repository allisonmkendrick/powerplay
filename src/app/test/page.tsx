'use client';

/**
 * Diagnostic page. One track, no round, no timer, no offset, no engine.
 *
 * The full player has too many moving parts to tell us which one is at
 * fault. This has exactly one job: find out whether this browser and this
 * account can play a single song at all, and which method does it.
 *
 * Delete once audio is working.
 */

import { useEffect, useRef, useState } from 'react';

const SDK_SRC = 'https://sdk.scdn.co/spotify-player.js';

type Line = { at: string; text: string };

export default function TestPage() {
  const [token, setToken] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [log, setLog] = useState<Line[]>([]);
  const [trackUri, setTrackUri] = useState<string | null>(null);
  const [trackName, setTrackName] = useState<string>('');
  const playerRef = useRef<Spotify.Player | null>(null);

  const say = (text: string) =>
    setLog((l) => [...l, { at: new Date().toISOString().slice(11, 19), text }]);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = sessionStorage.getItem('pp_token');
    } catch {
      stored = null;
    }
    if (!stored) {
      say('No token. Sign in on the home page first, then come back here.');
      return;
    }
    setToken(stored);
    say('Token found.');
  }, []);

  // Connect a player. Nothing else happens automatically.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const boot = async () => {
      if (!window.Spotify) {
        say('Loading the SDK...');
        await new Promise<void>((resolve) => {
          window.onSpotifyWebPlaybackSDKReady = () => resolve();
          if (!document.querySelector(`script[src="${SDK_SRC}"]`)) {
            const s = document.createElement('script');
            s.src = SDK_SRC;
            s.async = true;
            document.body.appendChild(s);
          }
        });
      }
      if (cancelled) return;
      say('SDK loaded.');

      const player = new window.Spotify.Player({
        name: 'PowerPlay TEST',
        getOAuthToken: (cb) => cb(token),
        volume: 1.0,
      });
      playerRef.current = player;

      player.addListener('ready', ({ device_id }) => {
        setDeviceId(device_id);
        say(`ready: device ${device_id.slice(0, 8)}...`);
      });
      player.addListener('not_ready', () => say('not_ready'));
      player.addListener('initialization_error', ({ message }) =>
        say(`initialization_error: ${message}`),
      );
      player.addListener('authentication_error', ({ message }) =>
        say(`authentication_error: ${message}`),
      );
      player.addListener('account_error', ({ message }) =>
        say(`account_error: ${message}`),
      );
      player.addListener('playback_error', ({ message }) =>
        say(`playback_error: ${message}`),
      );
      player.addListener('player_state_changed', (s) => {
        if (!s) return say('state: null (this device is not active)');
        say(
          `state: paused=${s.paused} pos=${Math.round(s.position / 1000)}s ` +
            `track=${s.track_window?.current_track?.name ?? '?'}`,
        );
      });

      const ok = await player.connect();
      say(`connect() returned ${ok}`);
    };

    void boot();
    return () => {
      cancelled = true;
    };
  }, [token]);

  /** Picks a track Spotify says this account can actually play. */
  const findTrack = async () => {
    if (!token) return;
    try {
      const me = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json());
      say(`account: product=${me.product} country=${me.country}`);

      const res = await fetch(
        `https://api.spotify.com/v1/search?q=year%3A2020&type=track&limit=1&market=${me.country}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      const t = data.tracks?.items?.[0];
      if (!t) return say('search found nothing');
      setTrackUri(t.uri);
      setTrackName(`${t.name}, ${t.artists.map((a: { name: string }) => a.name).join(', ')}`);
      say(`picked: ${t.name} (playable=${t.is_playable ?? 'unknown'})`);
    } catch (e) {
      say(`findTrack failed: ${String(e)}`);
    }
  };

  /** Method A: the REST endpoint, naming our device. */
  const playViaRest = async () => {
    if (!token || !deviceId || !trackUri) return say('need token, device and track');
    await playerRef.current?.activateElement?.().catch(() => {});
    const res = await fetch(
      `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uris: [trackUri] }),
      },
    );
    say(`REST play -> ${res.status} ${res.status === 204 ? '(accepted)' : ''}`);
    if (!res.ok && res.status !== 202 && res.status !== 204) {
      say(`body: ${(await res.text()).slice(0, 200)}`);
    }
  };

  /** Method B: transfer the session here and let the SDK start it. */
  const playViaTransfer = async () => {
    if (!token || !deviceId) return say('need token and device');
    await playerRef.current?.activateElement?.().catch(() => {});
    const res = await fetch('https://api.spotify.com/v1/me/player', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ device_ids: [deviceId], play: true }),
    });
    say(`transfer(play:true) -> ${res.status}`);
  };

  /** Method C: whatever the SDK already holds. */
  const togglePlay = async () => {
    await playerRef.current?.activateElement?.().catch(() => {});
    await playerRef.current?.togglePlay();
    say('togglePlay() called');
  };

  const btn: React.CSSProperties = {
    padding: '10px 16px',
    marginRight: 8,
    marginBottom: 8,
    fontSize: 15,
    cursor: 'pointer',
  };

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui', maxWidth: 720 }}>
      <h1 style={{ fontSize: 22 }}>Playback test</h1>
      <p style={{ color: '#666', fontSize: 14 }}>
        One track, nothing else. Press the buttons in order and read the log.
      </p>

      <p style={{ fontSize: 14 }}>
        token={token ? 'yes' : 'no'} &nbsp; device={deviceId ? 'ready' : 'waiting'}{' '}
        &nbsp; track={trackName || 'none'}
      </p>

      <div style={{ marginTop: 16 }}>
        <button style={btn} onClick={findTrack} disabled={!token}>
          1. Find a track
        </button>
        <button style={btn} onClick={playViaRest} disabled={!deviceId || !trackUri}>
          2. Play via REST
        </button>
        <button style={btn} onClick={playViaTransfer} disabled={!deviceId}>
          3. Transfer and play
        </button>
        <button style={btn} onClick={togglePlay} disabled={!deviceId}>
          4. togglePlay
        </button>
      </div>

      <pre
        style={{
          marginTop: 20,
          background: '#111',
          color: '#0f0',
          padding: 14,
          fontSize: 12,
          lineHeight: 1.5,
          maxHeight: 420,
          overflow: 'auto',
          borderRadius: 6,
        }}
      >
        {log.map((l, i) => `${l.at}  ${l.text}`).join('\n') || 'waiting...'}
      </pre>
    </div>
  );
}
