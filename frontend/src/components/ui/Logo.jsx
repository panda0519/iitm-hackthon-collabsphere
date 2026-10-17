// Two overlapping houses: the idea behind every joint event.
export function Logo({ id = "lg", size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <clipPath id={id}>
          <circle cx="12" cy="16" r="9" />
        </clipPath>
      </defs>
      <circle cx="12" cy="16" r="9" fill="#22b8a0" />
      <circle cx="20" cy="16" r="9" fill="#8a7dff" />
      <circle cx="20" cy="16" r="9" fill="#ff7a45" clipPath={`url(#${id})`} />
    </svg>
  );
}
