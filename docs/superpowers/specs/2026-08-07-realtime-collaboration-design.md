# T-047 Real-time Collaboration — Design Spec

## Overview
Implement real-time collaboration for virtual tours using WebRTC with Socket.io signaling. Supports cursor positions, selections, config sync, and chat between multiple users in a room.

---

## Architecture

```
┌─────────────┐     WebSocket      ┌──────────────────┐
│   Client    │ ◄─────────────────► │ Signaling Server │
│  (Browser)  │   (Socket.io)       │  (Node.js)       │
└─────────────┘                     └────────┬─────────┘
                                             │
                              ┌──────────────┴──────────────┐
                              │                             │
                        ┌─────▼─────┐                 ┌─────▼─────┐
                        │   Redis   │                 │   TURN    │
                        │  (Upstash)│                 │  Server   │
                        └───────────┘                 └───────────┘
```

---

## Components

### 1. Signaling Server (`services/realtime/src/index.ts`)
- **Runtime**: Standalone Node.js process
- **Entry point**: `pnpm dev:realtime` (custom script)
- **Framework**: Socket.io with Redis adapter for horizontal scaling
- **Responsibilities**:
  - Room management (join/leave)
  - WebRTC signaling (offer/answer/ICE candidates)
  - Message routing (cursor, selection, config, chat)
  - User presence tracking

### 2. Data Channel Protocol
**Single reliable ordered data channel per peer connection**

```typescript
// Message envelope (Zod validated)
{
  type: 'cursor' | 'selection' | 'config' | 'chat',
  payload: unknown,        // Type-specific payload
  timestamp: number,       // Server timestamp
  userId: string           // Sender identifier
}

// Payload schemas
cursor:      { x: number, y: number, tourId: string }
selection:   { elementId: string, tourId: string }
config:      { key: string, value: unknown, tourId: string }
chat:        { message: string, tourId: string }
```

### 3. Redis Room State (`lib/server/lib/signaling.ts`)
- Room metadata: `{ roomId, users[], createdAt, updatedAt }`
- User presence: `{ userId, socketId, joinedAt, metadata }`
- Pub/Sub for cross-instance message routing (Redis adapter)

### 4. Client SDK (`lib/realtime/`)
- `useRealtime(roomId)` hook
- `RealtimeClient` class for WebRTC connection management
- Automatic reconnection with exponential backoff
- Type-safe event emitters for each message type

### 5. TURN Configuration
Optional env vars (documented in `.env.example`):
```
TURN_URL=turn:turn.example.com:3478
TURN_USERNAME=turnuser
TURN_CREDENTIAL=turnpass
```
Fallbacks to STUN only if not configured.

---

## Data Flow

1. **Join Room**: Client connects to signaling server → server adds to Redis room → broadcasts `user-joined`
2. **WebRTC Negotiation**: Peer A creates offer → sends via signaling → Peer B answers → ICE candidates exchanged
3. **Data Channel Open**: On `open`, clients can send typed messages
4. **Message Broadcast**: Sender → data channel → receivers → React state updates
5. **Leave Room**: Cleanup WebRTC connections → remove from Redis → broadcast `user-left`

---

## Error Handling

- **Connection loss**: Auto-reconnect with exponential backoff (max 30s)
- **ICE failure**: Retry with TURN if configured, else notify user
- **Message validation**: Zod parse on receive; invalid messages logged & dropped
- **Room full**: Configurable max users per room (default 10)

---

## Testing Strategy

- Unit: Zod schemas, message serialization, Redis room ops
- Integration: Signaling server + 2 clients (WebRTC handshake)
- E2E: Playwright multi-browser test for cursor sync

---

## Open Questions (Resolved)

| Question | Decision |
|----------|----------|
| Signaling deployment | Standalone Node.js at `services/realtime/src/index.ts` |
| Data channel format | Single channel, typed messages, Zod validated |
| Session persistence | In-memory MVP, Redis-backed room state |
| TURN config | Optional env vars (`TURN_URL`, `TURN_USERNAME`, `TURN_CREDENTIAL`) |