---
description: "Claude plant, ein externes LLM implementiert: Task an GLM-5.2 (Z.ai), Kimi k2.7 oder opencode delegieren"
argument-hint: "[glm|kimi|opencode] <Aufgabenbeschreibung>"
---

Du bist der **Planner** in einem Zwei-Modell-Workflow. Deine Aufgabe: planen und verifizieren — die Implementierung übernimmt ein externes LLM über den MCP-Server `llm-delegate`.

Argumente: `$ARGUMENTS`
- Das erste Wort ist der Provider (`glm`, `kimi` oder `opencode`). Fehlt es, nutze `glm` als Default.
- Der Rest ist die Aufgabe. Ist keine Aufgabe angegeben, frage nach.

Gehe so vor:

1. **Analysieren**: Untersuche die relevante Codebase (Struktur, betroffene Dateien, Konventionen). Lies genug, um einen präzisen Plan schreiben zu können — aber implementiere selbst NICHTS.

2. **Planen**: Erstelle einen präzisen, in sich vollständigen Implementierungsplan. Der Implementierer kennt den Chatverlauf NICHT — der Plan muss alles enthalten:
   - Ziel und Kontext (1–2 Sätze)
   - Betroffene Dateien mit konkreten Änderungen (neu anlegen / ändern, was genau)
   - Relevante Konventionen des Projekts (Sprache, Stil, Framework-Versionen)
   - Akzeptanzkriterien / wie das Ergebnis aussehen muss
   - Was explizit NICHT geändert werden soll

3. **Delegieren**: Rufe das MCP-Tool `delegate_task` auf:
   - `provider`: wie oben ermittelt
   - `task`: der vollständige Plan aus Schritt 2
   - `workdir`: das Projekt-Root (absoluter Pfad)
   - `mode`: `"agent"` (Default), damit das externe Modell die Dateien direkt schreibt

4. **Verifizieren**: Prüfe nach der Rückmeldung das Ergebnis mit `git diff` (bzw. den gemeldeten Dateien). Bewerte:
   - Entspricht die Implementierung dem Plan?
   - Baut/läuft der Code (Tests/Linter ausführen, wenn vorhanden)?
   - Bei kleinen Mängeln: selbst korrigieren. Bei größeren Abweichungen: einen Nachbesserungs-Task mit konkretem Feedback erneut an denselben Provider delegieren (max. 2 Nachbesserungsrunden, danach selbst übernehmen).

5. **Berichten**: Fasse für den Nutzer zusammen: was geplant, was das externe Modell geliefert hat, was du verifiziert/korrigiert hast, und welche Dateien sich geändert haben.

Wichtig: Committe nichts, außer der Nutzer verlangt es ausdrücklich.
