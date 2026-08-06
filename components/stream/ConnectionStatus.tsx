'use client';

interface ConnectionStatusProps {
  isConnected: boolean;
  peerCount: number;
}

export function ConnectionStatus({ isConnected, peerCount }: ConnectionStatusProps) {
  return (
    <div className="absolute top-4 right-4 flex items-center gap-2 bg-surface/90 backdrop-blur-sm rounded-lg px-3 py-2">
      <div
        className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`}
      />
      <span className="text-sm text-gray-300">
        {isConnected ? `${peerCount} viewer${peerCount !== 1 ? 's' : ''}` : 'Disconnected'}
      </span>
    </div>
  );
}
