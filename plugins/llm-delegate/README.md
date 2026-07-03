# llm-delegate

Claude-Code-Plugin inkl. MCP-Server, das Coding-Tasks an **externe LLMs** delegiert.

**Use Case:** Claude plant → gibt den Plan an GLM-5.2 (oder Kimi/opencode) → das externe Modell implementiert direkt im Repo → Claude verifiziert das Diff.

## Provider

| Provider   | Backend                     | Default-Modell   | Auth                                  |
|------------|-----------------------------|------------------|---------------------------------------|
| `glm`      | Z.ai (OpenAI-kompatibel)    | `glm-5.2`        | `ZAI_API_KEY`                          |
| `kimi`     | Moonshot (OpenAI-kompatibel)| `kimi-k2.7-code` | `MOONSHOT_API_KEY` (oder `KIMI_API_KEY`) |
| `opencode` | opencode CLI (headless)     | opencode-Config  | opencode selbst (`opencode auth login` / Zen) |

Der Z.ai-Default-Endpoint ist der **Coding-Plan-Endpoint** `https://api.z.ai/api/coding/paas/v4`. Wer die normale Pay-per-Token-API nutzt, setzt `ZAI_BASE_URL=https://api.z.ai/api/paas/v4`.

## Installation

```bash
# Marketplace hinzufügen (einmalig)
/plugin marketplace add EricVogt93/Claudeskills

# Plugin installieren
/plugin install llm-delegate@claudeskills
```

Dann API-Keys in der Shell (oder in `~/.claude/settings.json` → `env`) setzen:

```bash
export ZAI_API_KEY="..."        # https://z.ai/model-api
export MOONSHOT_API_KEY="..."   # https://platform.moonshot.ai
```

Der MCP-Server ist **dependency-frei** (reines Node.js ≥ 18) — kein `npm install` nötig.

## Nutzung

### Slash-Command (empfohlen)

```
/llm-delegate:delegate glm  Baue einen REST-Endpoint /health mit Statusprüfung der DB
/llm-delegate:delegate kimi Refactore src/utils.ts: ersetze moment durch date-fns
/llm-delegate:providers
```

Claude analysiert die Codebase, schreibt einen vollständigen Implementierungsplan, ruft `delegate_task` auf, und verifiziert anschließend das Ergebnis per `git diff`.

### Direkt per MCP-Tool

Jedes LLM/Agent-Setup, das MCP spricht, kann den Server nutzen. Tools:

- **`delegate_task`** — `{ provider, task, mode?, workdir?, model?, context_files?, max_turns? }`
  - `mode: "agent"` (Default für glm/kimi): Das externe Modell erhält workdir-beschränkte Tools (`list_files`, `read_file`, `write_file`) und implementiert den Plan direkt. Rückgabe: Zusammenfassung + Liste geänderter Dateien.
  - `mode: "chat"`: Eine einzelne Completion, nur Textantwort (z. B. für Code-Reviews oder Zweitmeinungen).
  - `opencode` ist immer agentisch (führt `opencode run --model … "<task>"` im workdir aus).
- **`list_providers`** — Status aller Provider inkl. Key-Check.

### Standalone (ohne Claude Code)

```json
{
  "mcpServers": {
    "llm-delegate": {
      "command": "node",
      "args": ["/pfad/zu/plugins/llm-delegate/mcp/server.js"]
    }
  }
}
```

## Konfiguration (Umgebungsvariablen)

| Variable | Default | Beschreibung |
|---|---|---|
| `ZAI_API_KEY` | – | API-Key für Z.ai |
| `ZAI_BASE_URL` | `https://api.z.ai/api/coding/paas/v4` | OpenAI-kompatibler Endpoint |
| `ZAI_MODEL` | `glm-5.2` | GLM-Modell |
| `MOONSHOT_API_KEY` / `KIMI_API_KEY` | – | API-Key für Moonshot |
| `KIMI_BASE_URL` | `https://api.moonshot.ai/v1` | OpenAI-kompatibler Endpoint |
| `KIMI_MODEL` | `kimi-k2.7-code` | Kimi-Modell |
| `OPENCODE_BIN` | `opencode` | Pfad zur opencode-Binary |
| `OPENCODE_MODEL` | (opencode-Config) | z. B. `opencode/gpt-5.5` (Zen) oder `zai/glm-5.2` |
| `OPENCODE_TIMEOUT_S` | `900` | Timeout für opencode-Läufe |
| `LLM_DELEGATE_MAX_TURNS` | `40` | Turn-Limit im agent-Modus |
| `LLM_DELEGATE_REQUEST_TIMEOUT_S` | `300` | Timeout pro API-Request |
| `LLM_DELEGATE_ALLOW_SHELL` | aus | `1` = externes LLM darf `run_command` (Tests/Linter) im workdir ausführen ⚠️ |

## Sicherheit

- Datei-Zugriffe des externen LLM sind strikt auf das `workdir` beschränkt (Path-Traversal-Guard).
- Shell-Zugriff (`run_command`) ist **standardmäßig deaktiviert** und nur per Opt-in (`LLM_DELEGATE_ALLOW_SHELL=1`) verfügbar.
- Der Inhalt des Repos wird an den gewählten externen Anbieter (Z.ai / Moonshot / opencode-Provider) übertragen — nur mit Code verwenden, der dorthin darf.
- Ergebnis immer per `git diff` reviewen, bevor committet wird (der Slash-Command macht das automatisch).
