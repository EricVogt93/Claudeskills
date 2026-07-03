---
disable-model-invocation: true
description: "Drei-Pass-Refactoring: Code-Qualität (Komplexität, Nesting, Hardcoding, Abstraktion) → Simplify → LLM-Verbosity komprimieren"
argument-hint: "[Datei/Verzeichnis/Modul] [optional: Fokus, z.B. 'nur Pass 3']"
---

Führe den Refactoring-Prozess aus dem Skill `code-refactoring` aus (lade den Skill, falls noch nicht geschehen).

Argumente: `$ARGUMENTS` — Scope (Datei, Verzeichnis oder Modulname) und optional ein Fokus (z. B. „nur Kompression", „nur Pass 1"). Ohne Scope: Hotspots im Projekt identifizieren (längste Funktionen, tiefste Verschachtelung, Duplikate) und die 3–5 schlimmsten dem Nutzer zur Auswahl vorschlagen — nicht ungefragt das ganze Repo umbauen.

Halte dich strikt an die Phasen des Skills:
1. Phase 0: Tests als Baseline (bzw. Vorgehen bei fehlenden Tests), Bugs nur melden, nie still fixen
2. Pass 1: Standard-Code-Qualität
3. Pass 2: Simplify
4. Pass 3: LLM-Verbosity-Kompression
5. Abschlussbericht mit Vorher/Nachher-Metriken

Nach jedem Pass Tests laufen lassen. Nichts committen, außer der Nutzer verlangt es.
