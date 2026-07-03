---
name: delegating-coding-tasks
description: "Coding-Tasks an externe LLMs auslagern (Z.ai GLM-5.2, Moonshot Kimi, opencode) via MCP-Tool delegate_task. Nutzen, wann immer Implementierungsarbeit delegierbar ist: klar planbare Features, große mechanische Änderungen (Refactoring, Migration, Boilerplate, Testgenerierung), parallele Arbeitspakete, Zweitmeinungen/Reviews — oder wenn der Nutzer Delegation, GLM, Kimi, opencode oder das Schonen des eigenen Kontingents erwähnt. Enthält die Benchmark-basierte Routing-Matrix, welcher Provider welchen Task-Typ bekommt."
---

# Coding-Tasks delegieren

Du hast über den MCP-Server `llm-delegate` zwei Tools: `delegate_task` und `list_providers`. Du entscheidest **selbstständig**, ob, wann und an wen du delegierst — du brauchst keine Aufforderung, aber kündige im Gespräch kurz an, an wen du delegierst und warum.

## Wann delegieren — und wann nicht

**Delegiere**, wenn mindestens eins zutrifft:
- Die Implementierung ist klar planbar und der Plan passt in einen self-contained Auftrag (der Implementierer kennt den Chatverlauf nicht).
- Mechanische Breite: Refactorings über viele Dateien, Migrationen, Boilerplate, CRUD, Testgenerierung, Doku-Sync.
- Es gibt unabhängige Arbeitspakete, die parallel laufen können, während du selbst am kritischen Pfad arbeitest.
- Zweitmeinung/Design-Review gewünscht (dann `mode: "chat"` — keine Dateiänderungen).
- Der Nutzer will explizit sein GLM-/Kimi-Coding-Abo nutzen oder dein Kontingent schonen.

**Mach es selbst**, wenn:
- Der Edit klein ist (Faustregel: < ~20 Zeilen oder 1–2 Dateien) — Delegations-Overhead lohnt nicht.
- Die Aufgabe architektur- oder sicherheitskritische Abwägungen enthält, die du im Gesprächskontext treffen musst.
- Der nötige Kontext sich nicht sauber in einen Auftrag packen lässt.
- Es um die finale Verifikation geht — **die delegierst du nie**.

## Routing-Matrix (Benchmark-Stand Juli 2026)

| Task-Typ | Provider | Begründung (Benchmarks) |
|---|---|---|
| Repo-weite / mehrstufige Implementierungen, Multi-File-Patches, Feature-Bau nach Plan, sehr große Kontexte | `glm` | Bestes Open-Weight-Modell auf SWE-bench Pro (62.1 %), Terminal-Bench 2.1 81.0, FrontierSWE 74.4 (≈ Opus-4.8-Niveau bei Long-Horizon-Tasks), 1M-Token-Kontext |
| Tool-/MCP-intensive Kleinarbeit, präzise iterative Tool-Loops, kniffliges Debugging & Fehleranalyse | `kimi` | MCP Mark Verified 81.1 (vor Opus 4.8: 76.4) → höchste Tool-Aufruf-Präzision; Thinking immer aktiv → stark bei Schritt-für-Schritt-Diagnose; günstigere Input-Tokens |
| Tasks, die während der Implementierung **Shell, Tests oder Builds** brauchen; oder gezielt Drittmodelle (GPT/Gemini via Zen) | `opencode` | Voller lokaler Agent mit Shell-Zugriff (der glm/kimi-Agent-Loop hat Shell standardmäßig aus); Modellwahl frei via `--model` |
| Zweitmeinung, Code-Review, Architektur-Feedback (ohne Dateiänderung) | `glm` oder `kimi`, `mode: "chat"` | Provider nach obiger Logik; Kimi für Fehleranalyse, GLM für Groß-Kontext-Reviews |
| Unsicher / gemischt | `glm` | Breitestes Profil, stärkste öffentliche Benchmark-Basis |

Schwächen mitdenken: GLM-5.2 fällt bei den allerhärtesten Einzel-Fixes hinter Claude zurück (SWE-Marathon −13 % vs. Opus 4.8) — solche Brocken behältst du selbst. Kimi hat keine SWE-bench-Submission für K2.7-code; für unbekannte, repo-weite Großaufgaben ist GLM die sicherere Wahl.

## Ablauf

1. **Provider-Status**: Wenn unklar ist, was konfiguriert ist → `list_providers` (zeigt Key-Status; delegiere nie an einen Provider ohne Key).
2. **Plan schreiben** — self-contained: Ziel + Kontext (1–2 Sätze), betroffene Dateien mit konkreten Änderungen, Projekt-Konventionen (Sprache, Stil, Versionen), Akzeptanzkriterien, explizite No-Gos.
3. **`delegate_task`** mit `provider` laut Matrix, `task` = Plan, `workdir` = absoluter Projektroot, `mode: "agent"` (Default). Braucht der Task Testläufe während der Implementierung → `opencode` wählen statt Shell freizuschalten.
4. **Verifizieren** (immer selbst): `git diff` lesen, Tests/Linter laufen lassen. Kleine Mängel selbst fixen. Größere Abweichungen: konkretes Feedback formulieren und **maximal 2 Nachbesserungsrunden** an denselben Provider — danach selbst übernehmen.
5. **Nie ungeprüft committen** — und committen überhaupt nur, wenn der Nutzer es will.

## Parallelisierung

Unabhängige Arbeitspakete kannst du gleichzeitig an verschiedene Provider geben (z. B. GLM baut das Feature, Kimi schreibt parallel die Tests dafür in einem separaten Verzeichnis). Regel: **disjunkte Dateimengen** — zwei Agent-Loops im selben workdir auf denselben Dateien erzeugen Konflikte.

## Benchmark-Pflege

Die Zahlen oben sind Momentaufnahme (Juli 2026). Wenn der Nutzer neuere Modelle erwähnt (z. B. GLM-6, K3) oder Ergebnisse systematisch von der Matrix abweichen, kurz per Websuche nachprüfen und die Wahl begründen.
