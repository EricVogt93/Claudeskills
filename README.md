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
| [`code-refactor`](plugins/code-refactor/) | Drei-Pass-Refactoring-Skill: **Code-Qualität** (Komplexität, Nesting, Hardcoding, Abstraktion) → **Simplify** → **Kompression** LLM-typisch verboser Muster. Verhaltenserhaltend und testgesichert. |
| [`review-panel`](plugins/review-panel/) | Multi-LLM-Code-Review: Diff parallel an **GLM + Kimi** (via llm-delegate), Claude verifiziert jedes Finding gegen den Code und berichtet nur Bestätigtes — von mehreren unabhängig Gefundenes gilt als hoch-konfident. |
| [`bug-fixer`](plugins/bug-fixer/) | Arbeitet Bug-Reports (z. B. findings.md aus e2e-explorer) ab: pro Bug **reproduzieren → lokalisieren → minimal fixen → verifizieren**, `test.fixme`-Specs grün ziehen. Kein Fix ohne Repro. |
| [`repo-cleanup`](plugins/repo-cleanup/) | Repo-Hygiene gegen LLM-Müll: Wegwerf-Dateien, tote Branches, Stash-Missbrauch — mit Inventar, Bestätigung und Rettungsankern. Inkl. **Hooks**: SessionStart-Hygiene-Report + Stop-Guard gegen hinterlassene Wegwerf-Dateien. |
| [`marathon`](plugins/marathon/) | Giga-Projekte **tagelang autonom** abarbeiten: Task-Liste als dateibasierter Zustand, **Stop-Hook-Schleife** bis alles abgehakt ist, Checkpoint-Commits, Entscheidungs-Log statt Rückfragen. Notbremsen: `/marathon:stop`, STOP-Datei, Iterations-Limit. |

**Pipeline:** `e2e-explorer` findet → `bug-fixer` fixt (delegierbar via `llm-delegate`) → `review-panel` reviewt → `code-refactor` räumt den Code auf → `repo-cleanup` räumt das Repo auf.
