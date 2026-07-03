---
name: marathon-mode
description: "Tagelange autonome Abarbeitung eines großen, aber unkomplizierten Projekts ohne Rückfragen: Task-Liste als dateibasierter Zustand, batchweise Abarbeitung mit Checkpoint-Commits, Entscheidungs-Log statt Nachfragen, Stop-Hook-Schleife bis alles abgehakt ist. Nutzen, wenn der Nutzer etwas 'einfach laufen lassen' will, tage-/stundenlange Fleißarbeit ansteht (Migrationen, Massen-Refactorings, viele gleichartige Module) oder /marathon:start aufgerufen wird."
---

# Marathon-Modus

Für Projekte, die **groß, aber nicht komplex** sind: hunderte gleichartige Arbeitseinheiten, die niemand stündlich bestätigen will. Der Chat ist flüchtig (Kompaktierung!) — **die Wahrheit lebt in Dateien**: `.marathon/tasks.md` (was zu tun ist), `.marathon/state.json` (Schleifenzustand), `.marathon/log.md` (Entscheidungen & Verlauf).

## Start-Ritual (die EINZIGE Gelegenheit für Fragen)

Beim Start alle Entscheidungen einsammeln, die später Rückfragen erzeugen würden — danach gibt es keine mehr:
1. **Scope & Plan**: Aus der Projektbeschreibung eine Task-Liste generieren. Jeder Task: eine Checkbox, in sich abgeschlossen, in einem Turn schaffbar (~Minuten bis eine halbe Stunde), unabhängig verifizierbar. Lieber 200 kleine als 20 riesige. Gleichartige Tasks gleich formulieren — das macht die Abarbeitung mechanisch.
2. **Einmal klären (oder konservativ selbst festlegen und dokumentieren)**: Arbeitsbranch, Verifikationsbefehl (Tests/Build/Linter), Commit-Rhythmus (Default: 1 Commit pro Task, Prefix `marathon:`), Verhalten bei Blockern, No-Go-Zonen.
3. **Dateien anlegen**:
   - `.marathon/tasks.md` — die Checkliste, oben ggf. Abschnitt „Regeln" mit den Klärungen aus Punkt 2
   - `.marathon/state.json` — `{"active": true, "task_file": ".marathon/tasks.md", "iterations": 0, "max_iterations": <geschätzte Tasks × 3, mind. 300>, "started_at": "<ISO>"}`
   - `.marathon/log.md` — Kopf mit Verifikationsbefehl + Regeln, dann Verlaufs-Einträge
4. **Permissions prüfen**: Wenn absehbar Befehle gebraucht werden, die Prompts auslösen, den Nutzer JETZT bitten, sie freizugeben (Allowlist in `.claude/settings.local.json` / `acceptEdits`) — sonst hängt der Marathon nachts an einem Prompt.
5. Loslegen mit Task 1. Ab jetzt hält der Stop-Hook die Schleife am Laufen.

## Arbeitsschleife (pro Iteration)

1. Obersten offenen Task aus `tasks.md` nehmen (BLOCKED überspringen)
2. Vollständig abarbeiten — inkl. **Verifikation** (der im Log-Kopf festgelegte Befehl). Ohne Verifikation pflanzen sich Fehler drei Tage lang fort
3. Checkbox abhaken, Checkpoint-Commit (`marathon: <task>`), Log-Eintrag (1–3 Zeilen: was, Besonderheiten, getroffene Entscheidungen)
4. Turn beenden — der Stop-Hook startet die nächste Iteration

## Regeln während des Laufs

- **Keine Rückfragen.** Bei Wahlmöglichkeiten: die konservative, reversible Option nehmen und im Log begründen. Der Nutzer liest das Log später — das ist der Deal.
- **3-Versuche-Regel**: Task scheitert dreimal → `- [ ] BLOCKED: <task> — <Grund>` markieren, Log-Eintrag, weiter mit dem nächsten. Niemals an einem Task festbeißen.
- **Kein Scope-Creep**: Entdeckte Extra-Arbeit wird als neuer Task ans Ende der Liste geschrieben (mit Herkunft), nicht sofort erledigt — außer sie blockiert den aktuellen Task.
- **Alle ~20 Tasks**: Mini-Review — Gesamtsuite laufen lassen, Log auf Muster prüfen (häufen sich Blocker gleicher Art → Ursache als eigenen Task einplanen).
- **Kontext-Disziplin**: Nichts Wichtiges nur im Chat lassen. Nach Kompaktierung/Neustart müssen `tasks.md` + `log.md` allein reichen (der SessionStart-Hook erinnert daran).
- **Kontext-Rotation**: Meldet sich der Kontext-Watchdog (🔄), KEINEN neuen Task beginnen — sofort `.marathon/handoff.md` schreiben (Stand, halbfertige Arbeit, Session-Erkenntnisse, Umgebungszustand), committen, Turn beenden. Die frische Session liest die Übergabe und macht nahtlos weiter. Die Übergabe muss so vollständig sein, dass ein Claude ohne jeden Chatverlauf sofort produktiv ist.

## Ende

Alle Checkboxen abgehakt (Hook stoppt automatisch) oder nur noch BLOCKED übrig (dann selbst `"active": false` in `state.json` setzen). Abschlussbericht ans Log-Ende: erledigt/blockiert, wichtige Entscheidungen, empfohlene Nacharbeiten. Der Nutzer stoppt jederzeit mit `/marathon:stop`, der Datei `.marathon/STOP` oder Escape.
