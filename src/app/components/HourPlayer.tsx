'use client';

import { Button, Container, Group, Progress, Stack, Text, Title } from '@mantine/core';
import type { Hour } from '../lib/useHourEngine';
import type { SdkState } from '../lib/useSpotifyPlayer';
import { MINUTE_MS } from '../lib/startOffset';

/**
 * Deliberately plain. The player screen is where the design work goes (#7),
 * and building it twice would be a waste, so this is structure only.
 */

type HourPlayerProps = {
  hour: Hour;
  onExit: () => void;
  /** Temporary, while we work out why audio is silent. */
  sdk: SdkState;
};

function seconds(ms: number): string {
  return String(Math.max(0, Math.ceil(ms / 1000)));
}

export default function HourPlayer({ hour, onExit, sdk }: HourPlayerProps) {
  const { status, index, current, next, remainingMs, total, error } = hour;

  if (status === 'finished') {
    return (
      <Container size="sm" py="xl">
        <Stack align="center" gap="md">
          <Title ta="center">That is the hour.</Title>
          <Text ta="center" c="dimmed">
            {total} {total === 1 ? 'track' : 'tracks'}, one minute each.
          </Text>
          <Button onClick={onExit}>Pick another playlist</Button>
        </Stack>
      </Container>
    );
  }

  const elapsed = MINUTE_MS - remainingMs;

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Text ta="center" c="dimmed" size="sm">
          {index + 1} of {total}
        </Text>

        <Stack gap={4} align="center">
          <Title order={1} ta="center">
            {current?.name ?? ''}
          </Title>
          <Text ta="center" c="dimmed" size="lg">
            {current?.artists ?? ''}
          </Text>
        </Stack>

        <Stack gap={4} align="center">
          <Text
            ta="center"
            fw={700}
            style={{ fontSize: 64, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}
          >
            {seconds(remainingMs)}
          </Text>
          <Progress
            value={(elapsed / MINUTE_MS) * 100}
            w="100%"
            size="sm"
            transitionDuration={0}
          />
        </Stack>

        {next && (
          <Text ta="center" size="sm" c="dimmed">
            Next: {next.name}, {next.artists}
          </Text>
        )}

        {error && (
          <Text ta="center" c="red" size="sm">
            {error}
          </Text>
        )}

        <Group justify="center" gap="sm">
          {status === 'playing' ? (
            <Button onClick={hour.pause}>Pause</Button>
          ) : (
            <Button onClick={hour.resume}>Resume</Button>
          )}
          <Button variant="light" onClick={hour.skip}>
            Skip
          </Button>
          <Button variant="subtle" color="gray" onClick={onExit}>
            End
          </Button>
        </Group>

        {/* Temporary. Remove once audio is confirmed working. */}
        <Stack gap={2} mt="xl">
          <Text size="xs" c="dimmed" ta="center" fw={600}>
            Spotify SDK state
          </Text>
          <Text size="xs" c="dimmed" ta="center" ff="monospace">
            paused={String(sdk.paused)} position={Math.round(sdk.positionMs / 1000)}s
            volume={sdk.volume === null ? '?' : sdk.volume.toFixed(2)}
          </Text>
          <Text size="xs" c="dimmed" ta="center" ff="monospace">
            sdkTrack={sdk.trackName ?? 'none'}
          </Text>
          <Text size="xs" c="dimmed" ta="center" ff="monospace">
            canActivate={String(sdk.canActivate)} activated={String(sdk.activated)}
          </Text>
          <Text size="xs" c={sdk.lastError ? 'red' : 'dimmed'} ta="center" ff="monospace">
            stalls={sdk.stalls} lastError={sdk.lastError ?? 'none'}
          </Text>
        </Stack>
      </Stack>
    </Container>
  );
}
