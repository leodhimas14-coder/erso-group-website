export default function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="currentColor" />
      <circle cx="17" cy="18" r="8" fill="var(--bg)" />
      <circle cx="47" cy="18" r="8" fill="var(--bg)" />
      <circle cx="32" cy="35" r="20" fill="var(--bg)" />
      <ellipse cx="24" cy="33" rx="5.5" ry="7" transform="rotate(-25 24 33)" fill="currentColor" />
      <ellipse cx="40" cy="33" rx="5.5" ry="7" transform="rotate(25 40 33)" fill="currentColor" />
      <ellipse cx="32" cy="43" rx="3.5" ry="2.5" fill="currentColor" />
    </svg>
  );
}
