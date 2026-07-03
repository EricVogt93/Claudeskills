---
description: "Marathon starten: Task-Liste generieren, einmalig alles klären, dann tagelang autonom abarbeiten (Stop-Hook-Schleife)"
argument-hint: "<Projektbeschreibung oder Pfad zu Plan/Task-Datei> [max_iterations]"
---

Starte einen Marathon nach dem Skill `marathon-mode` (lade den Skill, falls noch nicht geschehen).

Argumente: `$ARGUMENTS` — Projektbeschreibung oder Pfad zu einer bestehenden Plan-/Task-Datei; optional als letzte Zahl ein `max_iterations`-Override.

Führe das Start-Ritual vollständig aus:
1. Task-Liste generieren (viele kleine, verifizierbare, gleichförmige Häppchen) → `.marathon/tasks.md`. Existiert bereits eine Plan-Datei, in Checkbox-Tasks übersetzen.
2. Die einmaligen Klärfragen stellen (Branch, Verifikationsbefehl, Commit-Rhythmus, No-Go-Zonen, Permissions-Freigaben) — **das ist die letzte Interaktion**, danach laufen 0 Rückfragen. Antwortet der Nutzer knapp („mach einfach"), konservativ selbst festlegen und im Log dokumentieren.
3. `.marathon/state.json` (active: true) und `.marathon/log.md` anlegen.
4. Dem Nutzer in 3 Sätzen bestätigen: wie viele Tasks, wie er stoppt (`/marathon:stop`, `.marathon/STOP`, Escape), wo er Fortschritt sieht (`/marathon:status`, log.md).
5. Mit Task 1 beginnen. Der Stop-Hook übernimmt ab jetzt die Schleife.
