'use client';

import { memo, useRef, useEffect, useState } from 'react';
import { PeerConnection } from '@/lib/types';
import { ConnectionStatus } from './ConnectionStatus';

interface StreamViewerProps {
  roomId: string;
  userId: string;
}

export const StreamViewer = memo(function StreamViewer({ roomId, userId }: StreamViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [peers, setPeers] = useState<PeerConnection[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function joinRoom() {
      try {
        const res = await fetch('/api/streams/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ room_id: roomId, user_id: userId }),
        });

        if (!res.ok) throw new Error('Failed to join room');

        const data = await res.json();
        if (!cancelled) {
          setIsConnected(true);
          setPeers(data.peers.map((id: string) => ({ peerId: id, userId: id, connectionState: 'connected' as const })));
        }
      } catch (error) {
        console.error('Stream join error:', error);
        if (!cancelled) setIsConnected(false);
      }
    }

    joinRoom();

    return () => {
      cancelled = true;
      fetch('/api/streams/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId, user_id: userId }),
      }).catch(() => {});
    };
  }, [roomId, userId]);

  return (
    <div className="relative w-full aspect-video sm:aspect-auto sm:h-full bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <ConnectionStatus isConnected={isConnected} peerCount={peers.length} />
    </div>
  );
});
