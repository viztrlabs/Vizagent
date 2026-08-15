import { LabelHTMLAttributes, forwardRef } from 'react';

const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={`block text-sm text-gray-400 ${className}`}
        {...props}
      />
    );
  }
);

Label.displayName = 'Label';
export { Label };