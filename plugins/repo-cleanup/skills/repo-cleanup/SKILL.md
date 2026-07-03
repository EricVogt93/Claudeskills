---
name: repo-cleanup
description: "Repo-Hygiene: Wegwerf-Dateien (Scratch-Skripte, .bak/.tmp/.log, v2/final/copy-Duplikate, Debug-Output), tote Branches (gemergt, Upstream gone, stale) und einen als Datenbank missbrauchten Stash aufräumen — inventarisiert, klassifiziert, mit Bestätigung vor jedem Löschen. Nutzen bei 'räum das Repo auf', 'Branches/Stash entrümpeln', 'was ist das für Müll' — oder wenn der Hygiene-Report des SessionStart-Hooks Befunde zeigt."
---

# Repo-Cleanup

Grundsatz: **Erst Inventar und Klassifikation zeigen, dann löschen.** Jede destruktive Aktion (Datei löschen, Branch löschen, Stash droppen) braucht die Bestätigung des Nutzers — außer er hat pauschal freigegeben („mach einfach", „--yes"). Für alles gilt: Rettungsanker vor Vernichtung.

## 1. Wegwerf-Dateien

**Inventar**: `git status --porcelain` (untracked), typische Muster:
- Endungen: `.bak`, `.orig`, `.rej`, `.tmp`, `.swp`, `~`, lose `.log`s
- LLM-Hinterlassenschaften: `scratch*`, `debug_*`, `temp*`, `test.py`/`t.js`/`x.sh` im Root, `out*.txt`, `result*.json`, Demo-/Beispieldateien
- Duplikat-Namen: `*_v2.*`, `*_final.*`, `*_old.*`, `*_copy.*`, `*_backup.*` — hier zusätzlich prüfen, ob das „Original" oder die Kopie die aktuelle ist (Diff!)
- Untracked Verzeichnisse (`tmp/`, `output/`) und auffällig große untracked Dateien

**Klassifizieren** — jede Datei genau eine Kategorie, als Tabelle zeigen:
| Kategorie | Aktion |
|---|---|
| Müll (Wegwerf-Skript, veralteter Output) | löschen |
| Generiert/Build-Artefakt | löschen + Muster in `.gitignore` |
| Wertvoll, falsch platziert | verschieben (z. B. Doku → docs/, Einmal-Skript → scripts/) und ggf. committen |
| Unklar | Nutzer fragen — im Zweifel NICHT löschen |

Nach Bestätigung löschen. **Niemals** pauschal `git clean -fdx` (zerstört auch .env, IDE-Configs, node_modules-Caches) — immer die konkrete Liste.

## 2. Branches

**Inventar** (nur lokal, Remote separat):
- Gemergt: `git branch --merged <default-branch>` minus Default/aktueller/`main|master|develop|release*` → **sicher löschbar** (`git branch -d`)
- Upstream weg: `git branch -vv` mit `: gone]` → meist Reste gelöschter PRs
- Stale: letzter Commit > 90 Tage (`git for-each-ref --sort=committerdate refs/heads/ --format='%(refname:short) %(committerdate:relative)'`)

**Regeln**:
- Aktueller Branch und Default-Branch sind tabu.
- Ungemergte Branches (`-D` nötig) nur mit explizitem Einzel-Okay und Hinweis, welche Commits verloren gehen (`git log <default>..<branch> --oneline`). Vorher Rettungsanker anbieten: `git tag archive/<branch> <branch>` — Tag statt Branch, taucht in Branch-Listen nicht mehr auf, Inhalt bleibt erreichbar.
- Remote-Branches (`git push origin --delete`) nur nach separater, ausdrücklicher Bestätigung — das betrifft auch andere Leute.

## 3. Stash — Zwischenablage, keine Datenbank

**Ziel: leerer Stash.** Pro Eintrag aus `git stash list`:
1. `git stash show --stat stash@{n}` (bei Bedarf `-p`) ansehen
2. Klassifizieren:
   - **Bereits enthalten** (Änderungen sind inzwischen im Code — per Diff gegen HEAD prüfen) → drop
   - **Wertvoll** → auf eigenen Branch retten: `git stash branch rettung/<beschreibung> stash@{n}` (oder apply + committen)
   - **Müll** (Debug-Reste, überholte Experimente) → drop
3. Vor jedem Drop den Rettungsanker anbieten: `git stash show -p stash@{n} > <scratchpad>/stash-<n>-<datum>.patch` — gedropte Stashes sind praktisch nicht wiederherstellbar.

## 4. Nachhaltigkeit

- `.gitignore` um die gefundenen Generat-Muster ergänzen, damit derselbe Müll nicht wiederkommt.
- Der Stop-Hook dieses Plugins mahnt neue Wegwerf-Dateien künftig direkt am Turn-Ende an.

## 5. Bericht

Gelöschte Dateien / Branches (mit Archiv-Tags) / Stash-Einträge (mit Patch-Backups), ergänzte `.gitignore`-Muster, und was bewusst behalten wurde und warum.

## Absolute Tabus

Kein `git clean -fdx` ohne dateigenaue Liste, kein `git reflog expire`/`git gc --prune=now` (vernichtet die letzte Rettungsebene), nichts Remote-Destruktives ohne ausdrückliche Einzelbestätigung, niemals aktueller oder Default-Branch.
