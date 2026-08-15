# VIZTR — Auth Flows & Error Pages Specification

> **Version:** 1.0.0 · **Date:** 2026-08-05 · **Status:** Act Mode — UI Specification

---

## Table of Contents

1. [Overview](#1-overview)
2. [Admin Login (`/login`)](#2-admin-login-login)
3. [Agency Registration (`/register`)](#3-agency-registration-register)
4. [Client Login (`/login` - Client Portal)](#4-client-login-login---client-portal)
5. [Magic Link Auth (`/magic-link`)](#5-magic-link-auth-magic-link)
6. [Password Reset Flow](#6-password-reset-flow)
7. [Email Verification Flow](#7-email-verification-flow)
8. [Logout Flow](#8-logout-flow)
9. [Session Management](#9-session-management)
10. [Error Pages](#10-error-pages)
11. [Legal Pages](#11-legal-pages)
12. [Cookie Consent](#12-cookie-consent)
13. [Auth State Management](#13-auth-state-management)

---

## 1. Overview

VizTR uses **Supabase Auth** for authentication with role-based access control:

| Role | Auth Method | Redirect Path |
|------|-------------|---------------|
| Superadmin | Email + Password + 2FA | `/admin` |
| Admin | Email + Password | `/dashboard` |
| Editor | Email + Password | `/dashboard` |
| Viewer | Email + Password | `/dashboard` |
| Client | Email + Magic Link | `/client/dashboard` |

### 1.1 Auth Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Auth Flow                               │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  User ──→ Login Page ──→ Authenticate ──→ Check Role           │
│                                   │              │              │
│                                   │              ▼              │
│                                   │    ┌─────────────────┐     │
│                                   │    │ Superadmin       │     │
│                                   │    │ → /admin         │     │
│                                   │    ├─────────────────┤     │
│                                   │    │ Admin/Editor     │     │
│                                   │    │ → /dashboard     │     │
│                                   │    ├─────────────────┤     │
│                                   │    │ Client           │     │
│                                   │    │ → /client        │     │
│                                   │    └─────────────────┘     │
│                                   │              │              │
│                                   ▼              ▼              │
│                              ┌─────────────────────────┐       │
│                              │   Dashboard Layout      │       │
│                              │   (Sidebar + Content)   │       │
│                              └─────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Admin Login (`/login`)

### 2.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│         ┌─────────────────────────────────────────┐            │
│         │            VizTR Logo                   │            │
│         │                                         │            │
│         │    Sign in to your account              │            │
│         │                                         │            │
│         │    Email: [________________]            │            │
│         │                                         │            │
│         │    Password: [________________]         │            │
│         │                                         │            │
│         │    ☐ Remember me                        │            │
│         │                                         │            │
│         │    [Sign In]                            │            │
│         │                                         │            │
│         │    Forgot password? [Reset]             │            │
│         │                                         │            │
│         │    Don't have an account? [Register]    │            │
│         │                                         │            │
│         └─────────────────────────────────────────┘            │
│                                                                 │
│         Or continue with:                                       │
│         [Google]  [GitHub]  [Microsoft]                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Form Validation

| Field | Validation | Error Message |
|-------|------------|---------------|
| Email | Required, valid email | "Please enter a valid email address" |
| Password | Required, min 8 chars | "Password must be at least 8 characters" |

### 2.3 Error States

| Error | Message | Action |
|-------|---------|--------|
| Invalid credentials | "Invalid email or password" | Show error message |
| Account locked | "Account temporarily locked. Try again in 15 minutes." | Disable form |
| Email not verified | "Please verify your email address." | Resend verification |
| Too many attempts | "Too many login attempts. Please try again later." | Rate limit |

### 2.4 Success Flow

```tsx
// After successful login
const handleLogin = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    setError(error.message)
    return
  }

  // Get user role
  const role = await getUserRole(data.user.id)
  
  // Redirect based on role
  switch (role) {
    case 'SUPERADMIN':
      router.push('/admin')
      break
    case 'ADMIN':
    case 'EDITOR':
    case 'VIEWER':
      router.push('/dashboard')
      break
    default:
      router.push('/dashboard')
  }
}
```

---

## 3. Agency Registration (`/register`)

### 3.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│         ┌─────────────────────────────────────────┐            │
│         │            VizTR Logo                   │            │
│         │                                         │            │
│         │    Create your agency account           │            │
│         │                                         │            │
│         │    Agency Name: [________________]      │            │
│         │                                         │            │
│         │    Your Name: [________________]        │            │
│         │                                         │            │
│         │    Email: [________________]            │            │
│         │                                         │            │
│         │    Password: [________________]         │            │
│         │                                         │            │
│         │    Confirm Password: [________________] │            │
│         │                                         │            │
│         │    ☐ I agree to Terms of Service        │            │
│         │       and Privacy Policy                │            │
│         │                                         │            │
│         │    [Create Account]                     │            │
│         │                                         │            │
│         │    Already have an account? [Sign In]   │            │
│         │                                         │            │
│         └─────────────────────────────────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Form Validation

| Field | Validation | Error Message |
|-------|------------|---------------|
| Agency Name | Required, min 2 chars | "Agency name must be at least 2 characters" |
| Your Name | Required, min 2 chars | "Name must be at least 2 characters" |
| Email | Required, valid email, unique | "Please enter a valid email address" |
| Password | Required, min 8 chars, strong | "Password must be at least 8 characters" |
| Confirm Password | Must match password | "Passwords do not match" |
| Terms | Required checkbox | "You must agree to the Terms of Service" |

### 3.3 Password Strength Indicator

```
┌─────────────────────────────────────────────────────────────────┐
│  Password Strength                                            │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  ████████████████████████████░░░░░░░░░░  Strong               │
│                                                                 │
│  Requirements:                                                  │
│  ✅ At least 8 characters                                     │
│  ✅ Contains uppercase letter                                 │
│  ✅ Contains lowercase letter                                 │
│  ✅ Contains number                                           │
│  ❌ Contains special character                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.4 Success Flow

```tsx
const handleRegister = async (formData: RegisterFormData) => {
  // 1. Create user
  const { data: userData, error: userError } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password
  })

  if (userError) {
    setError(userError.message)
    return
  }

  // 2. Create agency
  const { error: agencyError } = await supabase
    .from('agencies')
    .insert({
      name: formData.agencyName,
      ownerId: userData.user.id
    })

  // 3. Create user profile
  await supabase
    .from('users')
    .insert({
      id: userData.user.id,
      email: formData.email,
      name: formData.yourName,
      role: 'ADMIN'
    })

  // 4. Send verification email
  await sendVerificationEmail(formData.email)

  // 5. Redirect to verification page
  router.push('/verify-email')
}
```

---

## 4. Client Login (`/login` - Client Portal)

### 4.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│         ┌─────────────────────────────────────────┐            │
│         │         [Agency Logo]                   │            │
│         │                                         │            │
│         │    Sign in to your portal               │            │
│         │                                         │            │
│         │    Email: [________________]            │            │
│         │                                         │            │
│         │    [Send Magic Link]                    │            │
│         │                                         │            │
│         │    ─────────── OR ───────────          │            │
│         │                                         │            │
│         │    Password: [________________]         │            │
│         │                                         │            │
│         │    [Sign In]                            │            │
│         │                                         │            │
│         │    Forgot password? [Reset]             │            │
│         │                                         │            │
│         └─────────────────────────────────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Magic Link Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  Magic Link Sent                                               │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│         ┌─────────────────────────────────────────┐            │
│         │            📧                           │            │
│         │                                         │            │
│         │    Check your email                     │            │
│         │                                         │            │
│         │    We've sent a magic link to           │            │
│         │    jane@abccorp.com                     │            │
│         │                                         │            │
│         │    Click the link in the email to       │            │
│         │    sign in to your account.             │            │
│         │                                         │            │
│         │    [Resend Email]  [Use Different Email]│            │
│         │                                         │            │
│         └─────────────────────────────────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Magic Link Auth (`/magic-link`)

### 5.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│         ┌─────────────────────────────────────────┐            │
│         │            🔐                           │            │
│         │                                         │            │
│         │    Verifying your magic link...         │            │
│         │                                         │            │
│         │    Please wait while we sign you in.    │            │
│         │                                         │            │
│         └─────────────────────────────────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Error State

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│         ┌─────────────────────────────────────────┐            │
│         │            ❌                           │            │
│         │                                         │            │
│         │    Invalid or expired magic link        │            │
│         │                                         │            │
│         │    This link may have already been      │            │
│         │    used or has expired.                 │            │
│         │                                         │            │
│         │    [Request New Link]  [Back to Login]  │            │
│         │                                         │            │
│         └─────────────────────────────────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Password Reset Flow

### 6.1 Request Reset Page

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│         ┌─────────────────────────────────────────┐            │
│         │            🔑                           │            │
│         │                                         │            │
│         │    Reset your password                  │            │
│         │                                         │            │
│         │    Enter your email address and we'll   │            │
│         │    send you a link to reset your        │            │
│         │    password.                            │            │
│         │                                         │            │
│         │    Email: [________________]            │            │
│         │                                         │            │
│         │    [Send Reset Link]                    │            │
│         │                                         │            │
│         │    [Back to Login]                      │            │
│         │                                         │            │
│         └─────────────────────────────────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Reset Email Sent Page

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│         ┌─────────────────────────────────────────┐            │
│         │            📧                           │            │
│         │                                         │            │
│         │    Check your email                     │            │
│         │                                         │            │
│         │    We've sent a password reset link to  │            │
│         │    john@archvizstudio.com               │            │
│         │                                         │            │
│         │    The link will expire in 1 hour.      │            │
│         │                                         │            │
│         │    [Resend Email]  [Back to Login]      │            │
│         │                                         │            │
│         └─────────────────────────────────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 New Password Page

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│         ┌─────────────────────────────────────────┐            │
│         │            🔐                           │            │
│         │                                         │            │
│         │    Set new password                     │            │
│         │                                         │            │
│         │    New Password: [________________]     │            │
│         │                                         │            │
│         │    Confirm Password: [________________] │            │
│         │                                         │            │
│         │    [Reset Password]                     │            │
│         │                                         │            │
│         └─────────────────────────────────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.4 Success Page

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│         ┌─────────────────────────────────────────┐            │
│         │            ✅                           │            │
│         │                                         │            │
│         │    Password reset successful            │            │
│         │                                         │            │
│         │    Your password has been updated.      │            │
│         │    You can now sign in with your new    │            │
│         │    password.                            │            │
│         │                                         │            │
│         │    [Sign In]                            │            │
│         │                                         │            │
│         └─────────────────────────────────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Email Verification Flow

### 7.1 Verification Page

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│         ┌─────────────────────────────────────────┐            │
│         │            📧                           │            │
│         │                                         │            │
│         │    Verify your email address            │            │
│         │                                         │            │
│         │    We've sent a verification link to    │            │
│         │    john@archvizstudio.com               │            │
│         │                                         │            │
│         │    Click the link in the email to       │            │
│         │    verify your account.                 │            │
│         │                                         │            │
│         │    [Resend Email]  [Change Email]       │            │
│         │                                         │            │
│         └─────────────────────────────────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Verification Success

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│         ┌─────────────────────────────────────────┐            │
│         │            ✅                           │            │
│         │                                         │            │
│         │    Email verified successfully          │            │
│         │                                         │            │
│         │    Your email has been verified.        │            │
│         │    You can now access all features.     │            │
│         │                                         │            │
│         │    [Continue to Dashboard]              │            │
│         │                                         │            │
│         └─────────────────────────────────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Logout Flow

### 8.1 Logout Confirmation Modal

```
┌─────────────────────────────────────────────────────────────────┐
│  Sign Out                                                [×]   │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  Are you sure you want to sign out?                            │
│                                                                 │
│  You will need to sign in again to access your account.        │
│                                                                 │
│                              [Cancel]  [Sign Out]              │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Logout Success

```tsx
const handleLogout = async () => {
  await supabase.auth.signOut()
  router.push('/login')
}
```

---

## 9. Session Management

### 9.1 Session Timeout

```
┌─────────────────────────────────────────────────────────────────┐
│  Session Expiring Soon                                          │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  Your session will expire in 5 minutes.                        │
│                                                                 │
│  [Stay Signed In]  [Sign Out]                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Multiple Sessions

```
┌─────────────────────────────────────────────────────────────────┐
│  Active Sessions                                               │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  🖥️ MacBook Pro - Chrome       Current session            │ │
│  │  📱 iPhone 15 - Safari         2h ago                     │ │
│  │  🖥️ Windows PC - Edge          1d ago                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  [Sign Out All Other Sessions]                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Error Pages

### 10.1 404 Not Found

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│         ┌─────────────────────────────────────────┐            │
│         │            404                          │            │
│         │                                         │            │
│         │    Page not found                       │            │
│         │                                         │            │
│         │    The page you're looking for doesn't  │            │
│         │    exist or has been moved.             │            │
│         │                                         │            │
│         │    [Go Home]  [Contact Support]         │            │
│         │                                         │            │
│         └─────────────────────────────────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 500 Internal Server Error

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│         ┌─────────────────────────────────────────┐            │
│         │            500                          │            │
│         │                                         │            │
│         │    Something went wrong                 │            │
│         │                                         │            │
│         │    We're experiencing technical         │            │
│         │    difficulties. Please try again       │            │
│         │    later.                               │            │
│         │                                         │            │
│         │    [Try Again]  [Contact Support]       │            │
│         │                                         │            │
│         └─────────────────────────────────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 10.3 403 Forbidden

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│         ┌─────────────────────────────────────────┐            │
│         │            403                          │            │
│         │                                         │            │
│         │    Access denied                        │            │
│         │                                         │            │
│         │    You don't have permission to access  │            │
│         │    this page.                           │            │
│         │                                         │            │
│         │    [Go Home]  [Contact Support]         │            │
│         │                                         │            │
│         └─────────────────────────────────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 10.4 429 Rate Limited

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│         ┌─────────────────────────────────────────┐            │
│         │            429                          │            │
│         │                                         │            │
│         │    Too many requests                    │            │
│         │                                         │            │
│         │    You've made too many requests.       │            │
│         │    Please wait a moment before trying   │            │
│         │    again.                               │            │
│         │                                         │            │
│         │    [Try Again in 30s]                   │            │
│         │                                         │            │
│         └─────────────────────────────────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. Legal Pages

### 11.1 Privacy Policy (`/legal/privacy`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Privacy Policy                                                 │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  Last Updated: August 5, 2026                                  │
│                                                                 │
│  ## Introduction                                                │
│                                                                 │
│  VizTR ("we," "our," or "us") is committed to protecting your  │
│  privacy. This Privacy Policy explains how we collect, use,    │
│  and share information about you when you use our platform.    │
│                                                                 │
│  ## Information We Collect                                     │
│                                                                 │
│  ### Personal Information                                      │
│  • Name and email address                                      │
│  • Payment information                                         │
│  • Profile information                                         │
│                                                                 │
│  ### Usage Information                                         │
│  • How you use the platform                                    │
│  • Device information                                          │
│  • Log data                                                   │
│                                                                 │
│  ## How We Use Your Information                               │
│                                                                 │
│  We use the information we collect to:                         │
│  • Provide and improve our services                            │
│  • Process transactions                                        │
│  • Send communications                                         │
│  • Ensure security                                            │
│                                                                 │
│  [Continue reading... →]                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 11.2 Terms of Service (`/legal/terms`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Terms of Service                                               │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  Last Updated: August 5, 2026                                  │
│                                                                 │
│  ## Agreement to Terms                                         │
│                                                                 │
│  By accessing or using VizTR, you agree to be bound by these  │
│  Terms of Service.                                             │
│                                                                 │
│  ## Use of Services                                            │
│                                                                 │
│  You may use our services only for lawful purposes and in     │
│  accordance with these Terms.                                  │
│                                                                 │
│  ## User Accounts                                              │
│                                                                 │
│  You are responsible for maintaining the confidentiality of   │
│  your account credentials.                                     │
│                                                                 │
│  [Continue reading... →]                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 11.3 Cookie Policy (`/legal/cookie`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Cookie Policy                                                  │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  Last Updated: August 5, 2026                                  │
│                                                                 │
│  ## What Are Cookies                                           │
│                                                                 │
│  Cookies are small text files stored on your device when you   │
│  visit our website.                                            │
│                                                                 │
│  ## How We Use Cookies                                        │
│                                                                 │
│  We use cookies to:                                            │
│  • Remember your preferences                                   │
│  • Analyze website traffic                                     │
│  • Provide personalized content                                │
│                                                                 │
│  ## Types of Cookies                                           │
│                                                                 │
│  ### Essential Cookies                                         │
│  Required for the website to function properly.               │
│                                                                 │
│  ### Analytics Cookies                                         │
│  Help us understand how visitors interact with our website.   │
│                                                                 │
│  ### Marketing Cookies                                         │
│  Used to track visitors across websites for marketing purposes│
│                                                                 │
│  [Continue reading... →]                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 12. Cookie Consent

### 12.1 Cookie Consent Banner

```
┌─────────────────────────────────────────────────────────────────┐
│  🍪 We use cookies to improve your experience                  │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  We use cookies to analyze our traffic and improve our site.   │
│  You can choose which cookies you allow.                       │
│                                                                 │
│  [Accept All]  [Customize]  [Reject All]                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 12.2 Cookie Preferences Modal

```
┌─────────────────────────────────────────────────────────────────┐
│  Cookie Preferences                                     [×]   │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  Essential Cookies                                              │
│  [██████████] Always Active                                    │
│  Required for the website to function properly.                │
│                                                                 │
│  Analytics Cookies                                              │
│  [██████████] ON                                               │
│  Help us understand how visitors interact with our website.    │
│                                                                 │
│  Marketing Cookies                                              │
│  [          ] OFF                                              │
│  Used to track visitors across websites for marketing purposes│
│                                                                 │
│                              [Save Preferences]                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 13. Auth State Management

### 13.1 Auth Context

```tsx
// packages/ui/contexts/AuthContext.tsx
interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (data: SignUpData) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    signIn: async () => {},
    signUp: async () => {},
    signOut: async () => {},
    resetPassword: async () => {},
    updatePassword: async () => {}
  })

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        loading: false
      }))
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null
      }))
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  )
}
```

### 13.2 Protected Route Component

```tsx
// packages/ui/components/auth/ProtectedRoute.tsx
interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (!loading && user && allowedRoles) {
      const userRole = getUserRole(user)
      if (!allowedRoles.includes(userRole)) {
        router.push('/unauthorized')
      }
    }
  }, [user, loading, router, allowedRoles])

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
```

### 13.3 Role-Based Redirect

```tsx
// packages/ui/utils/auth-redirects.ts
export function getDefaultRedirectForRole(role: UserRole): string {
  switch (role) {
    case 'SUPERADMIN':
      return '/admin'
    case 'ADMIN':
    case 'EDITOR':
    case 'VIEWER':
      return '/dashboard'
    case 'CLIENT':
      return '/client/dashboard'
    default:
      return '/login'
  }
}

export function getUserRole(user: User): UserRole {
  // Extract role from user metadata or database
  return user.user_metadata?.role || 'VIEWER'
}
```

---

## Appendix: Auth Components

### A.1 LoginForm Component

```tsx
interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>
  error?: string
  loading?: boolean
}
```

### A.2 RegisterForm Component

```tsx
interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => Promise<void>
  error?: string
  loading?: boolean
}

interface RegisterFormData {
  agencyName: string
  yourName: string
  email: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
}
```

### A.3 PasswordResetForm Component

```tsx
interface PasswordResetFormProps {
  onSubmit: (email: string) => Promise<void>
  error?: string
  loading?: boolean
}
```

### A.4 NewPasswordForm Component

```tsx
interface NewPasswordFormProps {
  onSubmit: (password: string) => Promise<void>
  error?: string
  loading?: boolean
  token?: string
}
```

### A.5 MagicLinkForm Component

```tsx
interface MagicLinkFormProps {
  onSubmit: (email: string) => Promise<void>
  error?: string
  loading?: boolean
}
```

---

**End of VIZTR-AUTH-FLOWS-SPEC.md**
