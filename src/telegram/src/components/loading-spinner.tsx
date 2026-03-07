import type { ReactNode } from "react";

interface LoadingSpinnerProps {
  /** Optional label (e.g. "Loading...") for accessibility */
  label?: ReactNode;
  className?: string;
}

export function LoadingSpinner({ label, className = "" }: LoadingSpinnerProps) {
  return (
    <div className={`loading-spinner-wrap ${className}`} role="status" aria-live="polite">
      <div className="loading-spinner" aria-hidden="true" />
      {label != null && <span className="loading-spinner-label">{label}</span>}
    </div>
  );
}
