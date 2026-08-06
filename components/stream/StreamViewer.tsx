'use client';

import { useRef, useEffect, useState } from 'react';
import { PeerConnection } from '@/lib/types';
import { ConnectionStatus } from './ConnectionStatus';

interface StreamViewerProps {
  roomId: string;
  userId: string;
}

export function StreamViewer({ roomId, userId }: StreamViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [peers, setPeers] = useState<PeerConnection[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`);

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'join', room_id: roomId, user_id: userId }));
      setIsConnected(true);
    };

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'peer_joined') {
        const peerConnection = new RTCPeerConnection();
        // Add your logic for handling peer connections
      }

      if (data.type === 'offer') {
        // Handle offer
      }

      if (data.type === 'answer') {
        // Handle answer
      }

      if (data.type === 'ice_candidate') {
        // Handle ICE candidate
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      socket.close();
    };
  }, [roomId, userId]);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover rounded-lg"
      />
      <ConnectionStatus isConnected={isConnected} peerCount={peers.length} />
    </div>
  );
}
