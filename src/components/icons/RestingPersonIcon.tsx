type RestingPersonIconProps = {
  className?: string;
  size?: number;
};

export function RestingPersonIcon({ className, size = 24 }: RestingPersonIconProps) {
  return (
    <svg
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width={size}
    >
      <path d="M4 4 L7.5 15.5" />
      <path d="M20 4 L16.5 15.5" />
      <path d="M7.5 15.5 Q12 20 16.5 15.5" />
      <circle cx="8.6" cy="14.6" r="1.6" />
      <path d="M17.5 5.5 L19.5 5.5 L17.5 7.5 L19.5 7.5" />
      <path d="M14.5 2.5 L15.7 2.5 L14.5 3.5 L15.7 3.5" />
    </svg>
  );
}
