---
description: "Multi-LLM-Review: Diff parallel von GLM + Kimi reviewen lassen, Findings verifizieren und dedupliziert berichten"
argument-hint: "[Scope: Working Tree (default) | main...HEAD | Datei/Verzeichnis]"
---

Führe das Multi-LLM-Review aus dem Skill `multi-llm-review` aus (lade den Skill, falls noch nicht geschehen).

Argumente: `$ARGUMENTS` — der Review-Scope. Ohne Argumente: `git diff` des Working Trees; ist der leer, `git diff main...HEAD` (bzw. Default-Branch).

Halte dich an den Skill-Ablauf: Scope bauen → GLM + Kimi parallel im chat-Modus → eigenes Review → jedes Finding gegen den Code verifizieren → deduplizierte Tabelle mit Konfidenz-Markierung. Keine Fixes ohne Auftrag.
