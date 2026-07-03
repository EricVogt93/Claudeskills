#!/usr/bin/env bash
# Marathon-Driver: hält einen Marathon über Tage am Laufen, inklusive
# "Auto-Compact von außen" — jede neue Session startet mit frischem Kontext
# und liest den Stand aus .marathon/ (handoff.md, tasks.md, log.md).
#
# Ablauf: claude läuft headless; der Stop-Hook hält die Arbeitsschleife
# innerhalb der Session am Laufen. Wird der Kontext voll, erzwingt der
# Watchdog eine Übergabe (handoff.md) und lässt die Session enden — dieses
# Skript startet dann die nächste frische Session. Endet erst, wenn der
# Marathon fertig/gestoppt ist.
#
# Usage:   ./marathon-run.sh [PROJEKT_DIR]
# Env:     MARATHON_CLAUDE_ARGS  zusätzliche claude-Flags, z. B.
#          "--permission-mode acceptEdits" (Default) oder in einem
#          isolierten Container "--dangerously-skip-permissions"
#
# Voraussetzung: /marathon:start wurde einmal ausgeführt (.marathon/ existiert).

set -u

DIR="${1:-.}"
cd "$DIR" || { echo "Verzeichnis nicht gefunden: $DIR" >&2; exit 1; }

if [ ! -f .marathon/state.json ]; then
  echo "Kein Marathon initialisiert (.marathon/state.json fehlt) — erst /marathon:start ausführen." >&2
  exit 1
fi

ARGS="${MARATHON_CLAUDE_ARGS:---permission-mode acceptEdits}"
PROMPT='Marathon-Fortsetzung (frische Session): Lies zuerst .marathon/handoff.md (falls vorhanden), dann .marathon/tasks.md und .marathon/log.md. Arbeite die offenen Tasks nach den Marathon-Regeln ab: Task nehmen, abarbeiten, verifizieren, abhaken, Checkpoint-Commit, Log-Eintrag. Keine Rückfragen — konservativ entscheiden und im Log dokumentieren.'

is_active() {
  node -pe 'JSON.parse(require("fs").readFileSync(".marathon/state.json","utf8")).active === true' 2>/dev/null
}

run=0
fails=0
while :; do
  if [ -f .marathon/STOP ]; then
    echo "[marathon-run] STOP-Datei gefunden — Ende."
    break
  fi
  if [ "$(is_active)" != "true" ]; then
    echo "[marathon-run] Marathon inaktiv (fertig oder gestoppt) — Ende."
    break
  fi

  rm -f .marathon/RESTART
  run=$((run + 1))
  echo "[marathon-run] Session $run startet: $(date '+%F %T')"

  # shellcheck disable=SC2086 -- ARGS soll wortweise expandieren
  claude -p "$PROMPT" $ARGS
  code=$?
  echo "[marathon-run] Session $run beendet (exit $code): $(date '+%F %T')"

  if [ $code -ne 0 ]; then
    fails=$((fails + 1))
    if [ $fails -ge 5 ]; then
      echo "[marathon-run] 5 fehlgeschlagene Sessions in Folge — Abbruch. Log prüfen." >&2
      exit 1
    fi
    sleep $((30 * fails)) # Backoff bei Fehler-Serien (API-Limits, Netz)
  else
    fails=0
    sleep 5
  fi
done

echo "[marathon-run] Fertig nach $run Session(s). Bericht: .marathon/log.md"
