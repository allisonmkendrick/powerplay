'use client';

import { useEffect, useRef, useState } from 'react';
import Window from './Window';
import PlaylistList from './PlaylistList';
import HourPlayer from './HourPlayer';
import { useSpotifyPlayer } from '../lib/useSpotifyPlayer';
import { useHourEngine } from '../lib/useHourEngine';
import type { Round } from '../lib/round';

/**
 * Owns the two states the app has once you are signed in: choosing a
 * playlist, and playing the hour.
 */

type PowerHourProps = {
  token: string;
};

export default function PowerHour({ token }: PowerHourProps) {
  const [round, setRound] = useState<Round | null>(null);
  const {
    status: playerStatus,
    deviceId,
    error: playerError,
    player,
  } = useSpotifyPlayer(token);
  const hour = useHourEngine(token, deviceId, round?.tracks ?? [], player);

  // The engine only sees the round on the render after it is set, so
  // starting is deferred until then.
  const started = useRef(false);

  useEffect(() => {
    if (!started.current && round?.tracks.length && playerStatus === 'ready') {
      started.current = true;
      hour.start();
    }
  }, [round, playerStatus, hour]);

  if (playerStatus === 'needs-premium') {
    return (
      <div className="center-screen">
        <Window title="premium_required.exe" dialog>
          <div className="stack">
            <h2 className="pixel">PREMIUM ONLY</h2>
            <p className="terminal">
              Spotify only lets apps play full tracks for Premium accounts.
              Without one it can read your playlists but not play them, which is
              not much of a power hour.
            </p>
          </div>
        </Window>
      </div>
    );
  }

  if (playerStatus === 'error') {
    return (
      <div className="center-screen">
        <Window title="error.exe" dialog>
          <p className="terminal danger">{playerError}</p>
        </Window>
      </div>
    );
  }

  if (playerStatus === 'loading') {
    return (
      <div className="center-screen">
        <Window title="connecting.exe" dialog>
          <p className="terminal center">Getting the speakers ready...</p>
        </Window>
      </div>
    );
  }

  if (round && hour.status !== 'idle') {
    return (
      <HourPlayer
        hour={hour}
        onExit={() => {
          hour.stop();
          started.current = false;
          setRound(null);
        }}
      />
    );
  }

  return (
    <PlaylistList
      token={token}
      canStart={playerStatus === 'ready'}
      onStart={setRound}
    />
  );
}
