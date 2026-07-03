---
disable-model-invocation: true
description: "Repo aufräumen: Wegwerf-Dateien, tote Branches, Stash — mit Inventar und Bestätigung vor jedem Löschen"
argument-hint: "[files|branches|stash|all] [optional: --yes für pauschale Freigabe unkritischer Löschungen]"
---

Führe den Repo-Cleanup aus dem Skill `repo-cleanup` aus (lade den Skill, falls noch nicht geschehen).

Argumente: `$ARGUMENTS` — Bereich (`files`, `branches`, `stash` oder `all`; Default: `all`) und optional `--yes`.

- Ohne `--yes`: Inventar + Klassifikation je Bereich zeigen und vor dem Löschen bestätigen lassen.
- Mit `--yes`: Nur die **unkritischen** Aktionen direkt ausführen (Wegwerf-Dateien der Kategorie „Müll/Generiert", gemergte lokale Branches, als „bereits enthalten" verifizierte Stashes). Ungemergte Branches, Remote-Löschungen und unklare Dateien brauchen IMMER die Einzelbestätigung — auch mit `--yes`.

Rettungsanker nicht vergessen: Archiv-Tags vor Branch-`-D`, Patch-Export vor Stash-Drop. Am Ende Bericht + ggf. `.gitignore`-Ergänzung.
