---
disable-model-invocation: true
description: "Bugs aus findings.md (oder Einzelbeschreibung) abarbeiten: pro Bug reproduzieren → lokalisieren → fixen → verifizieren"
argument-hint: "[Pfad zu findings.md | Bug-Beschreibung] [optional: 'nur blocker/major']"
---

Führe die Bug-Abarbeitung aus dem Skill `fixing-found-bugs` aus (lade den Skill, falls noch nicht geschehen).

Argumente: `$ARGUMENTS` — entweder ein Pfad zu einem Bug-Report (Default, falls vorhanden: `e2e-exploration/findings.md`) oder eine direkte Bug-Beschreibung; optional ein Severity-Filter (z. B. „nur blocker und major").

Halte dich an den Skill-Ablauf: Liste extrahieren und priorisieren → Scope bei > 3 Bugs bestätigen lassen → pro Bug den `bug-fixer`-Agent (sequenziell; parallel nur bei disjunkten Bereichen) → Abschluss-Verifikation mit kompletter Testsuite → Findings-Dokument aktualisieren → Statusbericht. Kein Fix ohne Repro, kein Commit ohne Auftrag.
