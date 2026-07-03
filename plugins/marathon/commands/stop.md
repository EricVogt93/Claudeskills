---
description: "Marathon sauber anhalten: aktuellen Task abschließen, Zustand sichern, Zwischenbericht"
---

Stoppe den laufenden Marathon sauber:

1. In `.marathon/state.json` `"active": false` setzen und `"stopped_reason": "vom Nutzer via /marathon:stop"` ergänzen — damit blockt der Stop-Hook nicht mehr.
2. Falls gerade ein Task halb fertig ist: in einen sauberen Zustand bringen (fertigstellen, wenn es Minuten sind; sonst Stand als WIP-Commit sichern und den Task in `tasks.md` mit Vermerk „angefangen, Stand: …" versehen).
3. Zwischenbericht ans Ende von `.marathon/log.md` und an den Nutzer: erledigt/offen/BLOCKED, wichtige Entscheidungen, wie es weitergeht (`/marathon:start` setzt auf der bestehenden `tasks.md` wieder auf — erledigte Häkchen bleiben).

Die `.marathon/`-Dateien NICHT löschen — sie sind der Wiederaufsetzpunkt.
