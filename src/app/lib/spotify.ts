/**
 * Spotify Web API helpers.
 *
 * Keep the shapes we actually use narrow. The API returns a great deal
 * more than a power hour needs, and asking for less keeps the responses
 * small when a playlist runs to hundreds of tracks.
 */

export type Track = {
  id: string;
  uri: string;
  name: string;
  artists: string;
  durationMs: number;
};

/** Spotify caps this endpoint at 100 per request. */
const PAGE_SIZE = 100;

/** Only the fields we read, which keeps large playlists cheap to fetch. */
const FIELDS =
  'next,items(is_local,track(id,uri,name,type,is_playable,is_local,duration_ms,artists(name)))';

type RawTrack = {
  id: string | null;
  uri: string | null;
  name: string | null;
  type: string;
  is_playable?: boolean;
  is_local?: boolean;
  duration_ms: number;
  artists: { name: string }[];
};

type RawItem = {
  is_local: boolean;
  track: RawTrack | null;
};

type Page = {
  next: string | null;
  items: RawItem[];
};

export class SpotifyError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'SpotifyError';
    this.status = status;
  }
}

/**
 * A track has to survive all of this to be worth queueing. Local files have
 * no playable URI, episodes are not songs, and tracks the account cannot
 * play would stall the hour when their minute came round.
 */
function isPlayable(item: RawItem): boolean {
  const track = item.track;
  if (!track) return false;
  if (item.is_local || track.is_local) return false;
  if (track.type !== 'track') return false;
  if (track.is_playable === false) return false;
  if (!track.id || !track.uri?.startsWith('spotify:track:')) return false;
  if (!track.duration_ms) return false;
  return true;
}

function toTrack(item: RawItem): Track {
  const track = item.track!;
  return {
    id: track.id!,
    uri: track.uri!,
    name: track.name ?? 'Unknown track',
    artists: track.artists.map((a) => a.name).join(', ') || 'Unknown artist',
    durationMs: track.duration_ms,
  };
}

/**
 * Every playable track in a playlist, following Spotify's paging until it
 * runs out. Pass a signal so switching playlists mid-fetch can cancel.
 */
export async function fetchPlaylistTracks(
  token: string,
  playlistId: string,
  signal?: AbortSignal,
): Promise<Track[]> {
  const tracks: Track[] = [];

  let url: string | null =
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks` +
    `?limit=${PAGE_SIZE}&offset=0&fields=${encodeURIComponent(FIELDS)}`;

  while (url) {
    const res: Response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });

    if (!res.ok) {
      throw new SpotifyError(
        res.status,
        res.status === 401
          ? 'Your Spotify session has expired.'
          : `Spotify returned ${res.status} while loading the playlist.`,
      );
    }

    const page: Page = await res.json();
    for (const item of page.items ?? []) {
      if (isPlayable(item)) tracks.push(toTrack(item));
    }

    url = page.next;
  }

  return tracks;
}
