---
name: marathon-mode
description: "Tagelange autonome Abarbeitung eines großen, aber unkomplizierten Projekts ohne Rückfragen: Task-Liste als dateibasierter Zustand, batchweise Abarbeitung mit Checkpoint-Commits, Entscheidungs-Log statt Nachfragen, Stop-Hook-Schleife bis alles abgehakt ist."
when_to_use: "Wenn der Nutzer etwas 'einfach laufen lassen' will, tage-/stundenlange Fleißarbeit ansteht (Migrationen, Massen-Refactorings, viele gleichartige Module) oder /marathon:start aufgerufen wird."
disallowed-tools: AskUserQuestion
---

# Marathon-Modus

Für Projekte, die **groß, aber nicht komplex** sind: hunderte gleichartige Arbeitseinheiten, die niemand stündlich bestätigen will. Der Chat ist flüchtig (Kompaktierung!) — **die Wahrheit lebt in Dateien**: `.marathon/tasks.md` (was zu tun ist), `.marathon/state.json` (Schleifenzustand), `.marathon/log.md` (Entscheidungen & Verlauf).

## Start (vollautonom — null Fragen, auch beim Start)

Der Marathon startet ohne eine einzige Rückfrage. Alle Festlegungen triffst du selbst — konservativ — und dokumentierst sie als **Annahmen** im Log-Kopf; der Nutzer reviewt sie asynchron dort:

1. **Scope & Plan**: Aus der Projektbeschreibung eine Task-Liste generieren. Jeder Task: eine Checkbox, in sich abgeschlossen, in einem Turn schaffbar (~Minuten bis eine halbe Stunde), unabhängig verifizierbar. Lieber 200 kleine als 20 riesige. Gleichartige Tasks gleich formulieren — das macht die Abarbeitung mechanisch. Unklarer Auftrag? Die konservativste sinnvolle Interpretation wählen und als Annahme dokumentieren.
2. **Selbst festlegen (nicht fragen)**:
   - **Arbeitsbranch**: neuen Branch `marathon/<slug>` vom aktuellen Stand, außer der Nutzer hat einen genannt
   - **Verifikationsbefehl**: aus dem Repo ableiten (package.json-Scripts, Makefile, CI-Config, Projektkonvention); existiert keiner, ist das Minimum ein Build-/Syntax-Check — und „Testinfrastruktur fehlt" wird als Annahme notiert
   - **Commit-Rhythmus**: 1 Commit pro Task, Prefix `marathon:`
   - **No-Go-Defaults**: öffentliche APIs/Wire-Formate/DB-Schemata unangetastet, keine Secrets, nichts Remote-Destruktives, keine Dependency-Major-Upgrades — außer der Auftrag verlangt es explizit
3. **Dateien anlegen**:
   - `.marathon/tasks.md` — die Checkliste
   - `.marathon/state.json` — `{"active": true, "task_file": ".marathon/tasks.md", "iterations": 0, "max_iterations": <geschätzte Tasks × 3, mind. 300>, "started_at": "<ISO>"}`
   - `.marathon/log.md` — Kopf mit Abschnitt **„Annahmen"** (alle Festlegungen aus Punkt 2 + Interpretationen aus Punkt 1) und dem Verifikationsbefehl, danach Verlaufs-Einträge
4. **Permissions**: Kurz prüfen, ob absehbare Befehle Prompts auslösen würden. Falls ja: als EINEN Hinweis in die Startmeldung schreiben (welche Allowlist-Einträge helfen würden) — aber NICHT darauf warten, sondern direkt loslegen.
5. Startmeldung (Information, keine Frage: Taskzahl, Branch, Annahmen-Verweis, Stopp-Wege) und sofort mit Task 1 beginnen. Ab jetzt hält der Stop-Hook die Schleife am Laufen.

## Arbeitsschleife (pro Iteration)

1. Obersten offenen Task aus `tasks.md` nehmen (BLOCKED überspringen)
2. Vollständig abarbeiten — inkl. **Verifikation** (der im Log-Kopf festgelegte Befehl). Ohne Verifikation pflanzen sich Fehler drei Tage lang fort
3. Checkbox abhaken, Checkpoint-Commit (`marathon: <task>`), Log-Eintrag (1–3 Zeilen: was, Besonderheiten, getroffene Entscheidungen)
4. Turn beenden — der Stop-Hook startet die nächste Iteration

## Regeln während des Laufs

- **Keine Rückfragen — technisch erzwungen**: Das Frage-Tool (AskUserQuestion) ist während dieses Skills deaktiviert. Bei Wahlmöglichkeiten: die konservative, reversible Option nehmen und im Log begründen. Der Nutzer liest das Log später — das ist der Deal. Eine Frage, die sich nicht durch eine konservative Annahme ersetzen lässt, macht den Task zu BLOCKED (mit der offenen Frage als Grund im Log) — sie hält niemals den Marathon an.
- **3-Versuche-Regel**: Task scheitert dreimal → `- [ ] BLOCKED: <task> — <Grund>` markieren, Log-Eintrag, weiter mit dem nächsten. Niemals an einem Task festbeißen.
- **Kein Scope-Creep**: Entdeckte Extra-Arbeit wird als neuer Task ans Ende der Liste geschrieben (mit Herkunft), nicht sofort erledigt — außer sie blockiert den aktuellen Task.
- **Alle ~20 Tasks**: Mini-Review — Gesamtsuite laufen lassen, Log auf Muster prüfen (häufen sich Blocker gleicher Art → Ursache als eigenen Task einplanen).
- **Kontext-Disziplin**: Nichts Wichtiges nur im Chat lassen. Nach Kompaktierung/Neustart müssen `tasks.md` + `log.md` allein reichen (der SessionStart-Hook erinnert daran).
- **Kontext-Rotation**: Meldet sich der Kontext-Watchdog (🔄), KEINEN neuen Task beginnen — sofort `.marathon/handoff.md` schreiben (Stand, halbfertige Arbeit, Session-Erkenntnisse, Umgebungszustand), committen, Turn beenden. Die frische Session liest die Übergabe und macht nahtlos weiter. Die Übergabe muss so vollständig sein, dass ein Claude ohne jeden Chatverlauf sofort produktiv ist.

## Ende

Alle Checkboxen abgehakt (Hook stoppt automatisch) oder nur noch BLOCKED übrig (dann selbst `"active": false` in `state.json` setzen). Abschlussbericht ans Log-Ende: erledigt/blockiert, wichtige Entscheidungen, empfohlene Nacharbeiten. Der Nutzer stoppt jederzeit mit `/marathon:stop`, der Datei `.marathon/STOP` oder Escape.
