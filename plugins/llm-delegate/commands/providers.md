---
description: "Zeigt konfigurierte Delegations-Provider (GLM, Kimi, opencode) und deren API-Key-Status"
---

Rufe das MCP-Tool `list_providers` vom Server `llm-delegate` auf und gib das Ergebnis wieder.

Falls bei einem Provider der API-Key fehlt, erkläre kurz, wie man ihn setzt:
- **glm**: `export ZAI_API_KEY=...` — Default ist der Coding-Plan-Endpoint (`https://api.z.ai/api/coding/paas/v4`); Pay-per-Token via `ZAI_BASE_URL=https://api.z.ai/api/paas/v4`
- **kimi**: `export KIMI_API_KEY=...` (Coding-Plan-Key von https://kimi.com) — Default-Endpoint `https://api.kimi.com/coding/v1`, Modell `kimi-for-coding`; Platform-API via `KIMI_BASE_URL=https://api.moonshot.ai/v1` + `KIMI_MODEL=kimi-k2.7-code` (Key von https://platform.moonshot.ai)
- **opencode**: opencode CLI installieren (https://opencode.ai) und dort Auth konfigurieren (`opencode auth login` bzw. Zen)

Optionale Overrides: `ZAI_MODEL`, `KIMI_MODEL`, `OPENCODE_MODEL`, `LLM_DELEGATE_ALLOW_SHELL=1`, `LLM_DELEGATE_MAX_TURNS`.
