# bug-fixer

Schließt den Kreislauf nach der Fehlersuche: **finden → reproduzieren → fixen → beweisen.** Nimmt Bug-Reports (z. B. `e2e-exploration/findings.md` aus `e2e-explorer`) oder Einzelbeschreibungen und arbeitet sie systematisch ab.

```
findings.md ──▶ Orchestrator (Skill/Command)          pro Bug: bug-fixer-Agent
                ├─ extrahieren & priorisieren   ──▶   1. Repro (Pflicht — sonst Stopp)
                ├─ Scope bestätigen (> 3 Bugs)        2. fixierender Test / fixme-Spec
                ├─ sequenziell (parallel nur           3. Ursache lokalisieren
                │  bei disjunkten Bereichen)           4. minimal-invasiver Fix
                └─ Abschluss: komplette Suite          5. Re-Repro + Tests, fixme raus
                   + findings.md aktualisieren
```

## Grundsätze

- **Kein Fix ohne Repro**: Ein nicht reproduzierbarer Bug wird als ⚪ gemeldet, nie blind „gefixt".
- **Kein „gefixt" ohne Beweis**: Re-Repro + betroffene Tests, am Ende die komplette Suite (Fixes können sich gegenseitig brechen).
- **Minimal-invasiv**: Ursache statt Symptom, kein Drive-by-Refactoring (dafür gibt's `code-refactor`).
- **Max. 3 Iterationen pro Bug**, danach ehrlicher ❌-Bericht mit Diagnose-Stand.
- `test.fixme`-Specs (aus `e2e-explorer`) dienen als fixierende Tests und werden nach dem Fix grün gezogen.

## Zusammenspiel im Marketplace

`e2e-explorer` findet → **`bug-fixer`** fixt (mechanische Fixes optional via `llm-delegate` an GLM/Kimi) → `review-panel` reviewt den Diff → `code-refactor` räumt auf.

## Nutzung

```bash
/plugin install bug-fixer@claudeskills

/bug-fixer:fix                                  # nimmt e2e-exploration/findings.md
/bug-fixer:fix e2e-exploration/findings.md nur blocker und major
/bug-fixer:fix "Login wirft 500 wenn E-Mail Großbuchstaben enthält; erwartet: normaler Login"

# Oder autonom: „arbeite die Findings ab"
```

UI-Bugs werden über die Playwright-MCP-Browser-Tools reproduziert — dafür muss die App laufen (der Orchestrator startet den Dev-Server notfalls, analog zu `e2e-explorer`).
