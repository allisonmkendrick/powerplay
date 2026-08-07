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
    player,
  } = useSpotifyPlayer(token);
  const hour = useHourEngine(token, deviceId, round?.tracks ?? [], player);

  // Chrome only lets audio begin inside a click, so the first track cannot
  // start automatically. It is queued as soon as a playlist is chosen, and
  // the play button on the next screen does the starting.
  const preloaded = useRef(false);

  useEffect(() => {
    if (!preloaded.current && round?.tracks.length && playerStatus === 'ready') {
      preloaded.current = true;
      void hour.preload();
    }
  }, [round, playerStatus, hour]);

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

  if (round) {
    return (
      <HourPlayer
        hour={hour}
        onExit={() => {
          hour.stop();
          preloaded.current = false;
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
