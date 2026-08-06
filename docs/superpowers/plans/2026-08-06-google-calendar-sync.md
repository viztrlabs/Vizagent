# Google Calendar Sync on Booking - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google Calendar integration so booking sessions automatically sync to the host's Google Calendar.

**Architecture:** Create a Google Calendar utility library and two API routes (bookings CRUD) that integrate with the existing ConfiguratorSession model. Calendar sync is optional — gracefully degrades when no access token is provided.

**Tech Stack:** googleapis, Next.js API routes, Prisma, next-auth (optional token)

## Global Constraints

- Follow existing code patterns: `@/lib/supabase/server` for Prisma, `NextRequest`/`NextResponse` from `next/server`
- Prisma uses camelCase fields (`projectId`, `hostId`, `isActive`, `gcalEventId`, `shareToken`, `startAt`)
- No comments unless requested
- TypeScript strict mode
- No auth system configured yet — calendar sync accepts optional `access_token` in request body

---

## File Structure

```
lib/google-calendar.ts          # Google Calendar API utilities
app/api/bookings/route.ts       # POST (create booking), GET (list bookings)
app/api/bookings/[id]/route.ts  # DELETE (cancel booking)
```

---

### Task 1: Create Google Calendar Utility Library

**Files:**
- Create: `lib/google-calendar.ts`

**Interfaces:**
- Consumes: googleapis package (already installed)
- Produces: `addSessionToCalendar(accessToken, session)`, `deleteSessionFromCalendar(accessToken, gcalEventId)`

- [ ] **Step 1: Create the Google Calendar utility file**

```typescript
import { google } from 'googleapis';

export async function addSessionToCalendar(
  accessToken: string,
  session: {
    id: string;
    service: string;
    date: string;
    durationMinutes: number;
    clientName: string;
    projectType: string;
  }
) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: 'v3', auth });

  const start = new Date(session.date);
  const end = new Date(start.getTime() + session.durationMinutes * 60000);

  const event = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: `VizTR — ${session.service}`,
      description: [
        `Project: ${session.projectType}`,
        `Client: ${session.clientName}`,
        `Session ID: ${session.id}`,
        ``,
        `Join your stream: https://viztr.io/xr`,
      ].join('\n'),
      start: { dateTime: start.toISOString(), timeZone: 'Asia/Kolkata' },
      end: { dateTime: end.toISOString(), timeZone: 'Asia/Kolkata' },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 },
          { method: 'email', minutes: 60 },
        ],
      },
      colorId: '9',
    },
  });

  return event.data.id;
}

export async function deleteSessionFromCalendar(
  accessToken: string,
  gcalEventId: string
) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: 'v3', auth });
  await calendar.events.delete({
    calendarId: 'primary',
    eventId: gcalEventId,
  });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm typecheck`
Expected: PASS (no errors in new file)

- [ ] **Step 3: Commit**

```bash
git add lib/google-calendar.ts
git commit -m "feat: add google calendar utility library"
```

---

### Task 2: Create Bookings API Route (POST + GET)

**Files:**
- Create: `app/api/bookings/route.ts`

**Interfaces:**
- Consumes: `prisma` from `@/lib/supabase/server`, `addSessionToCalendar` from `@/lib/google-calendar`
- Produces: POST creates session + optional calendar sync, GET lists sessions by email

- [ ] **Step 1: Create the bookings route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/supabase/server';
import { addSessionToCalendar } from '@/lib/google-calendar';
import { nanoid } from 'nanoid';

const SERVICE_NAMES: Record<string, string> = {
  tour: 'Virtual Tour',
  xr: 'XR Configurator',
  render: '3D Rendering',
};

const SERVICE_DURATIONS: Record<string, number> = {
  tour: 60,
  xr: 90,
  render: 120,
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    project_id,
    service,
    date,
    time,
    duration,
    client_name,
    email,
    project_type,
    access_token,
  } = body;

  const shareToken = nanoid(10);

  const session = await prisma.configuratorSession.create({
    data: {
      projectId: project_id,
      hostId: email || 'admin',
      config: '{}',
      shareToken,
      startAt: new Date(`${date}T${time}:00`),
    },
  });

  let gcalEventId = null;

  if (access_token) {
    try {
      gcalEventId = await addSessionToCalendar(access_token, {
        id: session.id,
        service: SERVICE_NAMES[service] || service,
        date: `${date}T${time}:00`,
        durationMinutes: duration || SERVICE_DURATIONS[service] || 60,
        clientName: client_name,
        projectType: project_type,
      });

      await prisma.configuratorSession.update({
        where: { id: session.id },
        data: { gcalEventId },
      });
    } catch (error) {
      console.error('Failed to add to Google Calendar:', error);
    }
  }

  return NextResponse.json(
    { session, gcal_event_id: gcalEventId, share_token: shareToken },
    { status: 201 }
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'email required' }, { status: 400 });
  }

  const sessions = await prisma.configuratorSession.findMany({
    where: { hostId: email },
    orderBy: { startAt: 'desc' },
  });

  return NextResponse.json({ sessions });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/api/bookings/route.ts
git commit -m "feat: add bookings API route with google calendar sync"
```

---

### Task 3: Create Bookings Delete Route

**Files:**
- Create: `app/api/bookings/[id]/route.ts`

**Interfaces:**
- Consumes: `prisma` from `@/lib/supabase/server`, `deleteSessionFromCalendar` from `@/lib/google-calendar`
- Produces: DELETE cancels session + removes from Google Calendar

- [ ] **Step 1: Create the bookings delete route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/supabase/server';
import { deleteSessionFromCalendar } from '@/lib/google-calendar';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const session = await prisma.configuratorSession.findUnique({
    where: { id },
  });

  if (!session) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const { access_token } = body as { access_token?: string };

  if (access_token && session.gcalEventId) {
    try {
      await deleteSessionFromCalendar(access_token, session.gcalEventId);
    } catch (error) {
      console.error('Failed to delete from Google Calendar:', error);
    }
  }

  await prisma.configuratorSession.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/api/bookings/\[id\]/route.ts
git commit -m "feat: add bookings delete route with calendar cleanup"
```

---

### Task 4: Verify and Final Commit

**Files:**
- None (verification only)

- [ ] **Step 1: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 2: Run lint**

Run: `pnpm lint`
Expected: PASS (or only pre-existing warnings)

- [ ] **Step 3: Verify files exist**

```bash
ls lib/google-calendar.ts
ls app/api/bookings/route.ts
ls app/api/bookings/[id]/route.ts
```

Expected: All three files exist

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add .
git commit -m "fix: google calendar sync final adjustments"
```

---

## Summary

| File | Purpose |
|------|---------|
| `lib/google-calendar.ts` | Google Calendar API wrapper (add/delete events) |
| `app/api/bookings/route.ts` | POST creates session + syncs calendar, GET lists sessions |
| `app/api/bookings/[id]/route.ts` | DELETE cancels session + removes from calendar |

**Key Design Decisions:**
1. Calendar sync is optional — works without `access_token` (session still created)
2. Uses camelCase Prisma fields to match existing schema
3. `nanoid` for share tokens (consistent with existing sessions route)
4. Graceful error handling — calendar failures don't break booking creation
5. Timezone hardcoded to `Asia/Kolkata` per VizTR brand
