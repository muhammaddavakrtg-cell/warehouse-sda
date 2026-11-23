export function BrandLogo({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} shrink-0`}
      aria-label="Logo KRT"
      role="img"
    >
      <circle cx="50" cy="50" r="46" fill="#0B8A3E" />
      <path
        d="M 10 56 Q 48 76 90 42"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      <polygon points="92,40 81,41 87,49" fill="#FFFFFF" />
      <text
        x="24"
        y="55"
        fill="#FFFFFF"
        fontFamily="Arial, sans-serif"
        fontWeight="900"
        fontSize="15"
        letterSpacing="0.5"
      >
        KRT
      </text>
    </svg>
  );
}