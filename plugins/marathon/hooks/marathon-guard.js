#!/usr/bin/env node
'use strict';
// Stop-Hook: Solange ein Marathon aktiv ist, darf Claude nicht aufhören.
// Terminiert über: alle Tasks abgehakt | active:false | STOP-Datei | max_iterations.

const fs = require('fs');
const path = require('path');

let input = {};
try {
  input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
} catch {}
const cwd = input.cwd || process.cwd();
const dir = path.join(cwd, '.marathon');
const stateFile = path.join(dir, 'state.json');

let state;
try {
  state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
} catch {
  process.exit(0); // kein Marathon
}
if (!state.active) process.exit(0);

function save() {
  try {
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2) + '\n');
  } catch {}
}

// Notbremse 1: STOP-Datei
if (fs.existsSync(path.join(dir, 'STOP'))) {
  state.active = false;
  state.stopped_reason = 'STOP-Datei gefunden';
  save();
  process.exit(0);
}

// Kontext-Rotation Teil 2: Handoff wurde geschrieben (RESTART-Flag existiert)
// → Session darf enden. Der Driver (marathon-run.sh) bzw. der Nutzer (/clear)
// startet frisch; der SessionStart-Hook räumt das Flag weg.
if (fs.existsSync(path.join(dir, 'RESTART'))) {
  process.exit(0);
}

// Notbremse 2: Iterations-Limit
const max = Number(state.max_iterations) || 1000;
state.iterations = (Number(state.iterations) || 0) + 1;
if (state.iterations > max) {
  state.active = false;
  state.stopped_reason = `max_iterations (${max}) erreicht`;
  save();
  process.exit(0);
}

// Fortschritt aus der Task-Liste lesen
const taskFile = state.task_file || '.marathon/tasks.md';
let open = null;
let done = null;
try {
  const t = fs.readFileSync(path.join(cwd, taskFile), 'utf8');
  open = (t.match(/^\s*[-*] \[ \]/gm) || []).length;
  done = (t.match(/^\s*[-*] \[[xX]\]/gm) || []).length;
} catch {}

// Fertig: keine offenen Checkboxen mehr (nur wenn die Liste je welche hatte)
if (open === 0 && done !== null && done > 0) {
  state.active = false;
  state.stopped_reason = 'alle Tasks abgehakt';
  save();
  process.exit(0);
}

save();

// Kontext-Watchdog Teil 1 ("Auto-Compact"): Das Transkript wächst mit dem
// Kontext. Nähert es sich dem Limit, wird statt eines neuen Tasks eine
// Übergabe-Datei erzwungen und die Session zur Rotation freigegeben.
const limitMb = Number(state.max_transcript_mb) || 3;
let sizeMb = 0;
try {
  sizeMb = fs.statSync(input.transcript_path).size / 1048576;
} catch {}
if (sizeMb >= limitMb) {
  try {
    fs.writeFileSync(path.join(dir, 'RESTART'), new Date().toISOString() + '\n');
  } catch {}
  console.log(
    JSON.stringify({
      decision: 'block',
      reason:
        `🔄 Kontext-Watchdog: Das Sitzungstranskript ist ${sizeMb.toFixed(1)} MB (Limit ${limitMb} MB) — der Kontext ist bald voll. ` +
        `Beginne KEINEN neuen Task. Schreibe stattdessen JETZT die Übergabe nach .marathon/handoff.md (überschreiben):\n` +
        `- Zuletzt erledigter Task + nächster offener Task\n` +
        `- Halbfertige Arbeit: Dateien, Stand, was noch fehlt\n` +
        `- Erkenntnisse/Fallstricke dieser Session, die NICHT schon in tasks.md/log.md stehen (Muster, Projekt-Eigenheiten, Workarounds)\n` +
        `- Offene Besonderheiten der Umgebung (laufende Server, geänderte Configs)\n` +
        `Committe handoff.md als Checkpoint und beende dann den Turn. Eine frische Session übernimmt: ` +
        `das Driver-Skript (scripts/marathon-run.sh) startet sie automatisch; interaktiv genügt /clear — der SessionStart-Hook lädt die Übergabe.`,
    })
  );
  process.exit(0);
}

const progress = open !== null ? `, offen: ${open}, erledigt: ${done}` : '';
console.log(
  JSON.stringify({
    decision: 'block',
    reason:
      `🏃 Marathon aktiv — Iteration ${state.iterations}/${max}${progress}. Arbeite ohne Rückfrage weiter:\n` +
      `1. Nimm den obersten offenen Punkt aus ${taskFile} (BLOCKED-markierte überspringen).\n` +
      `2. Arbeite ihn vollständig ab, inkl. Verifikation (Tests/Build laut .marathon/log.md-Kopf).\n` +
      `3. Hake ihn in ${taskFile} ab, mach einen Checkpoint-Commit, notiere Entscheidungen/Auffälligkeiten in .marathon/log.md.\n` +
      `4. Schlägt ein Task 3× fehl: als BLOCKED markieren (mit Grund im Log) und zum nächsten.\n` +
      `Den Nutzer NICHTS fragen — entscheide konservativ und dokumentiere die Annahme im Log; eine nicht durch Annahmen ersetzbare Frage macht den Task zu BLOCKED, hält aber nie den Lauf an. ` +
      `Sind alle Punkte abgehakt oder nur noch BLOCKED übrig: setze "active": false in .marathon/state.json, ` +
      `schreibe den Abschlussbericht ans Ende von .marathon/log.md und beende dann normal. ` +
      `(Manueller Stopp durch den Nutzer: /marathon:stop oder Datei .marathon/STOP anlegen.)`,
  })
);
