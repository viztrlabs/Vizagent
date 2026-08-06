# Google Calendar Sync on Booking - Design Spec

## Overview
Add Google Calendar integration to the booking system so that when a configurator session is created, it automatically appears in the host's Google Calendar, and when cancelled, the event is removed.

## Components

### 1. `lib/google-calendar.ts`
- `addSessionToCalendar(accessToken, session)` - Creates a Google Calendar event
- `deleteSessionFromCalendar(accessToken, gcalEventId)` - Deletes a Google Calendar event

### 2. `app/api/bookings/route.ts`
- `POST` - Creates a configurator session and optionally syncs to Google Calendar
- `GET` - Lists sessions for a given email

### 3. `app/api/bookings/[id]/route.ts`
- `DELETE` - Cancels a session and removes from Google Calendar

## Adaptations Required

### Prisma Field Mapping
The ConfiguratorSession model uses camelCase in Prisma:
- `projectId` (not `project_id`)
- `hostId` (not `host_id`)
- `isActive` (not `is_active`)
- `gcalEventId` (not `gcal_event_id`)
- `shareToken` (not `share_token`)
- `startAt` (not `start_at`)

### Auth Handling
Since next-auth is not configured yet, the booking routes will:
1. Accept an optional `access_token` in the request body for calendar sync
2. Fall back gracefully if no token is provided (session created without calendar sync)

### Session Creation
The POST route will:
1. Validate input with Zod
2. Create the ConfiguratorSession with proper Prisma field names
3. If `access_token` is provided, attempt calendar sync
4. Store `gcalEventId` on the session if sync succeeds

## Testing Considerations
- Test booking creation without calendar token (should succeed)
- Test booking creation with invalid calendar token (should succeed, calendar sync fails gracefully)
- Test booking deletion
- Test GET endpoint with email filter
