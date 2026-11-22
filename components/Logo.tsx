/** Hand-drawn-style hanger with a leaf. Pure SVG, no assets. */
export default function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <g stroke="#2B2B2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 16c0-3 4-3.5 4-7.5C28 5 25.5 3.5 23.5 3.5S19.5 5 19.5 7.5" />
        <path d="M24 16 4.5 31.5c-1.6 1.3-.7 3.9 1.4 3.9h36.2c2.1 0 3-2.6 1.4-3.9L24 16Z" fill="#CFE0C8" />
        <path d="M24 31c0-6 4.5-10 11-10.5-.2 6.5-4.2 11-11 10.5Z" fill="#5B9A5B" />
        <path d="M24 31c3-3.5 6-6 8.5-7.5" />
      </g>
    </svg>
  );
}
