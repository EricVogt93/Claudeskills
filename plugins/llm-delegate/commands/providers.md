---
description: "Zeigt konfigurierte Delegations-Provider (GLM, Kimi, opencode) und deren API-Key-Status"
---

Rufe das MCP-Tool `list_providers` vom Server `llm-delegate` auf und gib das Ergebnis wieder.

Falls bei einem Provider der API-Key fehlt, erkläre kurz, wie man ihn setzt:
- **glm**: `export ZAI_API_KEY=...` (Key von https://z.ai/model-api; Coding-Plan nutzt den Endpoint `https://api.z.ai/api/coding/paas/v4`)
- **kimi**: `export MOONSHOT_API_KEY=...` (Key von https://platform.moonshot.ai)
- **opencode**: opencode CLI installieren (https://opencode.ai) und dort Auth konfigurieren (`opencode auth login` bzw. Zen)

Optionale Overrides: `ZAI_MODEL`, `KIMI_MODEL`, `OPENCODE_MODEL`, `LLM_DELEGATE_ALLOW_SHELL=1`, `LLM_DELEGATE_MAX_TURNS`.
