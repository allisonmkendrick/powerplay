'use client';

import { useEffect, useRef, useState } from 'react';
import { Alert, Center, Container, Loader, Stack, Text, Title } from '@mantine/core';
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
    activate,
  } = useSpotifyPlayer(token);
  const hour = useHourEngine(token, deviceId, round?.tracks ?? []);

  // The engine only sees the round on the render after it is set, so
  // starting is deferred until then. Calling start in the click handler
  // would hand it the previous, empty track list.
  const startPending = useRef(false);

  useEffect(() => {
    if (startPending.current && round?.tracks.length && hour.status === 'idle') {
      startPending.current = false;
      hour.start();
    }
  }, [round, hour]);

  if (playerStatus === 'needs-premium') {
    return (
      <Container size="sm" py="xl">
        <Stack gap="md">
          <Title order={2} ta="center">
            PowerPlay needs Spotify Premium
          </Title>
          <Text ta="center" c="dimmed">
            Spotify only lets apps play full tracks for Premium accounts. Without one
            it can read your playlists but cannot play them, which is not much of a
            power hour.
          </Text>
        </Stack>
      </Container>
    );
  }

  if (playerStatus === 'error') {
    return (
      <Container size="sm" py="xl">
        <Alert color="red">{playerError}</Alert>
      </Container>
    );
  }

  if (playerStatus === 'loading') {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Stack align="center" gap="sm">
          <Loader size="lg" />
          <Text>Getting the speakers ready...</Text>
        </Stack>
      </Center>
    );
  }

  if (round && hour.status !== 'idle') {
    return (
      <HourPlayer
        hour={hour}
        onExit={() => {
          hour.stop();
          setRound(null);
        }}
      />
    );
  }

  return (
    <PlaylistList
      token={token}
      canStart={playerStatus === 'ready'}
      onStart={(built) => {
        // Unlock audio here, inside the click. Doing it after the state
        // update would no longer count as a user gesture and the browser
        // would refuse to make any sound.
        void activate();
        startPending.current = true;
        setRound(built);
      }}
    />
  );
}
