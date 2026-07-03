---
name: multi-llm-review
description: "Multi-LLM-Code-Review mit Kreuzvalidierung: Diff/Code parallel von GLM und Kimi reviewen lassen (llm-delegate, chat-Modus), Findings selbst gegen den Code verifizieren, deduplizieren, nur Bestätigtes berichten. Nutzen bei Review-Wünschen ('review das', 'Zweitmeinung', 'passt der Diff?'), vor riskanten Merges, oder nach größeren eigenen/delegierten Implementierungen."
---

# Multi-LLM-Review

Du holst unabhängige Zweitmeinungen ein und bist selbst die letzte Instanz. Voraussetzung: MCP-Server `llm-delegate` (Tools `delegate_task`, `list_providers`). Fehlt er, sag das und mach ein Solo-Review.

## Ablauf

1. **Scope bauen**: Das Review-Objekt bestimmen — `git diff` (Working Tree), `git diff main...HEAD` (Branch) oder benannte Dateien. Diff + die relevanten Dateien (ganze Datei, wenn der Diff allein nicht verständlich ist) in einen Review-Auftrag packen. Bei sehr großen Diffs (> ~2000 Zeilen): thematisch splitten.

2. **Parallel ausschwärmen** — beide `delegate_task`-Aufrufe in EINER Nachricht, jeweils `mode: "chat"`:
   - `provider: "glm"` — Stärke: repo-weite Zusammenhänge, große Kontexte
   - `provider: "kimi"` — Stärke: Fehleranalyse, Schritt-für-Schritt-Logikprüfung (Thinking)

   Review-Auftrag (für beide identisch): Rolle als strenger Reviewer; NUR echte Probleme melden (Correctness, Sicherheit, Randfälle, Ressourcenlecks, Konsistenz mit dem gezeigten Projektstil); pro Finding: Datei:Zeile, Ein-Satz-Problem, konkretes Fehlerszenario, Schweregrad (blocker/major/minor); explizit KEINE Geschmacksfragen, KEIN Lob, KEINE Umformulierungsvorschläge ohne Fehlerbezug. Format: nummerierte Liste.

3. **Selbst reviewen** (währenddessen/danach): Deine eigene Durchsicht desselben Scopes — du bist der dritte Reviewer, nicht nur Moderator.

4. **Judgen & deduplizieren**: Jedes fremde Finding gegen den echten Code prüfen:
   - **Bestätigt** — du kannst das Fehlerszenario am Code nachvollziehen
   - **Widerlegt** — mit Ein-Satz-Begründung verwerfen (z. B. „Null-Check existiert in Zeile 12")
   - **Unklar** — nur behalten, wenn das Risiko hoch ist; als „unverifiziert" kennzeichnen
   Gleiche Findings von mehreren Reviewern zusammenführen und markieren: von 2–3 Reviewern unabhängig gefunden = **hoch-konfident**.

5. **Bericht**: Tabelle nach Schweregrad sortiert — Finding | Datei:Zeile | gefunden von (glm/kimi/claude) | Verdikt. Danach die widerlegten Findings in einem kurzen Absatz (damit der Nutzer sieht, was geprüft und verworfen wurde). Keine Fixes anwenden, außer der Nutzer bittet darum.

## Regeln

- Verifizieren heißt Code lesen — nie ein fremdes Finding ungeprüft durchreichen.
- Widersprechen sich GLM und Kimi, entscheidet dein Code-Beleg, nicht die Mehrheit.
- Kein Key für einen Provider (via `list_providers` prüfbar)? Mit dem verbleibenden + dir selbst weitermachen und es erwähnen.
- Der Diff geht an externe Anbieter — bei erkennbar sensiblen Inhalten (Secrets, proprietäre Algorithmen auf Nutzerwunsch geschützt) vorher fragen.
