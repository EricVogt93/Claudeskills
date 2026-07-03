# e2e-explorer

Explorativer E2E-Test-Workflow für Claude Code: **erst verstehen, dann parallel klicken & Tests bauen.**

```
Phase 1 (blockierend)          Phase 2 (parallel)                    Phase 3
┌────────────────┐      ┌──────────────────────────────┐      ┌──────────────────┐
│  flow-analyst  │      │  ui-explorer                 │      │  Orchestrator    │
│  Code-Analyse: │─────▶│  klickt per Playwright MCP   │─────▶│  konsolidiert:   │
│  Prozesse,     │  fl  │  durchs Frontend, findet     │      │  Bug-Report +    │
│  Routen, Auth, │  ow  │  Fehler → findings.md        │      │  Regressions-    │
│  E2E-Pfade →   │  s.  ├──────────────────────────────┤      │  abgleich        │
│  flows.md      │  md  │  test-writer                 │      │                  │
│                │─────▶│  generiert tests/e2e/*.spec  │─────▶│                  │
└────────────────┘      │  + npx playwright test       │      └──────────────────┘
                        └──────────────────────────────┘
```

## Warum diese Architektur?

- **Analyse zuerst (Barriere):** Explorer und Test-Writer brauchen beide dasselbe Flow-Inventar. Ohne Phase 1 klickt der Explorer ziellos und der Test-Writer rät Selektoren. Das Inventar (`e2e-exploration/flows.md`) ist der einzige Übergabepunkt — dadurch können Phase-2-Agents strikt parallel laufen.
- **Explorer ≠ Test-Writer:** Der Explorer nutzt den **Playwright-MCP-Browser** (interaktiv, Snapshot-getrieben, gut für destruktives Explorieren). Der Test-Writer nutzt **`npx playwright test`** mit eigenen Browser-Prozessen. Keine geteilte Browser-Session → keine Kollisionen.
- **Diskrepanz = Fund:** Wenn ein generierter Test scheitert, weil die App sich anders verhält als das Inventar erwartet, wird die Assertion NICHT ans Ist-Verhalten angepasst, sondern als `test.fixme` + `POTENZIELLER BUG` markiert. Findet der Explorer dasselbe unabhängig, gilt der Fund als hoch-konfident.

## Installation & Nutzung

```bash
/plugin install e2e-explorer@claudeskills

# App starten (oder der Workflow startet den Dev-Server selbst), dann:
/e2e-explorer:explore http://localhost:3000
/e2e-explorer:explore http://localhost:5173 nur Checkout und Login
```

Voraussetzungen: Node ≥ 18. Der Playwright-MCP-Server (`@playwright/mcp`) wird per `npx` geladen; fehlende Browser installiert der Test-Writer via `npx playwright install chromium`.

## Artefakte

| Datei | Inhalt | Autor |
|---|---|---|
| `e2e-exploration/flows.md` | Flow-Inventar: Prozesse, Schritte, Selektoren, Vorbedingungen, negative Fälle | flow-analyst |
| `e2e-exploration/findings.md` | Bugs mit Severity, Repro-Schritten, Screenshots, Console-/Network-Belegen | ui-explorer |
| `e2e-exploration/screenshots/` | Belege zu den Funden | ui-explorer |
| `tests/e2e/*.spec.ts` | Lauffähige Playwright-Specs (Locator-Priorität: testid > role > text) | test-writer |
| `e2e-exploration/test-report.md` | Spec-Status je Flow, fixme-Verdachtsfälle, CI-Hinweise | test-writer |

## Skalierung (Ideen für spätere Versionen)

- **Fan-out pro Flow:** Ein ui-explorer-Agent je kritischem Flow mit isolierten Browser-Contexts (`@playwright/mcp --isolated`) für große Apps.
- **Regressions-Loop:** Bestätigte Funde automatisch als failing Tests fixieren, Fix delegieren (z. B. via `llm-delegate`), Tests grün ziehen.
- **CI-Integration:** `flows.md` versionieren; bei Routen-Änderungen im Diff nur betroffene Flows neu explorieren.
