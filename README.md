# Claudeskills

Persönlicher Claude-Code-Plugin-Marketplace.

```bash
/plugin marketplace add EricVogt93/Claudeskills
```

## Plugins

| Plugin | Beschreibung |
|---|---|
| [`llm-delegate`](plugins/llm-delegate/) | Delegiert Coding-Tasks per MCP an externe LLMs: Z.ai **GLM-5.2** und Moonshot **Kimi** über das offizielle openai-SDK und die **Coding-Plan-Endpoints** (Flatrate statt Pay-per-Token), plus **opencode** CLI. Claude entscheidet per Skill selbst, wann er delegiert, und routet Task-Typen **benchmark-basiert** zum passenden Modell — Claude plant und verifiziert, das externe Modell implementiert. |
| [`e2e-explorer`](plugins/e2e-explorer/) | Explorativer E2E-Workflow mit 3 Agents: **flow-analyst** identifiziert Prozesse/E2E-Pfade aus dem Code, dann parallel **ui-explorer** (klickt per Playwright durchs Frontend, findet Fehler) und **test-writer** (generiert Playwright-Specs). |
| [`code-refactor`](plugins/code-refactor/) | Drei-Pass-Refactoring-Skill: **Code-Qualität** (Komplexität, Nesting, Hardcoding, Abstraktion) → **Simplify** → **Kompression** LLM-typisch verboser Muster. Verhaltenserhaltend und testgesichert. |
| [`review-panel`](plugins/review-panel/) | Multi-LLM-Code-Review: Diff parallel an **GLM + Kimi** (via llm-delegate), Claude verifiziert jedes Finding gegen den Code und berichtet nur Bestätigtes — von mehreren unabhängig Gefundenes gilt als hoch-konfident. |
| [`bug-fixer`](plugins/bug-fixer/) | Arbeitet Bug-Reports (z. B. findings.md aus e2e-explorer) ab: pro Bug **reproduzieren → lokalisieren → minimal fixen → verifizieren**, `test.fixme`-Specs grün ziehen. Kein Fix ohne Repro. |
| [`repo-cleanup`](plugins/repo-cleanup/) | Repo-Hygiene gegen LLM-Müll: Wegwerf-Dateien, tote Branches, Stash-Missbrauch — mit Inventar, Bestätigung und Rettungsankern. Inkl. **Hooks**: SessionStart-Hygiene-Report + Stop-Guard gegen hinterlassene Wegwerf-Dateien. |
| [`marathon`](plugins/marathon/) | Giga-Projekte **tagelang autonom** abarbeiten: Task-Liste als dateibasierter Zustand, **Stop-Hook-Schleife** bis alles abgehakt ist, Checkpoint-Commits, Entscheidungs-Log statt Rückfragen. Inkl. **„Auto-Compact"**: Kontext-Watchdog erzwingt bei vollem Kontext eine Handoff-Datei und rotiert (per Driver-Skript automatisch) in eine frische Session — verlustfrei. Notbremsen: `/marathon:stop`, STOP-Datei, Iterations-Limit. |
| [`rigor`](plugins/rigor/) | **Frontier-Arbeitsdisziplin, automatisch aktiv**: Ein SessionStart-Hook injiziert die 7 Disziplinen (Beweis vor Behauptung, Fakten nachschlagen statt erinnern, Denkaufwand-Triage, Zustand in Dateien, Autonomie-Kalibrierung, ehrliches Berichten) in **jede** Session — auch nach `/clear` und Kompaktierung. Plus `/rigor:check` als Selbst-Audit. Wirkt auch auf delegierte Implementierer (llm-delegate). |

**Pipeline:** `e2e-explorer` findet → `bug-fixer` fixt (delegierbar via `llm-delegate`) → `review-panel` reviewt → `code-refactor` räumt den Code auf → `repo-cleanup` räumt das Repo auf.

**Quer dazu:** `rigor` hält die Arbeitsdisziplin in jeder Session hoch, `marathon` lässt das Ganze tagelang unbeaufsichtigt laufen.

## Installation

```bash
/plugin marketplace add EricVogt93/Claudeskills
/plugin install <name>@claudeskills        # z. B. llm-delegate, rigor, marathon
```

API-Keys für die Delegations-Plugins (`llm-delegate`, `review-panel`):

```bash
export ZAI_API_KEY="..."    # Z.ai — Coding-Plan (z.ai) oder API (z.ai/model-api)
export KIMI_API_KEY="..."   # Kimi — Coding-Plan (kimi.com) oder Platform (platform.moonshot.ai)
```
