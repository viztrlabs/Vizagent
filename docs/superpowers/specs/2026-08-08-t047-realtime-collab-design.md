# T-047 — Real-Time Collaboration

**Date:** 2026-08-08
**Status:** Approved design
**Task:** T-047 (Real-time collaboration: WebRTC signaling)

## Overview

Build collaboration UX on top of the existing T-035 signaling rooms (Redis-backed
peer tracking). Adds live presence, cursor sync, and in-room chat/annotations.

## New files

- lib/realtime/presence.ts — presence join/leave/heartbeat (Redis)
- lib/realtime/messages.ts — chat + annotation messages (Redis list)
- components/collab/PresenceBar.tsx — who's-online avatars panel
- components/collab/LiveCursors.tsx — overlay rendering peer cursors
- components/collab/CollabChat.tsx — in-room chat panel + input

## Depends on

- T-035 (Redis signaling: createRoom/addPeer/removePeer)