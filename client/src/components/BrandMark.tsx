/**
 * TotsLearn nav mark. Inline SVG uses theme tokens so light/dark match the UI; favicon uses
 * `client/public/totslearn-mark.svg`.
 */
export function BrandMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      className={`block shrink-0 rounded-xl shadow-sm shadow-primary/20 ${className}`}
      aria-hidden
    >
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path
        className="fill-primary-foreground"
        d="M16 6.5l1.35 4.1h4.4l-3.55 2.6 1.35 4.1L16 17.4l-3.55 2.6 1.35-4.1-3.55-2.6h4.4L16 6.5z"
      />
      <path
        className="fill-primary-foreground/90"
        d="M9 20.5c0-.8.6-1.4 1.4-1.4h11.2c.8 0 1.4.6 1.4 1.4v1.2c0 .8-.6 1.4-1.4 1.4H10.4c-.8 0-1.4-.6-1.4-1.4v-1.2z"
      />
    </svg>
  );
}
