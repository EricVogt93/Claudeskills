# Claudeskills

Persönlicher Claude-Code-Plugin-Marketplace.

```bash
/plugin marketplace add EricVogt93/Claudeskills
```

## Plugins

| Plugin | Beschreibung |
|---|---|
| [`llm-delegate`](plugins/llm-delegate/) | Delegiert Coding-Tasks per MCP an externe LLMs: Z.ai **GLM-5.2**, Moonshot **Kimi k2.7**, **opencode**. Claude plant, das externe Modell implementiert. |
| [`e2e-explorer`](plugins/e2e-explorer/) | Explorativer E2E-Workflow mit 3 Agents: **flow-analyst** identifiziert Prozesse/E2E-Pfade aus dem Code, dann parallel **ui-explorer** (klickt per Playwright durchs Frontend, findet Fehler) und **test-writer** (generiert Playwright-Specs). |
