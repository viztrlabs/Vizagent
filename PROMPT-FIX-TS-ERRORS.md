# Subagent Prompt: Fix All TypeScript/JSX Errors in VizTR Codebase

## ROLE
You are a senior TypeScript/React engineer tasked with fixing ALL TypeScript/JSX compilation errors in the VizTR codebase. You have full read/write access to the repository at `C:\Users\Arch_Viz\Desktop\VizAgent`.

## CURRENT STATE
- **Lint**: 0 errors (warnings only)
- **TypeScript (tsc --noEmit)**: 16 errors across 4 files
- All errors are NEW/REAL - blocking the M8-M18 forward build verification

## FILES TO FIX (Priority Order)

### 1. `components/content/BlockEditor.tsx` - 4 errors
- Line 171:8 - JSX element 'button' has no corresponding closing tag
- Line 193:7 - ')' expected
- Line 234:5 - Declaration or statement expected
- Line 235:3 - Expression expected

### 2. `components/content/BlockPalette.tsx` - 2 errors
- Line 68:1 - Expression or comma expected
- Line 68:3 - Unexpected keyword or identifier

### 3. `components/xr-console/XRConsoleDashboard.tsx` - 1 error
- Line 107:10 - ',' expected

### 4. `lib/server/content/content-service.ts` - 11 errors (HIGHEST PRIORITY)
- Line 93:3 - Property assignment expected
- Line 93:4 - ')' expected
- Line 189:9 - Argument expression expected
- Line 189:10 - ',' expected
- Line 190:7 - Argument expression expected
- Line 190:8 - ';' expected
- Line 190:9 - Declaration or statement expected
- Line 219:1 - Declaration or statement expected
- Line 477:6 - ')' expected
- Line 478:3 - Declaration or statement expected
- Line 495:6 - ')' expected
- Line 496:3 - Declaration or statement expected

## YOUR TASK

Fix ALL TypeScript/JSX errors in the codebase. You must:

1. **Read each file completely** before making changes
2. **Fix syntax/parsing errors first** (unclosed tags, missing brackets, commas, semicolons)
3. **Preserve all existing functionality** - do not change logic, only fix syntax
4. **Run verification after each file** to confirm fixes
5. **Stop only when `pnpm tsc --noEmit` returns 0 errors** (or only the 9 ACCEPTED baseline errors)

## VERIFICATION COMMANDS

Run these after each file fix:
```bash
cd /sessions/keen-trusting-knuth/mnt/VizAgent
pnpm lint    # Should show 0 errors
pnpm tsc     # Should show 0 errors (or only 9 ACCEPTED baseline errors)
```

## ACCEPTED BASELINE ERRORS (DO NOT FIX - THESE ARE EXPECTED)
These 9 errors are pre-existing feature gaps and should remain:
1. `components/configurator/ARPanel.tsx(18,33)` - Cannot find module '@/components/xr/useBabylonScene'
2. `components/configurator/Sidebar.tsx(95,39)` - ARPanel missing required `scene` prop
3. `components/configurator/Sidebar.tsx(164,39)` - ARPanel missing required `scene` prop
4. `components/upload/UploadDropzone.tsx(5,32)` - Cannot find module './UploadProgress'
4. `lib/ai/providers/anthropic.test.ts(1,23)` - Cannot find module '@anthropic-ai/sdk'
5. `lib/ai/providers/anthropic.ts(1,23)` - Cannot find module '@anthropic-ai/sdk'
6. `lib/ai/providers/anthropic.ts(33,18)` - Parameter 'block' implicitly has 'any' type
7. `lib/ai/providers/anthropic.ts(34,15)` - Parameter 'block' implicitly has 'any' type
8. `lib/ai/providers/openai.test.ts(1,20)` - Cannot find module 'openai'
9. `lib/ai/providers/openai.ts(1,20)` - Cannot find module 'openai'

## FILES TO READ FIRST (for context)
1. `components/content/BlockEditor.tsx` - ~240 lines
2. `components/content/BlockPalette.tsx` - ~110 lines
3. `components/xr-console/XRConsoleDashboard.tsx` - ~180 lines
4. `lib/server/content/content-service.ts` - ~500 lines (MOST ERRORS HERE)

## WORKFLOW
1. Read all 4 files completely first
2. Fix content-service.ts FIRST (most errors)
3. Fix BlockEditor.tsx
4. Fix BlockPalette.tsx
5. Fix XRConsoleDashboard.tsx
6. Run `pnpm tsc --noEmit` after each fix
6. Stop only when `pnpm tsc --noEmit` shows ≤9 errors (the ACCEPTED baseline)

## SUCCESS CRITERIA
- `pnpm lint` → 0 errors
- `pnpm tsc --noEmit` → 0 NEW/REAL errors (≤9 ACCEPTED baseline errors only)
- No syntax/parsing errors in any file
- All existing functionality preserved

Report back with: "ALL ERRORS FIXED - VERIFICATION PASSED" when complete.