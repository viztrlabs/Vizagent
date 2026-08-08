'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PixelStreamingConfig, StreamState, StreamStats } from '@/lib/pixel-streaming/types';

interface UsePixelStreamingResult {
  state: StreamState;
  stats: StreamStats;
  videoRef: React.RefObject<HTMLVideoElement>;
  connect: () => void;
  reconnect: () => void;
  toggleMute: () => void;
  isMuted: boolean;
}

export function usePixelStreaming(config: PixelStreamingConfig): UsePixelStreamingResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [state, setState] = useState<StreamState>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [stats, setStats] = useState<StreamStats>({
    bitrate: 0,
    fps: 0,
    latency: 0,
    resolution: '—',
    connectionType: '—',
    codec: '—',
  });

  const setupPeerConnection = useCallback((iceConfig: RTCConfiguration) => {
    const pc = new RTCPeerConnection(iceConfig);
    pcRef.current = pc;

    pc.ontrack = (ev) => {
      if (videoRef.current && ev.streams[0]) {
        videoRef.current.srcObject = ev.streams[0];
        setState('live');
        startStatsCollection();
      }
    };

    pc.onicecandidate = (ev) => {
      if (ev.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'iceCandidate', candidate: ev.candidate }));
      }
    };

    pc.onconnectionstatechange = () => {
      if (['failed', 'disconnected'].includes(pc.connectionState)) {
        setState('error');
      }
    };

    pc.addTransceiver('video', { direction: 'recvonly' });
    pc.addTransceiver('audio', { direction: 'recvonly' });

    return pc;
  }, []);

  const startStatsCollection = useCallback(() => {
    if (statsIntervalRef.current) return;
    statsIntervalRef.current = setInterval(async () => {
      if (!pcRef.current) return;
      try {
        const s = await pcRef.current.getStats();
        let bitrate = 0;
        let fps = 0;
        let latency = 0;
        let width = 0;
        let height = 0;
        let codec = 'H.264';
        s.forEach((r: any) => {
          if (r.type === 'inbound-rtp' && r.mediaType === 'video') {
            bitrate = Math.round((r.bytesReceived * 8) / 1e6 * 10) / 10;
            fps = Math.round(r.framesPerSecond || 0);
            width = r.frameWidth || 0;
            height = r.frameHeight || 0;
          }
          if (r.type === 'candidate-pair' && r.state === 'succeeded') {
            latency = Math.round((r.currentRoundTripTime || 0) * 1000);
          }
          if (r.type === 'codec' && r.mimeType) {
            codec = r.mimeType.split('/')[1] || 'H.264';
          }
        });
        setStats({
          bitrate,
          fps,
          latency,
          resolution: width && height ? `${width}×${height}` : '1920×1080',
          connectionType: 'P2P',
          codec,
        });
      } catch {
        // Stats collection failed silently
      }
    }, 2000);
  }, []);

  const connect = useCallback(() => {
    setState('connecting');
    try {
      const ws = new WebSocket(config.signalingUrl);
      wsRef.current = ws;

      ws.onopen = () => console.log('[VizTR PS] Signalling WS connected');

      ws.onmessage = async (ev) => {
        let m: any;
        try {
          m = JSON.parse(ev.data);
        } catch {
          return;
        }
        console.log('[VizTR PS]', m.type);

        if (m.type === 'config') {
          setupPeerConnection(m.peerConnectionOptions || { iceServers: config.iceServers });
        } else if (m.type === 'offer') {
          if (!pcRef.current) setupPeerConnection({ iceServers: config.iceServers });
          await pcRef.current!.setRemoteDescription({ type: 'offer', sdp: m.sdp });
          const ans = await pcRef.current!.createAnswer();
          await pcRef.current!.setLocalDescription(ans);
          ws.send(JSON.stringify({ type: 'answer', sdp: ans.sdp }));
        } else if (m.type === 'iceCandidate' && pcRef.current && m.candidate) {
          try {
            await pcRef.current.addIceCandidate(m.candidate);
          } catch {
            // ICE candidate failed silently
          }
        }
      };

      ws.onerror = () => setState('error');
      ws.onclose = () => {
        if (state === 'live') setState('error');
        if (pcRef.current) {
          pcRef.current.close();
          pcRef.current = null;
        }
      };
    } catch {
      setState('error');
    }
  }, [config, setupPeerConnection, state]);

  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setTimeout(connect, 400);
  }, [connect]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      if (videoRef.current) videoRef.current.muted = !prev;
      return !prev;
    });
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (pcRef.current) pcRef.current.close();
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
    };
  }, [connect]);

  return { state, stats, videoRef, connect, reconnect, toggleMute, isMuted };
}
