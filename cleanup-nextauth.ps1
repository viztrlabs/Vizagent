# =============================================================================
# VizTR — Remove NextAuth + Sweep leftovers (run AFTER the M0.1 auth cutover code landed)
# -----------------------------------------------------------------------------
# The sandbox that edited the repo cannot DELETE files (its FUSE mount denies
# unlink). This script completes the remaining host-side cleanup:
#   1. Uninstall the next-auth dependency (and its transitive packages)
#   2. Delete the 3 neutralized NextAuth files
#   3. Delete the 4 neutralized config stubs (Sentry ×3 + prisma.config.ts)
#
# The files are safe to delete — no live code imports them anymore:
#   - lib/auth.ts                          (neutralized → re-exports session helpers)
#   - app/api/auth/[...nextauth]/route.ts  (neutralized → 404 handler)
#   - components/providers.tsx             (neutralized → pass-through)
#   - sentry.client.config.ts              (neutralized → export {})
#   - sentry.edge.config.ts                (neutralized → export {})
#   - sentry.server.config.ts              (neutralized → export {})
#   - prisma.config.ts                     (neutralized → export {}; Prisma-6-only API)
#
# NOTE: if you plan to add @sentry/nextjs or upgrade to Prisma 6 later, SKIP
# the corresponding delete lines below (comment them out) and keep the stubs.
#
# HOW TO RUN  (from Windows, inside C:\Users\Arch_Viz\Desktop\VizAgent):
#   PowerShell:   .\cleanup-nextauth.ps1
#   CMD:          powershell -ExecutionPolicy Bypass -File cleanup-nextauth.ps1
# =============================================================================

$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

Write-Host "==> Removing next-auth dependency..." -ForegroundColor Cyan
pnpm remove next-auth
if ($LASTEXITCODE -ne 0) { Write-Warning "pnpm remove exited with code $LASTEXITCODE (see above)" }

# --- Files to delete ----------------------------------------------------------
$targets = @(
  'lib/auth.ts',
  'app/api/auth/[...nextauth]',          # directory (contains route.ts)
  'components/providers.tsx',
  'sentry.client.config.ts',             # neutralized stubs — delete if no Sentry planned
  'sentry.edge.config.ts',
  'sentry.server.config.ts',
  'prisma.config.ts'                     # Prisma-6-only API — delete if staying on Prisma 5
)

$deleted = 0
$missing = 0
foreach ($t in $targets) {
  $path = Join-Path $PSScriptRoot $t
  if (Test-Path $path) {
    Remove-Item -Path $path -Recurse -Force
    Write-Host "   deleted: $t" -ForegroundColor Green
    $deleted++
  } else {
    Write-Host "   already gone: $t" -ForegroundColor DarkGray
    $missing++
  }
}

# --- Optional sanity check ----------------------------------------------------
Write-Host ""
Write-Host "==> Verifying no NextAuth / Sentry / Prisma-6 references remain in live source..."
$hits = Select-String -Path (Get-ChildItem -Recurse -File -Include *.ts,*.tsx -Path app,lib,components,middleware.ts,next.config.ts -ErrorAction SilentlyContinue | % FullName) -Pattern "next-auth|nextauth|NEXTAUTH|@sentry|prisma/config|defineConfig" -ErrorAction SilentlyContinue
if ($hits) {
  Write-Host "   Still found references (docs/ and test artifacts are fine):" -ForegroundColor Yellow
  $hits | ForEach-Object { Write-Host "   - $($_.Path):$($_.LineNumber)  $($_.Line.Trim())" }
} else {
  Write-Host "   Clean — no live-source NextAuth / Sentry / Prisma-6 references." -ForegroundColor Green
}

Write-Host ""
Write-Host "Done. ($deleted deleted, $missing already absent)" -ForegroundColor Cyan
Write-Host "Recommended next: pnpm install && pnpm prisma generate && pnpm lint && pnpm tsc"
Write-Host "  (expect only the pre-existing gaps: @types/pg, vitest globals, M15 AI deps)"