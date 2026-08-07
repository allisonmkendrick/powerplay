'use client';

import type { Playlist } from './PlaylistList';

type PlaylistCardProps = {
  playlist: Playlist;
  onClick?: () => void;
  selected?: boolean;
};

export default function PlaylistCard({
  playlist,
  onClick,
  selected,
}: PlaylistCardProps) {
  const art = playlist.images?.[0]?.url;

  return (
    <button
      type="button"
      className="row"
      onClick={onClick}
      aria-pressed={selected}
    >
      {/* No alt text: the playlist name sits right beside it, so describing
          the art again would only add noise for a screen reader. */}
      {art ? (
        <img className="row__art" src={art} alt="" width={44} height={44} />
      ) : (
        <span className="row__art" aria-hidden="true" />
      )}

      <span className="row__text">
        <span className="truncate" style={{ display: 'block' }}>
          {playlist.name}
        </span>
        <span className="label">
          {playlist.tracks.total} tracks · {playlist.owner.display_name}
        </span>
      </span>
    </button>
  );
}
