import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan/50 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-cyan text-bg hover:bg-cyan/90',
      secondary: 'bg-surface text-white border border-gray-700 hover:bg-surface/80',
      ghost: 'text-gray-400 hover:text-white hover:bg-surface',
      danger: 'bg-red-600 text-white hover:bg-red-700',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm min-h-touch',
      md: 'px-4 py-2 text-sm min-h-touch',
      lg: 'px-6 py-3 text-base min-h-touch',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export { Button };
