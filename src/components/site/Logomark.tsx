/**
 * Two memory cells and a pointer between them — the site's whole thesis in
 * 20 pixels. Amber tip: the pointer is the live part.
 */
export function Logomark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="0.75" y="3.75" width="6.5" height="6.5" rx="1.25" stroke="var(--steel)" strokeWidth="1.5" />
      <rect x="12.75" y="9.75" width="6.5" height="6.5" rx="1.25" stroke="var(--steel)" strokeWidth="1.5" />
      <path d="M4 10.5v2.5a1.5 1.5 0 0 0 1.5 1.5h5.2" stroke="var(--steel)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 12.6 12.6 14.5 10 16.4z" fill="var(--amber)" />
    </svg>
  );
}
