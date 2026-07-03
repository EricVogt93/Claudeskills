# repo-cleanup

Repo-Hygiene gegen LLM-Müll: **Wegwerf-Dateien, tote Branches und ein als Datenbank missbrauchter Stash** — aufgeräumt mit Inventar, Klassifikation und Bestätigung vor jedem Löschen. Plus zwei Hooks, damit der Müll gar nicht erst liegen bleibt.

## Was aufgeräumt wird

| Bereich | Findet | Rettungsanker |
|---|---|---|
| **Dateien** | `scratch*`/`debug_*`/`temp*`, `.bak`/`.tmp`/`.log`, `out*.txt`, Root-`test.py`, `*_v2/final/copy`-Duplikate, untracked `tmp/`-Ordner | Klassifikation (Müll / generiert→gitignore / wertvoll→verschieben / unklar→fragen); nie pauschales `git clean -fdx` |
| **Branches** | gemergte, Upstream-`gone`, stale (> 90 Tage) | `-d` nur für Gemergtes; ungemergte nur mit Einzel-Okay + `git tag archive/<branch>` vorher |
| **Stash** | jeden Eintrag klassifiziert: bereits enthalten / wertvoll / Müll | Patch-Export vor jedem Drop; Wertvolles → `git stash branch`. Ziel: leerer Stash |

Danach wird `.gitignore` um die gefundenen Generat-Muster ergänzt, damit derselbe Müll nicht wiederkommt.

## Hooks (automatisch aktiv nach Install)

1. **SessionStart — Hygiene-Report**: Bei Sessionbeginn bekommt Claude einen kompakten Status (Wegwerf-Dateien, gemergte/gone-Branches, Stash-Bestand ≥ 3) in den Kontext und bietet bei Gelegenheit den Cleanup an. Blockiert nichts.
2. **Stop — Junk-Guard**: Liegen am Turn-Ende neue untracked Wegwerf-Dateien im Repo, wird Claude einmalig angehalten, sie zu löschen, ins Scratchpad zu verschieben oder begründet zu behalten (committen/.gitignore). Doppelter Loop-Schutz: `stop_hook_active` + jede Datei wird **pro Session nur einmal** angemahnt.

Die Muster sind bewusst konservativ (`hooks/junk-patterns.js`) — lieber echten Müll verpassen als legitime Dateien anmahnen. Eigene Muster: einfach dort ergänzen.

## Nutzung

```bash
/plugin install repo-cleanup@claudeskills

/repo-cleanup:cleanup                # alles: Inventar → Bestätigung → Aufräumen
/repo-cleanup:cleanup branches
/repo-cleanup:cleanup stash
/repo-cleanup:cleanup files --yes    # unkritisches direkt, Kritisches fragt trotzdem

# Oder autonom: „räum das Repo mal auf" / Hygiene-Report des Hooks
```

## Absolute Tabus (im Skill verankert)

Kein `git clean -fdx` ohne dateigenaue Liste, kein `reflog expire`/`gc --prune=now`, nichts Remote-Destruktives ohne ausdrückliche Einzelbestätigung, aktueller und Default-Branch unantastbar.
