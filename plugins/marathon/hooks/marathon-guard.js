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
      `Den Nutzer NICHTS fragen — entscheide konservativ und dokumentiere im Log. ` +
      `Sind alle Punkte abgehakt oder nur noch BLOCKED übrig: setze "active": false in .marathon/state.json, ` +
      `schreibe den Abschlussbericht ans Ende von .marathon/log.md und beende dann normal. ` +
      `(Manueller Stopp durch den Nutzer: /marathon:stop oder Datei .marathon/STOP anlegen.)`,
  })
);
