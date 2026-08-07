'use client';

import { useEffect, useState } from 'react';

/**
 * Temporary diagnostic. What Spotify thinks is connected and which device
 * it believes is active. If our tab is registered twice, or something else
 * holds the active flag, playback gets cut off moments after it starts.
 */

export type Device = {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  is_restricted: boolean;
};

export function useDevices(token: string | null, pollMs = 3000): Device[] {
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const read = async () => {
      try {
        const res = await fetch('https://api.spotify.com/v1/me/player/devices', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setDevices(data.devices ?? []);
      } catch {
        // A failed poll is not worth reporting.
      }
    };

    void read();
    const timer = setInterval(read, pollMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [token, pollMs]);

  return devices;
}
