import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'btn-primary': variant === 'primary',
            'btn-secondary': variant === 'secondary',
            'bg-transparent hover:bg-white/5 text-gray-400 hover:text-white': variant === 'ghost',
            'bg-red-500/20 text-red-400 hover:bg-red-500/30': variant === 'danger',
            'text-xs px-2.5 py-1.5 rounded-md': size === 'sm',
            'text-sm px-4 py-2 rounded-lg': size === 'md',
            'text-base px-6 py-3 rounded-xl': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
