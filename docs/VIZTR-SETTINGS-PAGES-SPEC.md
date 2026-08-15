# VIZTR — Settings Pages Specification

> **Version:** 1.0.0 · **Date:** 2026-08-05 · **Status:** Act Mode — UI Specification

---

## Table of Contents

1. [Overview](#1-overview)
2. [Settings Hub (`/settings`)](#2-settings-hub-settings)
3. [Profile Settings (`/settings/profile`)](#3-profile-settings-settingsprofile)
4. [Agency Settings (`/settings/agency`)](#4-agency-settings-settingsagency)
5. [White-label Branding (`/settings/branding`)](#5-white-label-branding-settingsbranding)
6. [Notification Preferences (`/settings/notifications`)](#6-notification-preferences-settingsnotifications)
7. [Integrations (`/settings/integrations`)](#7-integrations-settingsintegrations)
8. [Security Settings (`/settings/security`)](#8-security-settings-settingssecurity)
9. [Team Management (`/settings/team`)](#9-team-management-settingsteam)
10. [Client Portal Settings (`/settings` - Client)](#10-client-portal-settings-settings---client)
11. [Billing Settings (`/settings/billing` - Client)](#11-billing-settings-settingsbilling---client)
12. [Superadmin Settings (`/admin/settings`)](#12-superadmin-settings-adminsettings)
13. [Platform Settings (`/admin/platform`)](#13-platform-settings-adminplatform)
14. [Feature Flags (`/admin/platform/features`)](#14-feature-flags-adminplatformfeatures)

---

## 1. Overview

All settings pages follow a consistent layout pattern:

```tsx
export default function SettingsPage() {
  return (
    <SettingsLayout>
      <PageHeader title="Settings" breadcrumbs={[{ label: 'Dashboard' }, { label: 'Settings' }]} />
      <SettingsContent>
        {/* Page-specific content */}
      </SettingsContent>
    </SettingsLayout>
  )
}
```

### 1.1 Settings Layout Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│  Settings                                                      │
│─────────────────────────────────────────────────────────────────│
│  [Profile] [Agency] [Branding] [Notifications] [Integrations] │
│  [Security] [Team]                                             │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  (Tab content based on selected tab)                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Settings Hub (`/settings`)

### 2.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Settings                                                      │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Profile                    │  Account and personal info   │ │
│  │  Agency                     │  Agency configuration        │ │
│  │  Branding                   │  White-label customization   │ │
│  │  Notifications              │  Email and push preferences  │ │
│  │  Integrations               │  Connected services          │ │
│  │  Security                   │  Password and 2FA            │ │
│  │  Team                       │  Team member management      │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Settings Cards

| Card | Icon | Description | Link |
|------|------|-------------|------|
| Profile | `User` | Account and personal info | `/settings/profile` |
| Agency | `Building` | Agency configuration | `/settings/agency` |
| Branding | `Palette` | White-label customization | `/settings/branding` |
| Notifications | `Bell` | Email and push preferences | `/settings/notifications` |
| Integrations | `Plug` | Connected services | `/settings/integrations` |
| Security | `Shield` | Password and 2FA | `/settings/security` |
| Team | `Users` | Team member management | `/settings/team` |

---

## 3. Profile Settings (`/settings/profile`)

### 3.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Profile Settings                                              │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Avatar                                                   │ │
│  │  ┌──────────┐                                             │ │
│  │  │          │  [Change Avatar]  [Remove]                  │ │
│  │  │    JD    │                                             │ │
│  │  │          │                                             │ │
│  │  └──────────┘                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Personal Information                                     │ │
│  │                                                           │ │
│  │  Full Name:    [John Doe________________]                 │ │
│  │  Email:        [john@archvizstudio.com__]                 │ │
│  │  Phone:        [+1 555-123-4567________]                  │ │
│  │  Job Title:    [Senior Architect________]                 │ │
│  │  Company:      [ArchViz Studio_________]                  │ │
│  │  Website:      [https://archvizstudio.com_]               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Bio                                                      │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │ Senior architect with 10+ years of experience in    │  │ │
│  │  │ residential and commercial design...                 │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                              [Cancel]  [Save Changes]          │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Avatar | File upload | No | Max 5MB, JPG/PNG |
| Full Name | Text input | Yes | Max 100 chars |
| Email | Email input | Yes | Valid email |
| Phone | Phone input | No | E.164 format |
| Job Title | Text input | No | Max 100 chars |
| Company | Text input | No | Max 100 chars |
| Website | URL input | No | Valid URL |
| Bio | Textarea | No | Max 500 chars |

---

## 4. Agency Settings (`/settings/agency`)

### 4.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Agency Settings                                               │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Agency Information                                       │ │
│  │                                                           │ │
│  │  Agency Name:    [ArchViz Studio_________]                │ │
│  │  Tagline:        [Visualizing Architecture___]            │ │
│  │  Email:          [info@archvizstudio.com_]                │ │
│  │  Phone:          [+1 555-987-6543________]                │ │
│  │  Website:        [https://archvizstudio.com_]             │ │
│  │                                                           │ │
│  │  Address:                                               │ │
│  │  Street:         [123 Design Lane_________]              │ │
│  │  City:           [New York_______________]               │ │
│  │  State:          [NY_____________________]               │ │
│  │  ZIP:            [10001_________________]                 │ │
│  │  Country:        [United States__________]               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Business Details                                         │ │
│  │                                                           │ │
│  │  Business Type:  [Architectural Visualization Studio ▾]  │ │
│  │  Founded:        [2018_____________]                      │ │
│  │  Team Size:      [10-25 employees ▾]                     │ │
│  │  Tax ID:         [12-3456789_________]                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                              [Cancel]  [Save Changes]          │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Agency Name | Text input | Yes | Max 100 chars |
| Tagline | Text input | No | Max 200 chars |
| Email | Email input | Yes | Valid email |
| Phone | Phone input | Yes | E.164 format |
| Website | URL input | No | Valid URL |
| Street | Text input | Yes | Max 200 chars |
| City | Text input | Yes | Max 100 chars |
| State | Text input | Yes | Max 100 chars |
| ZIP | Text input | Yes | Max 20 chars |
| Country | Select | Yes | Country list |
| Business Type | Select | Yes | Business type options |
| Founded | Year picker | No | Valid year |
| Team Size | Select | No | Size ranges |
| Tax ID | Text input | No | Max 50 chars |

---

## 5. White-label Branding (`/settings/branding`)

### 5.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Branding Settings                                             │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Logo & Brand Assets                                      │ │
│  │                                                           │ │
│  │  Light Mode Logo:                                         │ │
│  │  ┌──────────────────────────────────────────────────┐     │ │
│  │  │  [Upload Logo - Light Mode]                      │     │ │
│  │  └──────────────────────────────────────────────────┘     │ │
│  │                                                           │ │
│  │  Dark Mode Logo:                                          │ │
│  │  ┌──────────────────────────────────────────────────┐     │ │
│  │  │  [Upload Logo - Dark Mode]                       │     │ │
│  │  └──────────────────────────────────────────────────┘     │ │
│  │                                                           │ │
│  │  Favicon:                                                 │ │
│  │  ┌──────────────────────────────────────────────────┐     │ │
│  │  │  [Upload Favicon]                                │     │ │
│  │  │  Recommended: 32x32 or 192x192 PNG              │     │ │
│  │  └──────────────────────────────────────────────────┘     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Color Palette                                            │ │
│  │                                                           │ │
│  │  Primary Color:    [#3B82F6] 🎨                           │ │
│  │  Secondary Color:  [#10B981] 🎨                           │ │
│  │  Accent Color:     [#F59E0B] 🎨                           │ │
│  │  Background Color: [#FFFFFF] 🎨                           │ │
│  │  Text Color:       [#1E293B] 🎨                           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Typography                                               │ │
│  │                                                           │ │
│  │  Heading Font:  [Inter ▾]                                 │ │
│  │  Body Font:     [Inter ▾]                                 │ │
│  │  Base Font Size: [16px ▾]                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Preview                                                 │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Live preview of branding changes                   │  │ │
│  │  │  Shows: Logo, colors, typography in action          │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                              [Reset to Default] [Save Changes] │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Branding Options

| Section | Option | Type | Description |
|---------|--------|------|-------------|
| Logo | Light mode logo | File upload | Logo for light backgrounds |
| Logo | Dark mode logo | File upload | Logo for dark backgrounds |
| Logo | Favicon | File upload | Browser tab icon |
| Colors | Primary color | Color picker | Main brand color |
| Colors | Secondary color | Color picker | Secondary brand color |
| Colors | Accent color | Color picker | Highlight color |
| Colors | Background color | Color picker | Page background |
| Colors | Text color | Color picker | Main text color |
| Typography | Heading font | Font selector | Headings font family |
| Typography | Body font | Font selector | Body text font family |
| Typography | Base font size | Size selector | Base font size |

### 5.3 Color Picker Component

```tsx
interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  presets?: string[]
  allowCustom?: boolean
}

// Default presets
const defaultPresets = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
]
```

### 5.4 Font Options

| Category | Fonts |
|----------|-------|
| Sans-serif | Inter, Roboto, Open Sans, Lato, Montserrat, Source Sans Pro |
| Serif | Playfair Display, Merriweather, Lora, PT Serif |
| Display | Poppins, Raleway, Oswald, Bebas Neue |
| Monospace | JetBrains Mono, Fira Code, Source Code Pro |

---

## 6. Notification Preferences (`/settings/notifications`)

### 6.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Notification Preferences                                      │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Email Notifications                                     │ │
│  │                                                           │ │
│  │  Project Updates          [██████████] ON                 │ │
│  │  New Comments             [██████████] ON                 │ │
│  │  Invoice Payments         [██████████] ON                 │ │
│  │  Booking Reminders        [██████████] ON                 │ │
│  │  AI Render Complete       [██████████] ON                 │ │
│  │  Marketing Emails         [          ] OFF                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Push Notifications (Mobile)                             │ │
│  │                                                           │ │
│  │  Project Updates          [          ] OFF                │ │
│  │  New Messages             [██████████] ON                 │ │
│  │  Invoice Payments         [██████████] ON                 │ │
│  │  Booking Reminders        [██████████] ON                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  In-App Notifications                                    │ │
│  │                                                           │ │
│  │  Show Banners             [██████████] ON                 │ │
│  │  Show Toasts              [██████████] ON                 │ │
│  │  Sound Alerts             [          ] OFF                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Quiet Hours                                             │ │
│  │                                                           │ │
│  │  Enable Quiet Hours        [██████████] ON                │ │
│  │  Start Time:  [10:00 PM ▾]                                │ │
│  │  End Time:    [7:00 AM ▾]                                 │ │
│  │  Timezone:    [America/New_York ▾]                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                              [Cancel]  [Save Preferences]      │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Notification Types

| Category | Notification | Email | Push | In-App |
|----------|--------------|-------|------|--------|
| Projects | Project created | ✓ | ✓ | ✓ |
| Projects | Project status changed | ✓ | ✓ | ✓ |
| Projects | New comment | ✓ | ✓ | ✓ |
| Projects | File uploaded | ✓ | ✓ | ✓ |
| Billing | Invoice created | ✓ | ✓ | ✓ |
| Billing | Payment received | ✓ | ✓ | ✓ |
| Billing | Payment failed | ✓ | ✓ | ✓ |
| Bookings | Booking created | ✓ | ✓ | ✓ |
| Bookings | Booking reminder | ✓ | ✓ | ✓ |
| Bookings | Booking cancelled | ✓ | ✓ | ✓ |
| AI | Render complete | ✓ | ✓ | ✓ |
| AI | AI error | ✓ | ✓ | ✓ |
| Messages | New message | ✓ | ✓ | ✓ |
| Marketing | Newsletter | ✓ | ✗ | ✗ |
| Marketing | Product updates | ✓ | ✗ | ✗ |

---

## 7. Integrations (`/settings/integrations`)

### 7.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Integrations                                                  │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Connected Services                                       │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  📧 Google Workspace        [Connected ✓]  [Disconnect]│  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  💳 Stripe                  [Connected ✓]  [Disconnect]│  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  📱 Twilio                  [Not Connected] [Connect] │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Available Integrations                                   │ │
│  │                                                           │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │ │
│  │  │  🔵 Slack    │  │  📊 HubSpot │  │  📋 Jira     │       │ │
│  │  │  Connect    │  │  Connect    │  │  Connect    │       │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘       │ │
│  │                                                           │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │ │
│  │  │  📧 Mailchimp│  │  📱 WhatsApp │  │  🎥 Zoom     │       │ │
│  │  │  Connect    │  │  Connect    │  │  Connect    │       │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Webhooks                                                 │ │
│  │                                                           │ │
│  │  Active Webhooks: 3                                      │ │
│  │  [Manage Webhooks →]                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Integration Card States

| State | Visual | Action |
|-------|--------|--------|
| Connected | Green badge + "Connected ✓" | Disconnect button |
| Not Connected | Gray badge + "Not Connected" | Connect button |
| Error | Red badge + "Error" | Reconnect button |
| Loading | Spinner | Disabled state |

---

## 8. Security Settings (`/settings/security`)

### 8.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Security Settings                                             │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Change Password                                          │ │
│  │                                                           │ │
│  │  Current Password:  [________________]                    │ │
│  │  New Password:      [________________]                    │ │
│  │  Confirm Password:  [________________]                    │ │
│  │                                                           │ │
│  │  Password Strength: ████████████ Strong                   │ │
│  │                                                           │ │
│  │                              [Update Password]            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Two-Factor Authentication (2FA)                          │ │
│  │                                                           │ │
│  │  Status: [██████████] Enabled                             │ │
│  │                                                           │ │
│  │  If enabled, you'll need to enter a code from your       │ │
│  │  authenticator app when signing in.                       │ │
│  │                                                           │ │
│  │  [Setup 2FA]  [View Recovery Codes]  [Disable 2FA]       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Active Sessions                                          │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  🖥️ MacBook Pro - Chrome       Current session      │  │ │
│  │  │  📱 iPhone 15 - Safari         2h ago               │  │ │
│  │  │  🖥️ Windows PC - Edge          1d ago               │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                           │ │
│  │  [Revoke All Other Sessions]                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Login History                                            │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  ✅ Successful │ MacBook Pro - Chrome │ 2h ago      │  │ │
│  │  │  ✅ Successful │ iPhone 15 - Safari   │ 3h ago      │  │ │
│  │  │  ❌ Failed     │ Unknown - Firefox    │ 1d ago      │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                           │ │
│  │  [View Full History]                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Security Features

| Feature | Description |
|---------|-------------|
| Password Change | Update account password |
| 2FA Setup | Enable/disable two-factor auth |
| Recovery Codes | Generate backup codes for 2FA |
| Active Sessions | View and revoke active sessions |
| Login History | View recent login attempts |

---

## 9. Team Management (`/settings/team`)

### 9.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Team Management                              [+ Invite Member] │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Team Members (5)                                         │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  👤 John Doe          john@archvizstudio.com         │  │ │
│  │  │     Admin                   Joined 2026-01-15        │  │ │
│  │  │     [Edit Role]  [Remove]                            │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  👤 Jane Smith        jane@archvizstudio.com         │  │ │
│  │  │     Editor                  Joined 2026-03-20        │  │ │
│  │  │     [Edit Role]  [Remove]                            │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  👤 Bob Wilson         bob@archvizstudio.com         │  │ │
│  │  │     Viewer                  Joined 2026-06-01        │  │ │
│  │  │     [Edit Role]  [Remove]                            │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Pending Invites (2)                                      │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  📧 alice@example.com     Editor     Sent 2d ago    │  │ │
│  │  │     [Resend Invite]  [Cancel Invite]                 │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Invite Member Modal

```
┌─────────────────────────────────────────────────────────────────┐
│  Invite Team Member                                      [×]   │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  Email Address:    [________________]                          │
│  Role:             [Editor ▾]                                   │
│  Message (optional): [________________]                        │
│                                                                 │
│  Role Descriptions:                                             │
│  • Admin: Full access to all settings and projects             │
│  • Editor: Can edit projects and upload files                  │
│  • Viewer: Can view projects and download files                │
│                                                                 │
│                              [Cancel]  [Send Invite]           │
└─────────────────────────────────────────────────────────────────┘
```

### 9.3 Role Permissions

| Permission | Admin | Editor | Viewer |
|------------|-------|--------|--------|
| Manage billing | ✓ | ✗ | ✗ |
| Manage team | ✓ | ✗ | ✗ |
| Agency settings | ✓ | ✗ | ✗ |
| Create projects | ✓ | ✓ | ✗ |
| Edit projects | ✓ | ✓ | ✗ |
| Delete projects | ✓ | ✗ | ✗ |
| Upload files | ✓ | ✓ | ✗ |
| Delete files | ✓ | ✓ | ✗ |
| View projects | ✓ | ✓ | ✓ |
| Download files | ✓ | ✓ | ✓ |
| Send messages | ✓ | ✓ | ✓ |
| View invoices | ✓ | ✓ | ✓ |

---

## 10. Client Portal Settings (`/settings` - Client)

### 10.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Profile Settings                                              │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Personal Information                                     │ │
│  │                                                           │ │
│  │  Full Name:    [Jane Doe_______________]                  │ │
│  │  Email:        [jane@abccorp.com________]                 │ │
│  │  Phone:        [+1 555-111-2222________]                  │ │
│  │  Company:      [ABC Corp_______________]                  │ │
│  │  Job Title:    [Project Manager________]                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                              [Cancel]  [Save Changes]          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. Billing Settings (`/settings/billing` - Client)

### 11.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Billing Settings                                              │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Current Plan                                             │ │
│  │                                                           │ │
│  │  Plan: Pro                        $49/month              │ │
│  │  Status: Active                                           │ │
│  │  Renews: August 15, 2026                                  │ │
│  │                                                           │ │
│  │  [Upgrade Plan]  [Cancel Subscription]                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Payment Method                                           │ │
│  │                                                           │ │
│  │  💳 •••• •••• •••• 4242              Expires 12/2027    │ │
│  │                                                           │ │
│  │  [Update Payment Method]                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Billing History                                          │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Aug 15, 2026  │ Pro Plan      │ $49.00  │ Paid    │  │ │
│  │  │  Jul 15, 2026  │ Pro Plan      │ $49.00  │ Paid    │  │ │
│  │  │  Jun 15, 2026  │ Pro Plan      │ $49.00  │ Paid    │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 12. Superadmin Settings (`/admin/settings`)

### 12.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Superadmin Settings                              🔧 Superadmin │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Platform Configuration                                   │ │
│  │                                                           │ │
│  │  Platform Name:    [VizTR_______________]                 │ │
│  │  Support Email:    [support@viztr.io____]                 │ │
│  │  Default Language: [English_____________]                 │ │
│  │  Timezone:         [UTC_________________]                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Email Templates                                          │ │
│  │                                                           │ │
│  │  [Edit Welcome Email]  [Edit Password Reset]              │ │
│  │  [Edit Invoice Email]  [Edit Booking Confirmation]        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Maintenance Mode                                         │ │
│  │                                                           │ │
│  │  Status: [          ] OFF                                 │ │
│  │  Message: [________________]                              │ │
│  │                                                           │ │
│  │  [Enable Maintenance Mode]                                │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 13. Platform Settings (`/admin/platform`)

### 13.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Platform Settings                             🔧 Superadmin   │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Global Settings                                          │ │
│  │                                                           │ │
│  │  Default Agency Plan:    [Pro ▾]                          │ │
│  │  Max Projects per Agency: [50_____]                       │ │
│  │  Max Storage per Agency:  [100 GB____]                    │ │
│  │  AI Credits per Month:    [10000____]                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Rate Limiting                                            │ │
│  │                                                           │ │
│  │  API Rate Limit:       [1000 requests/hour_]              │ │
│  │  AI Rate Limit:        [100 requests/hour___]             │ │
│  │  Upload Rate Limit:    [50 uploads/hour____]              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Storage Configuration                                    │ │
│  │                                                           │ │
│  │  Provider:            [AWS S3 ▾]                          │ │
│  │  Bucket:              [viztr-production__]                │ │
│  │  Region:              [us-east-1________]                 │ │
│  │  CDN Domain:          [cdn.viztr.io_____]                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 14. Feature Flags (`/admin/platform/features`)

### 14.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Feature Flags                               🔧 Superadmin     │
│─────────────────────────────────────────────────────────────────│
│  [All] [Enabled] [Disabled]                                   │
│─────────────────────────────────────────────────────────────────│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  AI Features                                              │ │
│  │                                                           │ │
│  │  AI Rendering          [██████████] ON                   │ │
│  │  Prompt Studio         [██████████] ON                   │ │
│  │  LLM Router            [██████████] ON                   │ │
│  │  AI Analytics          [          ] OFF                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  XR Features                                              │ │
│  │                                                           │ │
│  │  Token Viewer          [██████████] ON                   │ │
│  │  WebAR                 [██████████] ON                   │ │
│  │  VR Support            [          ] OFF                  │ │
│  │  Panorama Viewer       [██████████] ON                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Platform Features                                        │ │
│  │                                                           │ │
│  │  White-labeling       [██████████] ON                   │ │
│  │  Multi-tenancy        [██████████] ON                   │ │
│  │  Developer Portal     [          ] OFF                  │ │
│  │  Beta Features        [          ] OFF                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Create New Feature Flag                                 │ │
│  │                                                           │ │
│  │  Name:         [________________]                         │ │
│  │  Description:  [________________]                         │ │
│  │  Enabled:      [          ] OFF                           │ │
│  │                                                           │ │
│  │  [Create Flag]                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 14.2 Feature Flag Structure

```tsx
interface FeatureFlag {
  id: string
  name: string
  description: string
  enabled: boolean
  category: 'ai' | 'xr' | 'platform' | 'billing'
  createdAt: string
  updatedAt: string
}
```

---

## Appendix: Settings Components

### A.1 SettingsCard Component

```tsx
interface SettingsCardProps {
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
}
```

### A.2 Toggle Component

```tsx
interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
}
```

### A.3 ColorPicker Component

```tsx
interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  presets?: string[]
  allowCustom?: boolean
}
```

### A.4 FileUpload Component

```tsx
interface FileUploadProps {
  accept?: string[]
  maxSize?: number
  onUpload: (file: File) => void
  currentPreview?: string
}
```

---

**End of VIZTR-SETTINGS-PAGES-SPEC.md**
