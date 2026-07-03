---
disable-model-invocation: true
description: "Marathon-Fortschritt: erledigte/offene/blockierte Tasks, Iterationen, letzte Log-Einträge"
---

Zeige den Marathon-Status, ohne die Abarbeitung fortzusetzen:

1. `.marathon/state.json` lesen: aktiv?, Iteration/max, gestartet wann.
2. `.marathon/tasks.md` auswerten: erledigt / offen / BLOCKED (Zahlen + die nächsten 3 offenen und alle BLOCKED-Tasks nennen).
3. Die letzten ~10 Einträge aus `.marathon/log.md` zusammenfassen (getroffene Entscheidungen hervorheben).
4. Grobe Hochrechnung: bisherige Tasks pro Iteration → geschätzter Rest.

Existiert kein `.marathon/`-Verzeichnis: sagen, dass kein Marathon läuft, und auf `/marathon:start` verweisen.
