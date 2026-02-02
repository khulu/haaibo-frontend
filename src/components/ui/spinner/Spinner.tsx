import React from 'react';

export type SpinnerSize = number | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'ring' | 'border';

export interface SpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  /** Text color class for ring variant (uses currentColor). Defaults to brand. */
  colorClassName?: string;
  /** Border color class for border variant. Defaults to brand. */
  borderColorClassName?: string;
  /** Stroke/border thickness in px (fallbacks to a sensible default per size). */
  thickness?: number;
  className?: string;
  /** Optional accessible label. */
  ariaLabel?: string;
}

function resolveSizePx(size: SpinnerSize | undefined): number {
  if (typeof size === 'number') return size > 0 ? size : 20;
  switch (size) {
    case 'sm':
      return 16;
    case 'md':
      return 20;
    case 'lg':
      return 28;
    case 'xl':
      return 36;
    default:
      return 20;
  }
}

/**
 * Reusable spinner component.
 * - variant "ring": Two-circle SVG with a rotating arc (dark-mode compliant)
 * - variant "border": CSS border spinner (rounded-full border with transparent top)
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'ring',
  colorClassName = 'text-brand-500',
  borderColorClassName = 'border-brand-500',
  thickness,
  className,
  ariaLabel = 'Loading',
}) => {
  const px = resolveSizePx(size);
  const stroke = thickness ?? (px >= 36 ? 4 : px >= 28 ? 4 : 3);

  if (variant === 'border') {
    return (
      <div
        role="status"
        aria-label={ariaLabel}
        className={`animate-spin rounded-full border-solid ${borderColorClassName} border-t-transparent ${className ?? ''}`}
        style={{ width: px, height: px, borderWidth: stroke }}
      >
        <span className="sr-only">{ariaLabel}</span>
      </div>
    );
  }

  // ring variant (SVG)
  const r = (px / 2) - stroke / 2;
  const circumference = 2 * Math.PI * r;
  const arc = circumference * 0.25; // visible segment
  const gap = circumference - arc;  // remaining

  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={`animate-spin ${colorClassName} ${className ?? ''}`}
      style={{ width: px, height: px }}
    >
      <svg width={px} height={px} viewBox={`0 0 ${px} ${px}`} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Track */}
        <circle cx={px / 2} cy={px / 2} r={r} strokeWidth={stroke} className="text-gray-200 dark:text-gray-800" stroke="currentColor" />
        {/* Arc segment */}
        <circle
          cx={px / 2}
          cy={px / 2}
          r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arc} ${gap}`}
          stroke="currentColor"
          fill="none"
        />
      </svg>
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
};

export default Spinner;
