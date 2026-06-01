interface BrandMarkProps {
  size?: number;
  className?: string;
}

export function BrandMark({ size = 64, className }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M24 4L28 20L44 24L28 28L24 44L20 28L4 24L20 20L24 4Z" fill="#D95C41" />
    </svg>
  );
}
