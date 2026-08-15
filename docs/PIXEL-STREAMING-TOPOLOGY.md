# VizTR — Pixel Streaming Network Topology

> **Status**: Planning-time contract. VizTR is 100% in the planning phase — no production code. This topology describes the **intended** Pixel Streaming path for Phase 4 Task 4 and §9.6. Pixel Streaming is an **enterprise service line** (§24.2): the MVP runs from the local GPU workstation via Cloudflare Tunnel; GPU-node autoscaling is post-launch.

---

## Topology (ASCII)

```
 LOCAL WORKSTATION              CLOUD (Railway)                 EDGE                     CLIENT
┌───────────────────────┐   ┌──────────────────────────┐   ┌────────────────┐   ┌──────────────────────┐
│  UE5 + Pixel          │   │ WebRTC Signaling Broker  │   │  Cloudflare    │   │  Client Browser      │
│  Streaming plugin     │   │ node-mediasoup / ion-sfu │   │  Tunnel →      │   │  pixel-viewer.tsx    │
│  -run=game -Pixel-    │   │ SDP offer/answer (WS)    │   │  xr.viztr.com  │   │  RTCPeerConnection   │
│   StreamingIP=0.0.0.0 │──►│ ICE candidates + media   │──►│  /stream/:sess │──►│  <video> + LATENCY ms │
│  encoded WebRTC video │   │ relay / multi-viewer     │   │  HTTPS + CDN   │   │  session auth (JWT)  │
└──────────┬────────────┘   └───────────┬──────────────┘   └────────────────┘   └──────────┬───────────┘
           │                            │                                                   │
           │  RTCPeerConnection         │  STUN/TURN ICE candidates (TURN relay when        │
           │  (P2P when NAT allows)     │  P2P is blocked / multi-viewer fan-out)           │
           │                            ▼                                                   │
           │                  ┌──────────────────────┐                                       │
           └─────────────────►│  Coturn STUN/TURN     │◄──────────────────────────────────────┘
                              │  NAT traversal /      │
                              │  TURN relay           │
                              └──────────────────────┘
```

**Legend**: media = H.264 video frames + input events (WebRTC); signaling = SDP offer/answer + ICE candidates over WebSocket. Quality presets auto-adapt from Low (5 Mbps/720p/30fps) to Ultra (50 Mbps/4K/60fps) per §9.6.

---

## Flow Explanation

**1. Local source & capture.** The local workstation (RTX 4090, `local/workstation/scripts/start-stream.bat`) launches Unreal Engine 5 with `-run=game -PixelStreamingIP=0.0.0.0 -PixelStreamingPort=8866`. The Pixel Streaming plugin captures the rendered view, encodes it as low-latency H.264, and exposes a WebRTC peer endpoint plus a WebSocket signaling channel (Cirrus-style local signaling server). Hermes (`apps/agent-api/src/hermes/runner.ts`) health-checks the stream and POSTs workstation status to the dashboard — this powers the "Connect Local Development" button (§9.6/§12.5).

**2. Signaling broker.** The broker on Railway (`services/pixel-streaming/broker.ts`, built on `node-mediasoup` or `ion-sfu`, `SFU_URL`) coordinates the WebRTC handshake. It relays SDP offers/answers and trickled ICE candidates between the Unreal peer and each client browser. For a single viewer the media flows peer-to-peer; when multiple viewers join, the SFU acts as the media relay and fan-out point so one Unreal source serves many sessions (§9.14). Session lifecycle is managed by `createSession`/`signal`/`closeSession` (`services/pixel-streaming/session.ts`).

**3. Cloudflare Tunnel → public edge.** `cloudflared` exposes the local signaling/stream endpoint as a stable HTTPS URL under **`xr.viztr.com/stream/:session`** — the workstation opens no inbound firewall ports. Cloudflare terminates TLS at the edge and provides CDN + DDoS protection, routing the browser to the tunnel and onward to the local broker. This keeps the local GPU behind the office NAT while remaining globally reachable.

**4. Client WebRTC + TURN fallback.** `xr-runner/components/viewers/pixel-viewer.tsx` builds an `RTCPeerConnection`, renders the incoming track to a `<video>` element, and shows a live latency badge computed from RTCP statistics. ICE candidates are trickled through the broker; clients behind restrictive NAT/CGNAT fall back to the **Coturn TURN** server for media relay, while STUN handles the common open-NAT case. The target is **< 100 ms end-to-end latency** (§9.6).

**5. Session auth, analytics & GPU scaling.** `createSession(workstationId, projectId)` validates the JWT and returns a session token + signaling endpoints — streams run only from approved local workstations (§9.6). Viewer engagement (enter/exit, duration, latency, bitrate) is emitted as `xr.*` analytics events (§9.23/§15). The 100+ concurrent viewers per GPU node target (§23) requires **GPU node autoscaling by streaming-session demand — documented as a post-launch scaling task, not MVP** (Phase 6 Task 5).

---

## Session & Signaling Sequence

```
1. Client          → POST /api/v1/internal/pixel-streaming/session   (JWT)
   Server          → { sessionId, signalingUrl (SFU_URL), token }
2. Broker (SFU)    → registers Unreal peer on WS channel :8866
3. Client          → stream:start { sessionId }      (Socket.io)
4. Broker          → relays SDP offer/answer between client and Unreal peer
5. Both            → trickle ICE candidates (STUN probe → TURN relay if blocked)
6. Client          → RTCPeerConnection oniceconnectionstate = connected
   Client          → renders <video>, samples RTCP stats → LATENCY ms
7. Client          → xr.pixel.enter / xr.pixel.exit events → analytics (§9.23)
```

The broker emits `stream:answer` and `stream:ice` events back to clients
(`services/pixel-streaming/broker.ts`); `closeSession` releases the session and
GPU budget counters on disconnect (§9.6).

---

## Operating Notes

- **GPU hosting is billable**: Pixel Streaming cannot realistically run for free at production scale; for clients it is charged as a separate GPU-hosting enterprise service line (§9.6/§24.2).
- **Reconnection**: the viewer auto-reconnects with session resume on transient network loss (§9.6).
- **Monitoring**: real-time FPS, latency, bitrate, viewer count, and GPU stats (NVML) are surfaced to the dashboard (§9.6).
- **Input mapping**: keyboard/mouse/touch/gamepad are forwarded to UE5 controls over the same WebRTC data channel (§9.6).
