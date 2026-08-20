# Hermes Rules

## Scope
- Track 4: Platform Features (CRM, Analytics, AI, Client Portal, Billing)
- Assigned folder: `subagents/hermes/local-tasks/`

## Workflow
1. Lead provides prompt using §8 template from AGENT-COORDINATION.md
2. You paste in Hermes terminal on local workstation
3. Hermes executes, returns §4 Standard Report Format
4. Lead integrates, updates TODO.md + TRACKER.md

## Constraints
- NEVER print/commit secrets
- NEVER run destructive commands without Lead approval
- Local GPU: RTX 1050ti (adjust quality presets accordingly)
- Cloudflare Tunnel must be running for local ↔ cloud bridge