import React from 'react';
import { Spinner, SpinnerProps } from './Spinner';

export interface GlobalSpinnerProps {
  show?: boolean;
  spinnerProps?: Omit<SpinnerProps, 'variant'> & { variant?: SpinnerProps['variant'] };
  /** Backdrop classes; defaults to light/dark backgrounds. */
  backdropClassName?: string;
  /** z-index utility class; defaults to a very high layer. */
  zIndexClassName?: string;
}

/** Full-screen overlay spinner for global loading states. */
export const GlobalSpinner: React.FC<GlobalSpinnerProps> = ({
  show = true,
  spinnerProps,
  backdropClassName = 'bg-white dark:bg-black',
  zIndexClassName = 'z-[99999]',
}) => {
  if (!show) return null;
  return (
    <div
      className={`fixed left-0 top-0 ${zIndexClassName} flex h-screen w-screen items-center justify-center ${backdropClassName}`}
      aria-label={spinnerProps?.ariaLabel || 'Loading'}
      role="status"
    >
      <Spinner
        size={spinnerProps?.size ?? 48}
        variant={spinnerProps?.variant ?? 'ring'}
        colorClassName={spinnerProps?.colorClassName ?? 'text-brand-500'}
        borderColorClassName={spinnerProps?.borderColorClassName ?? 'border-brand-500'}
        thickness={spinnerProps?.thickness}
        ariaLabel={spinnerProps?.ariaLabel}
      />
    </div>
  );
};

export default GlobalSpinner;
