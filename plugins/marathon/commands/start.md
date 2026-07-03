---
disable-model-invocation: true
description: "Marathon starten — vollautonom, null Rückfragen: Task-Liste generieren, alles selbst festlegen, sofort loslegen"
argument-hint: "<Projektbeschreibung oder Pfad zu Plan/Task-Datei> [max_iterations]"
disallowed-tools: AskUserQuestion
---

Starte einen Marathon nach dem Skill `marathon-mode` (lade den Skill, falls noch nicht geschehen) — **vollautonom: ab jetzt keine einzige Rückfrage, auch nicht beim Start**. Das Frage-Tool ist deaktiviert.

Argumente: `$ARGUMENTS` — Projektbeschreibung oder Pfad zu einer bestehenden Plan-/Task-Datei; optional als letzte Zahl ein `max_iterations`-Override.

Vorgehen:
1. Task-Liste generieren (viele kleine, verifizierbare, gleichförmige Häppchen) → `.marathon/tasks.md`. Existiert bereits eine Plan-Datei, in Checkbox-Tasks übersetzen. Unklarheiten im Auftrag: konservativste sinnvolle Interpretation wählen — nicht fragen.
2. **Alles selbst festlegen** und im Log-Kopf unter „Annahmen" dokumentieren: Arbeitsbranch (`marathon/<slug>`, außer vom Nutzer genannt), Verifikationsbefehl (aus package.json/Makefile/CI ableiten; Minimum: Build-/Syntax-Check), Commit-Rhythmus (1/Task, Prefix `marathon:`), No-Go-Defaults (öffentliche APIs, Secrets, Remote-Destruktives, Major-Upgrades — tabu, außer explizit beauftragt).
3. `.marathon/state.json` (active: true) und `.marathon/log.md` (mit Annahmen-Sektion) anlegen.
4. Startmeldung als reine Information — keine Frage, kein Warten: wie viele Tasks, welcher Branch, Verweis auf die Annahmen in `log.md`, wie man stoppt (`/marathon:stop`, `.marathon/STOP`, Escape), wo man Fortschritt sieht (`/marathon:status`). Falls absehbar Permission-Prompts drohen: die empfohlenen Allowlist-Einträge in dieselbe Meldung schreiben — und trotzdem sofort weitermachen.
5. Direkt mit Task 1 beginnen. Der Stop-Hook übernimmt ab jetzt die Schleife.

Regel für den gesamten Lauf: Eine Frage, die sich nicht durch eine konservative, dokumentierte Annahme ersetzen lässt, macht den betroffenen Task zu BLOCKED — sie hält niemals den Marathon an.
