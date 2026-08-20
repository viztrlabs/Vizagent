import React from "react";

interface CompassProps {
  heading: number; // in degrees, 0 is north
  onToggleAutoplay?: () => void;
}

export const Compass: React.FC<CompassProps> = ({
  heading,
  onToggleAutoplay,
}) => {
  // Convert heading to CSS rotation (0 degrees at top, clockwise)
  const rotation = -heading; // because in CSS, 0deg is east, but we want 0deg as north

  return (
    <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center space-y-2">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0">
          <div className="w-full h-full border-2 border-gray-300 rounded-full">
            <div className="absolute inset-0 m-0.5 border-2 border-primary-500 rounded-full transform"
                 style={{ transform: `rotate(${rotation}deg)` }}>
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-left-4 border-transparent border-right-4 border-transparent border-bottom-4 border-primary-500" />
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-xs font-bold text-gray-900 dark:text-white">N</div>
          </div>
        </div>
      </div>
      <div className="text-xs text-gray-600 dark:text-gray-300">
        {heading.toFixed(0)}°
      </div>
      {onToggleAutoplay && (
        <button
          onClick={onToggleAutoplay}
          className="mt-2 px-2 py-1 bg-primary-600 text-white text-xs rounded hover:bg-primary-700"
        >
          Toggle Autoplay
          </button>
      )}
    </div>
  );
};