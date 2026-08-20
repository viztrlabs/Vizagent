# VSCode Rules

## Scope
- Track 6: Review & Merge
- Assigned folder: `subagents/vscode/`

## Workflow
1. Sub-agent pushes feature branch
2. Lead reviews in VSCode
3. Run `pnpm typecheck && pnpm test` locally
4. Resolve any conflicts
5. Merge to `main` (Lead only)
6. Update `TODO.md` with merge status