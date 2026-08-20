# VSCode Guardrails — Merge Rules

## Responsibilities
- Human-in-the-loop: diffs, merge conflicts, commit, quick manual fixes
- Final sign-off on all merges to `main`
- Runs `pnpm typecheck && pnpm test` before merge approval

## Merge Checklist
- [ ] All CI checks pass (typecheck, lint, vitest, playwright)
- [ ] No secrets in diff
- [ ] Design tokens compliance verified (Antigravity output)
- [ ] Architecture compliance verified (OpenCode output)
- [ ] Local tests pass (Hermes report)
- [ ] No breaking changes without migration
- [ ] Documentation updated if needed