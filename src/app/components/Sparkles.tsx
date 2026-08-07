'use client';

/**
 * Four-pointed sparkle stars, hand-coded rather than imported, because the
 * design system asks for pixel art and Lucide has no sparkle that reads at
 * this size. Purely decorative, so hidden from screen readers.
 */

type SparkleProps = {
  size?: number;
  style?: React.CSSProperties;
};

export function Sparkle({ size = 20, style }: SparkleProps) {
  return (
    <svg
      className="sparkle"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      style={style}
    >
      {/* Two crossed bars, waisted at the centre to read as a star. */}
      <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" />
    </svg>
  );
}
