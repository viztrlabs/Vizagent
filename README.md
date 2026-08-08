## Setup Instructions for VizTR

### Current Status
✅ **All code built:** 18 tasks completed
✅ **Dependencies installed:** Next.js 16, Babylon.js, Supabase, etc.
✅ **Authentication:** NextAuth with Google OAuth
✅ ✅ **Database:** Not yet connected

### What needs to be done:

**1. Get Supabase Database URL**
- Go to https://supabase.com/dashboard
- Create a Supabase project
- Go to **Settings → Database**
- Click "View connection string"
- Copy the **"For application developers"** connection string

**Example format:**
```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@[REGION].pooler.supabase.com:6543/postgres
```

**2. Update .env.local**
Replace the current DATABASE_URL with your actual Supabase connection string.

**3. Run migrations**
```bash
cd C:\Users\Arch_Viz\Desktop\VizAgent
pnpm prisma migrate dev --name init
```

**4. Configure Google OAuth**

**For Google Client ID and Secret:**
1. Go to https://console.cloud.google.com/
2. Create a new Project or select existing
3. Go to **APIs & Services → Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. **Application type:** Web application
6. **Redirect URIs:** `http://localhost:3000/api/auth/callback/google`
7. Copy the **Web Client ID** and **Client secret**

**5. Update .env.local** with your Google credentials:
```env
GOOGLE_CLIENT_ID="your-web-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

**6. Generate CRON_SECRET** (optional, for Vercel cron):
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**7. Update .env.local** with your Resend key:
```env
RESEND_API_KEY="re_your_resend_api_key"
CRON_SECRET="your-cron-secret"
```

**8. AI providers (optional — used by scene generation, QA, and tagging):**

Default provider is OpenAI. Set `AI_DEFAULT_PROVIDER=ollama` to use a local
Ollama server, or override per-call by passing `provider: 'local'` / `provider: 'openai/gpt-4o'`.

```env
AI_DEFAULT_PROVIDER="openai"
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o-mini"
ANTHROPIC_API_KEY="sk-ant-..."
ANTHROPIC_MODEL="claude-3-5-sonnet-latest"
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.1"
```

**9. Test the application:**
```bash
cd C:\Users\Arch_Viz\Desktop\VizAgent
pnpm dev
```

**Expected behavior:**
- Landing page at http://localhost:3000
- Sign-in page at `/auth/signin`
- Can sign in with Google or credentials
- Access dashboard at `/dashboard`

### Need help with any step?
Just let me know which step you're stuck on, and I'll guide you through it!
