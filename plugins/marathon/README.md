# marathon

**Giga-Projekt, simpel aber fick lang? Starten, 3–4 Tage laufen lassen, fertig.** Kein stündliches Bestätigen: Der Stop-Hook lässt Claude nicht aufhören, solange die Task-Liste offene Punkte hat — und der komplette Zustand lebt in Dateien, damit er Kompaktierung, Neustarts und Session-Wechsel übersteht.

```
/marathon:start ──▶ Task-Liste (.marathon/tasks.md, hunderte kleine Checkboxen)
                    + alles SELBST festgelegt (Branch, Testbefehl, No-Gos)
                      → dokumentiert als "Annahmen" in log.md — 0 Fragen
                            │
              ┌─────────────▼──────────────┐
              │  Task nehmen → abarbeiten  │
              │  → verifizieren → abhaken  │◀── Stop-Hook blockt das
              │  → Checkpoint-Commit       │    Aufhören & füttert die
              │  → Log-Eintrag             │    nächste Iteration
              └─────────────┬──────────────┘
                            │ alle Checkboxen ✔ (oder STOP / max_iterations)
                            ▼
                    Abschlussbericht in .marathon/log.md
```

## Warum das über Tage stabil ist

- **Zustand in Dateien, nicht im Chat**: `tasks.md` (Plan + Fortschritt), `state.json` (Schleife), `log.md` (jede Entscheidung). Nach Kompaktierung oder Neustart liest der SessionStart-Hook den Stand ein und Claude macht ohne Rückfrage weiter.
- **Null Rückfragen — technisch erzwungen**: Das Frage-Tool (AskUserQuestion) ist während des Marathons per `disallowed-tools` deaktiviert; auch der Start fragt nichts. Alle Festlegungen (Branch, Verifikationsbefehl, No-Gos) trifft das LLM selbst — konservativ — und dokumentiert sie als „Annahmen" im Log. Das Log ist dein asynchroner Review. Nicht durch Annahmen ersetzbare Fragen machen den Task zu BLOCKED, halten aber nie den Lauf an.
- **Fehler eskalieren nicht**: Verifikation pro Task, 3-Versuche-Regel → `BLOCKED` + weiter, Mini-Review alle ~20 Tasks. Ein kaputter Task hält nicht das Projekt auf und pflanzt sich nicht fort.
- **Checkpoint-Commits** pro Task: jeder Stand ist wiederherstellbar.

## Notbremsen (Endlosschleife mit Ausgängen)

| Mechanismus | Wirkung |
|---|---|
| `/marathon:stop` | sauberer Halt: WIP sichern, Zwischenbericht, wiederaufsetzbar |
| Datei `.marathon/STOP` anlegen | Hook deaktiviert den Marathon beim nächsten Turn-Ende |
| `max_iterations` (Default: Tasks × 3, min. 300) | hartes Limit gegen echte Endlosschleifen |
| alle Checkboxen abgehakt | Hook stoppt automatisch |
| Escape / Session schließen | sofortiger Halt; `/marathon:start` setzt später auf `tasks.md` wieder auf |

## „Auto-Compact": Kontext-Rotation statt vollem Kontext

Ein Plugin kann das native `/compact` nicht auslösen — also macht marathon etwas Besseres: **verlustfreie Kontext-Rotation**. Da der gesamte Arbeitszustand ohnehin in Dateien lebt, ist eine frische Session besser als jede Kompaktierung (die immer lossy ist).

```
Transkript ≥ Limit (Default 3 MB)
   │  Stop-Hook misst bei jedem Turn-Ende die Transkriptgröße
   ▼
Watchdog-Block: „Keinen neuen Task! Schreibe .marathon/handoff.md“
   │  (Stand, halbfertige Arbeit, Erkenntnisse, Umgebungszustand)
   ▼
RESTART-Flag gesetzt → nächstes Turn-Ende darf durch → Session endet
   │
   ▼
Frische Session (Driver startet sie automatisch; interaktiv: /clear)
   │  SessionStart-Hook: räumt Flag weg, „lies ZUERST handoff.md“
   ▼
Weiter bei Task N+1 — mit leerem Kontext und vollem Wissen
```

- Limit einstellbar über `"max_transcript_mb"` in `.marathon/state.json` (Transkript-Bytes sind ein grober Proxy für Kontext — bei Bedarf kalibrieren: zu früh rotiert kostet nur einen Neustart, zu spät riskiert einen vollgelaufenen Kontext).
- Das native Auto-Compact von Claude Code bleibt als zweites Netz einfach aktiv.

### Driver-Skript für echte Mehrtagesläufe (headless)

`scripts/marathon-run.sh` hält den Marathon über beliebig viele Session-Rotationen am Laufen:

```bash
bash <pfad-zum-plugin>/scripts/marathon-run.sh /pfad/zum/projekt
# Flags anpassen (Default: --permission-mode acceptEdits):
MARATHON_CLAUDE_ARGS="--dangerously-skip-permissions" bash .../marathon-run.sh .  # nur im Container!
```

Innerhalb einer Session hält der Stop-Hook die Schleife; wird rotiert, startet das Skript die nächste frische `claude -p`-Session. Es endet erst bei fertig/`STOP`/inaktiv und bricht nach 5 fehlgeschlagenen Sessions in Folge ab (mit Backoff gegen API-Limit-Serien). In `tmux`/`screen` oder per `nohup` starten, Rechner wach lassen — oder gleich eine Remote-/Web-Session nutzen.

## Wichtig: Permission-Prompts vorher ausschalten

Der Hook verhindert das *Anhalten* — aber ein Permission-Prompt mitten in der Nacht blockiert trotzdem. Vor einem Mehrtageslauf eine der Optionen:

1. **Allowlist** (empfohlen): benötigte Befehle in `.claude/settings.local.json` freigeben (z. B. `Bash(npm test:*)`, `Bash(git commit:*)`, Edit) — `/permissions` hilft dabei; `/marathon:start` weist auf absehbare Lücken hin.
2. **`claude --permission-mode acceptEdits`** für Läufe, die v. a. editieren.
3. **Sandbox/Remote**: Claude Code on the Web bzw. ein Container — dort läuft die Session serverseitig weiter und `--dangerously-skip-permissions` ist vertretbar. Auf dem eigenen Rechner diesen Flag nur in einer isolierten Umgebung (VM/Container ohne Zugriff auf Wichtiges) verwenden.

## Nutzung

```bash
/plugin install marathon@claudeskills

/marathon:start Migriere alle 340 Komponenten von styled-components auf Tailwind
/marathon:start docs/migration-plan.md 2000     # bestehender Plan, max 2000 Iterationen
/marathon:status                                 # Fortschritt + letzte Entscheidungen
/marathon:stop                                   # sauber anhalten
```

Tipp: `.marathon/` mit committen — dann ist der Fortschritt Teil der Checkpoints und auf jeder Maschine wiederaufsetzbar.
