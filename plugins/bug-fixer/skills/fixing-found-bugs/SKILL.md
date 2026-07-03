---
name: fixing-found-bugs
description: "Gefundene Bugs systematisch abarbeiten: aus einem Bug-Report-Dokument (z.B. e2e-exploration/findings.md aus e2e-explorer) oder Einzelbeschreibungen. Pro Bug: reproduzieren, Ursache lokalisieren, minimal fixen, per Re-Repro + Tests verifizieren, test.fixme-Specs grün ziehen. Nutzen, wenn der Nutzer Bugs aus Findings/Reports gefixt haben will ('fix die Bugs', 'arbeite die findings ab') oder einen konkreten Bug mit Repro-Schritten meldet."
---

# Gefundene Bugs fixen

Du orchestrierst die Abarbeitung; den Einzelbug erledigt der Agent **`bug-fixer`** (Plugin bug-fixer). Grundsatz: **Kein Fix ohne Repro, kein „gefixt" ohne Verifikation.**

## Ablauf

1. **Bug-Liste aufstellen**: Aus `e2e-exploration/findings.md` (oder dem genannten Report) die Bugs mit Severity extrahieren; bei einer Einzelmeldung des Nutzers: fehlen Repro-Schritte oder Erwartet/Tatsächlich, erst nachfragen bzw. selbst rekonstruieren. Duplikate und Verwandte (gleiche vermutete Ursache) zusammenfassen.

2. **Scope bestätigen**: Bei mehr als ~3 Bugs dem Nutzer die priorisierte Liste zeigen (blocker → major → minor) und den Zuschnitt bestätigen lassen. Bei ≤ 3: direkt loslegen, Priorität beachten.

3. **Vorbedingungen**: UI-Bugs brauchen die laufende App (Base-URL ermitteln/Dev-Server starten wie in den Repro-Schritten vorausgesetzt); Testbefehl des Projekts ermitteln.

4. **Pro Bug den `bug-fixer`-Agent starten** — Auftrag: vollständiger Einzelreport (Repro, Erwartet/Tatsächlich, Belege, ggf. zugehöriger `test.fixme`-Spec) + Base-URL + Testbefehl.
   - **Sequenziell** ist der Default (Fixes können sich gegenseitig beeinflussen).
   - Parallel nur, wenn Bugs erkennbar disjunkte Bereiche betreffen (verschiedene Module, keine gemeinsamen Dateien).
   - Bugs mit vermutlich gleicher Ursache: als EIN Auftrag bündeln.
   - Rein mechanische, klar lokalisierte Fixes kannst du alternativ via `llm-delegate` (`delegate_task`) erledigen lassen — die Verifikation bleibt trotzdem hier.

5. **Abschluss-Verifikation** (nach ALLEN Fixes, immer selbst): komplette Testsuite + falls vorhanden die E2E-Specs laufen lassen — Einzelfixes können sich gegenseitig brechen. Rot → verursachenden Fix nacharbeiten.

6. **Findings-Dokument aktualisieren**: Gefixte Bugs im Report als erledigt markieren (Status + Commit-/Datei-Referenz), nicht Reproduzierbares und Offenes kennzeichnen — das Dokument bleibt die Wahrheit über den Stand.

7. **Bericht**: Tabelle Bug | Severity | Status (✅/⚪ nicht repro / ❌ offen) | Ursache (ein Satz) | geänderte Dateien. Plus Gesamtteststatus. Nichts committen ohne Auftrag.

## Regeln

- „Nicht reproduzierbar" ist ein legitimes Ergebnis — niemals blind fixen.
- Minimal-invasiv: Refactoring-Gelüste an den `code-refactoring`-Skill verweisen, nicht im Bugfix unterbringen.
- Maximal 3 Iterationen pro Bug, dann ehrlich als offen berichten.
- Ein Fix, der einen anderen Test rot macht, ist nicht fertig.
