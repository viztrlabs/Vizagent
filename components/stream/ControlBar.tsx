'use client';

interface ControlBarProps {
  onMute?: () => void;
  onFullscreen?: () => void;
  isMuted?: boolean;
}

export function ControlBar({ onMute, onFullscreen, isMuted }: ControlBarProps) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-surface/90 backdrop-blur-sm rounded-lg p-2 safe-bottom max-w-[calc(100vw-2rem)]">
      <button
        onClick={onMute}
        className="p-2 rounded-md hover:bg-surface transition-colors min-h-touch min-w-touch"
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>
      <button
        onClick={onFullscreen}
        className="p-2 rounded-md hover:bg-surface transition-colors min-h-touch min-w-touch"
        title="Fullscreen"
      >
        ⛶
      </button>
    </div>
  );
}
