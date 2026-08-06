import { InputHTMLAttributes, forwardRef } from 'react';

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  showValue?: boolean;
}

const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ className = '', label, value, min = 0, max = 1, step = 0.01, showValue = true, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm text-gray-400">{label}</label>
            {showValue && (
              <span className="text-xs text-gray-500">{value.toFixed(2)}</span>
            )}
          </div>
        )}
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          className={`w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan min-h-touch ${className}`}
          {...props}
        />
      </div>
    );
  }
);

Slider.displayName = 'Slider';
export { Slider };
