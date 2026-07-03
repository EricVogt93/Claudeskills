# marathon

**Giga-Projekt, simpel aber fick lang? Starten, 3–4 Tage laufen lassen, fertig.** Kein stündliches Bestätigen: Der Stop-Hook lässt Claude nicht aufhören, solange die Task-Liste offene Punkte hat — und der komplette Zustand lebt in Dateien, damit er Kompaktierung, Neustarts und Session-Wechsel übersteht.

```
/marathon:start ──▶ Task-Liste (.marathon/tasks.md, hunderte kleine Checkboxen)
                    + EINMAL alles klären (Branch, Testbefehl, No-Gos, Permissions)
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
- **Keine Rückfragen by design**: Alles Klärbare wird beim Start abgefragt; während des Laufs gilt: konservative Option wählen + im Log begründen. Das Log ist dein asynchroner Review.
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
