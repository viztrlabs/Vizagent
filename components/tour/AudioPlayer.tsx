'use client';

import { useState, useEffect, useRef } from 'react';

interface AudioPlayerProps {
  audioUrl?: string;
  autoplay?: boolean;
  volume?: number; // 0 to 1
}

export function AudioPlayer({ 
  audioUrl, 
  autoplay = false, 
  volume: initialVolume = 0.5 
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(initialVolume);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Initialize audio element and set volume
  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      audioElement.volume = currentVolume;
    }
  }, [currentVolume]);

  // Handle autoplay safely (require user interaction for browsers that block autoplay)
  useEffect(() => {
    if (audioUrl) {
      const audioElement = audioRef.current;
      if (audioElement) {
        audioElement.src = audioUrl;
        audioElement.loop = true;

        // Attempt autoplay only if user has interacted or if we're in an environment that allows it
        if (autoplay && hasUserInteracted) {
          audioElement.play().catch(() => {
            // Autoplay failed (likely due to browser policy), wait for user interaction
            setIsPlaying(false);
          });
        } else if (autoplay && !hasUserInteracted) {
          // Don't autoplay, wait for user interaction
          setIsPlaying(false);
        }
      }
    }
  }, [audioUrl, autoplay, hasUserInteracted]);

  // Update playing state when audio ends or is paused/played
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('pause', handlePause);
    audioElement.addEventListener('ended', handleEnded);

    return () => {
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('pause', handlePause);
      audioElement.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Toggle play/pause
  const togglePlay = () => {
    if (!audioRef.current) return;
    setHasUserInteracted(true); // Mark that user has interacted
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {
        // Play failed, keep state as not playing
        setIsPlaying(false);
      });
    }
  };

  // Set volume
  const setVolume = (volume: number) => {
    setCurrentVolume(volume);
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  };

  // Mute/unmute
  const toggleMute = () => {
    setCurrentVolume(currentVolume === 0 ? 0.5 : 0);
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className="flex items-center space-x-1 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-md hover:bg-white/20 transition-colors text-sm text-gray-100 hover:text-white"
        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
      >
        {isPlaying ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 12M6 6l12 6" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Mute Button */}
      <button
        onClick={toggleMute}
        className="flex items-center space-x-1 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-md hover:bg-white/20 transition-colors text-sm text-gray-100 hover:text-white"
        aria-label={currentVolume === 0 ? 'Unmute' : 'Mute'}
      >
        {currentVolume === 0 ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m0-3-3 3M3 16l4.948-3.696a1.224 1.224 0 012.126-.656 11.014 11.014 0 016.111 0 1.224 1.224 0 012.126.656 11.012 11.012 0 016.111 0 1.224 1.224 0 012.126-.656l4.948 3.696M3 16v-4a10.016 10.016 0 013.443-8.948 10.011 10.011 0 018.557 0 10.016 10.016 0 013.443 8.948" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.549 8.468a3 3 0 00-2.121-.543l-2.293-2.293a1.5 1.5 0 00-2.121 2.121l.638.638A12.018 12.018 0 0111.03 12a12.018 12.018 0 01-3.458 8.572l.638.638a1.5 1.5 0 002.121-2.121l2.293-2.293a3 3 0 00.543-2.121zM9.179 12.821A6 6 0 1012.171 9.828l3.252 3.25a.75.75 0 001.06 1.06l1.781-1.78a6.003 6.003 0 00-7.873-7.873z" />
          </svg>
        )}
      </button>

      {/* Volume Slider */}
      <div className="flex items-center space-x-2">
        <label htmlFor="volume-slider" className="sr-only">
          Volume
        </label>
        <div className="flex items-center space-x-1">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.549 8.468a3 3 0 00-2.121-.543l-2.293-2.293a1.5 1.5 0 00-2.121 2.121l.638.638A12.018 12.018 0 0111.03 12a12.018 12.018 0 01-3.458 8.572l.638.638a1.5 1.5 0 002.121-2.121l2.293-2.293a3 3 0 00.543-2.121zM9.179 12.821A6 6 0 1012.171 9.828l3.252 3.25a.75.75 0 001.06 1.06l1.781-1.78a6.003 6.003 0 00-7.873-7.873z" />
          </svg>
          <input
            id="volume-slider"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={currentVolume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-24"
            aria-label="Volume"
          />
          <span className="w-8 text-center text-xs">{Math.round(currentVolume * 100)}%</span>
        </div>
      </div>
    </div>
  );
}