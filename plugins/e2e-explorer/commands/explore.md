---
description: "Explorativer E2E-Workflow: Flows analysieren, dann parallel per Playwright durchs Frontend klicken (Fehler finden) und E2E-Specs generieren"
argument-hint: "[base-url] [optional: Fokus, z.B. 'nur Checkout']"
---

Du orchestrierst den dreistufigen E2E-Explorer-Workflow. Du delegierst die Arbeit an die Plugin-Agents und führst selbst nur Vorbereitung, Koordination und Abschlussbericht aus.

Argumente: `$ARGUMENTS` — erstes Token ist die Base-URL der laufenden App (falls es wie eine URL aussieht), der Rest ist ein optionaler Fokus-Hinweis (z. B. „nur Checkout und Login").

## Phase 0 — Vorbereitung

1. **Base-URL bestimmen**: Aus den Argumenten. Fehlt sie: aus dem Projekt ableiten (package.json dev-Script, Framework-Default-Port, .env) und per `curl -s -o /dev/null -w "%{http_code}"` prüfen.
2. **App-Status prüfen**: Ist unter der URL etwas erreichbar? Falls nein: Dev-Server per Bash im Hintergrund starten (`run_in_background`), auf Erreichbarkeit warten (max. ~60s Polling). Schlägt auch das fehl, brich ab und sage dem Nutzer konkret, welcher Startbefehl gescheitert ist.
3. `mkdir -p e2e-exploration/screenshots`

## Phase 1 — Analyse (blockierend)

Starte den Agent **`flow-analyst`** (synchron, `run_in_background: false`). Auftrag: Codebase analysieren, Flow-Inventar nach `e2e-exploration/flows.md` schreiben. Gib den optionalen Fokus-Hinweis weiter — bei Fokus soll er nur die betroffenen Flows ausarbeiten.

Prüfe danach, dass `e2e-exploration/flows.md` existiert und mindestens einen Flow enthält. Falls leer/unbrauchbar: einmal mit konkreterem Auftrag nachfassen, sonst abbrechen und berichten.

## Phase 2 — Exploration & Test-Generierung (PARALLEL)

Starte **beide Agents in EINER Nachricht** (zwei Agent-Tool-Aufrufe im selben Block), damit sie parallel laufen:

- **`ui-explorer`**: Auftrag mit Base-URL + Pfad zu `e2e-exploration/flows.md` + ggf. Fokus. Er klickt die Flows per Playwright-MCP durch, exploriert destruktiv und schreibt `e2e-exploration/findings.md`.
- **`test-writer`**: Auftrag mit Base-URL + Pfad zu `e2e-exploration/flows.md` + ggf. Fokus. Er generiert `tests/e2e/*.spec.ts` und validiert sie per `npx playwright test`.

Warte auf beide Ergebnisse. Beide arbeiten aus demselben Inventar, aber unabhängig — der Explorer nutzt den MCP-Browser, der Test-Writer eigene Playwright-Prozesse; das kollidiert nicht.

## Phase 3 — Konsolidierung

1. **Abgleichen**: Funde aus `findings.md` mit den `POTENZIELLER BUG`-Markierungen des Test-Writers zusammenführen; Duplikate zusammenfassen. Ein von beiden unabhängig gefundenes Problem ist hoch-konfident — kennzeichne es.
2. **Regressionsnetz**: Für die 1–3 schwerwiegendsten bestätigten Funde prüfen, ob ein generierter Spec sie abdeckt. Falls nicht, den Fund als TODO im Report notieren (keine eigenmächtige Nachgenerierung, wenn das Zeitbudget knapp ist).
3. **Bericht an den Nutzer** (das ist dein Deliverable):
   - Funde nach Severity, die Top-3 ausformuliert mit Repro
   - Flow-Status-Tabelle (getestet/bestanden/blockiert)
   - Generierte Specs + Testlauf-Ergebnis + wie man die Suite startet
   - Pfade: `e2e-exploration/flows.md`, `findings.md`, `test-report.md`, `tests/e2e/`

Wichtig: Nichts committen, außer der Nutzer verlangt es. Keine Fixes am Anwendungscode — dieser Workflow findet und dokumentiert; Fixen ist ein separater Auftrag.
