import { useState, useEffect, useRef, useMemo } from 'react';

interface TimelinePlayerProps {
  scenes: Array<{
    id: string;
    title: string;
    sortOrder: number;
    equirectangularUrl: string;
  }>;
  currentSceneId: string | null;
  onSceneChange: (sceneId: string) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  autoAdvanceDelay: number; // seconds between scene transitions
}

export function TimelinePlayer({ 
  scenes, 
  currentSceneId, 
  onSceneChange, 
  isPlaying, 
  onTogglePlay,
  autoAdvanceDelay = 5
}: TimelinePlayerProps) {
  // Compute current index from currentSceneId and scenes
  const currentIndex = useMemo(() => {
    if (!currentSceneId || !scenes?.length) return 0;
    const foundIndex = scenes.findIndex(scene => scene.id === currentSceneId);
    return foundIndex !== -1 ? foundIndex : 0;
  }, [currentSceneId, scenes]);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-advance logic
  useEffect(() => {
    if (!isPlaying || scenes.length <= 1) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    timeoutRef.current = setTimeout(() => {
      const nextIndex = (currentIndex + 1) % scenes.length;
      const nextSceneId = scenes[nextIndex].id;
      onSceneChange(nextSceneId);
    }, autoAdvanceDelay * 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isPlaying, scenes.length, onSceneChange, autoAdvanceDelay, currentIndex, scenes]);

  const handlePrev = () => {
    if (scenes.length === 0) return;
    const prevIndex = (currentIndex - 1 + scenes.length) % scenes.length;
    const prevSceneId = scenes[prevIndex].id;
    onSceneChange(prevSceneId);
    
    // Reset timer when manually navigating
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (isPlaying) {
      onTogglePlay(); // Pause when manual navigation occurs
    }
  };

  const handleNext = () => {
    if (scenes.length === 0) return;
    const nextIndex = (currentIndex + 1) % scenes.length;
    const nextSceneId = scenes[nextIndex].id;
    onSceneChange(nextSceneId);
    
    // Reset timer when manually navigating
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (isPlaying) {
      onTogglePlay(); // Pause when manual navigation occurs
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-2">
      {/* Timeline bar */}
      <div className="w-64 h-2 bg-gray-700 bg-opacity-50 rounded-full overflow-hidden">
        <div
          className={`h-full bg-white bg-opacity-75 transition-all duration-300 ${
            isPlaying ? 'animate-pulse' : ''
          }`}
          style={{ width: `${((currentIndex + 1) / scenes.length) * 100}%` }}
        ></div>
      </div>

      {/* Scene info and controls */}
      <div className="flex flex-col items-center text-sm text-white">
        {/* Current scene title */}
        {scenes[currentIndex] && (
          <div className="mb-1">
            <strong>{scenes[currentIndex].title}</strong>
          </div>
        )}
        
        {/* Progress text */}
        <div className="text-xs text-gray-400">
          {scenes.length > 0 ? `${currentIndex + 1} / ${scenes.length}` : '0 / 0'}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={handlePrev}
            disabled={scenes.length <= 1}
            className={`p-2 rounded hover:bg-gray-700 ${
              scenes.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-label="Previous scene"
          >
            ‹
          </button>
          
          <button
            onClick={onTogglePlay}
            className="p-2 rounded hover:bg-gray-700"
            aria-label={isPlaying ? 'Pause tour' : 'Play tour'}
          >
            {isPlaying ? '❚❚' : '▶️'}
          </button>
          
          <button
            onClick={handleNext}
            disabled={scenes.length <= 1}
            className={`p-2 rounded hover:bg-gray-700 ${
              scenes.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-label="Next scene"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}