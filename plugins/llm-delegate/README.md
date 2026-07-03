# llm-delegate

Claude-Code-Plugin inkl. MCP-Server, das Coding-Tasks an **externe LLMs** delegiert.

**Use Case:** Claude plant → gibt den Plan an GLM-5.2 (oder Kimi/opencode) → das externe Modell implementiert direkt im Repo → Claude verifiziert das Diff.

**Autonome Delegation:** Über den mitgelieferten Skill `delegating-coding-tasks` entscheidet Claude **selbstständig**, ob, wann und an wen er delegiert — kein Slash-Command nötig. Der Skill enthält eine Benchmark-basierte Routing-Matrix:

| Task-Typ | Provider | Warum (Benchmarks 07/2026) |
|---|---|---|
| Repo-weite/mehrstufige Implementierungen, Multi-File-Patches, große Kontexte | `glm` | Top-Open-Weight auf SWE-bench Pro (62.1 %), Terminal-Bench 2.1 81.0, FrontierSWE 74.4, 1M Kontext |
| Tool-intensive iterative Kleinarbeit, kniffliges Debugging | `kimi` | MCP Mark Verified 81.1 (vor Opus 4.8), Thinking immer aktiv, günstige Input-Tokens |
| Braucht Shell/Tests/Builds beim Implementieren; Drittmodelle (GPT/Gemini via Zen) | `opencode` | Voller lokaler Agent mit Shell; freie Modellwahl |
| Zweitmeinung/Review ohne Dateiänderung | `glm`/`kimi` im `chat`-Modus | — |

Härteste Einzel-Fixes und die finale Verifikation behält Claude selbst (GLM-5.2 fällt auf SWE-Marathon ~13 % hinter Opus 4.8 zurück). Die Slash-Commands bleiben für explizite Aufrufe erhalten.

## Provider

Die API-Provider werden über das **offizielle `openai`-SDK** angesprochen — das ist der von Z.ai und Moonshot offiziell dokumentierte Node-Client für ihre APIs (Z.ais eigenes TypeScript-SDK, `z-ai-sdk-typescript`, ist bislang nicht auf npm veröffentlicht; sobald es erscheint, ist der Client-Layer in `mcp/server.js` an einer Stelle austauschbar). Die Defaults zeigen auf die **Coding-Plan-Endpoints** beider Anbieter, sodass die Delegation über die Flatrate-Abos läuft statt Pay-per-Token:

| Provider   | Default-Endpoint (Coding-Plan)        | Default-Modell    | Auth |
|------------|----------------------------------------|-------------------|------|
| `glm`      | `https://api.z.ai/api/coding/paas/v4`  | `glm-5.2`         | `ZAI_API_KEY` |
| `kimi`     | `https://api.kimi.com/coding/v1`       | `kimi-for-coding` | `KIMI_API_KEY` (Coding-Plan-Key von kimi.com) oder `MOONSHOT_API_KEY` |
| `opencode` | opencode CLI (headless)                | opencode-Config   | opencode selbst (`opencode auth login` / Zen) |

Umschalten auf die normalen Pay-per-Token-APIs:
- **glm**: `ZAI_BASE_URL=https://api.z.ai/api/paas/v4`
- **kimi**: `KIMI_BASE_URL=https://api.moonshot.ai/v1` + `KIMI_MODEL=kimi-k2.7-code`

## Installation

```bash
# Marketplace hinzufügen (einmalig)
/plugin marketplace add EricVogt93/Claudeskills

# Plugin installieren
/plugin install llm-delegate@claudeskills
```

Dann API-Keys in der Shell (oder in `~/.claude/settings.json` → `env`) setzen:

```bash
export ZAI_API_KEY="..."    # Coding-Plan: https://z.ai (Abo) / API: https://z.ai/model-api
export KIMI_API_KEY="..."   # Coding-Plan: https://kimi.com (Abo) / API: https://platform.moonshot.ai
```

Benötigt Node.js ≥ 18. Die einzige Abhängigkeit (`openai`-SDK) installiert der Server **beim ersten Start automatisch** in sein Plugin-Verzeichnis — kein manueller Schritt nötig. Das SDK bringt Retries (2×), Timeouts und saubere API-Fehler mit.

## Nutzung

### Autonom per Skill (Default)

Nichts weiter nötig: Sobald das Plugin installiert ist, erkennt Claude über den Skill `delegating-coding-tasks` selbst, wann sich Delegation lohnt (planbare Features, mechanische Großänderungen, parallele Pakete, Zweitmeinungen), wählt den Provider anhand der Routing-Matrix und verifiziert das Ergebnis per `git diff`. Kleine Edits (< ~20 Zeilen), architektur-/sicherheitskritische Entscheidungen und die finale Verifikation macht Claude weiterhin selbst.

### Slash-Command (expliziter Aufruf)

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
| `ZAI_BASE_URL` | `https://api.z.ai/api/coding/paas/v4` | Z.ai-Endpoint (Default: Coding-Plan) |
| `ZAI_MODEL` | `glm-5.2` | GLM-Modell |
| `KIMI_API_KEY` / `MOONSHOT_API_KEY` | – | API-Key für Kimi (Coding-Plan-Key von kimi.com bzw. Platform-Key) |
| `KIMI_BASE_URL` | `https://api.kimi.com/coding/v1` | Kimi-Endpoint (Default: Coding-Plan) |
| `KIMI_MODEL` | `kimi-for-coding` | Kimi-Modell (Coding-Plan verlangt genau diese Modell-ID) |
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
