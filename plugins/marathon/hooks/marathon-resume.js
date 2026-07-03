#!/usr/bin/env node
'use strict';
// SessionStart-Hook: Nach Neustart/Resume/Kompaktierung daran erinnern,
// dass ein Marathon läuft — der Zustand lebt in Dateien, nicht im Chat.

const fs = require('fs');
const path = require('path');

let input = {};
try {
  input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
} catch {}
const cwd = input.cwd || process.cwd();

let state;
try {
  state = JSON.parse(fs.readFileSync(path.join(cwd, '.marathon', 'state.json'), 'utf8'));
} catch {
  process.exit(0);
}
if (!state.active) process.exit(0);

// Kontext-Rotation abschließen: RESTART-Flag wegräumen, Handoff erwähnen
const dir = path.join(cwd, '.marathon');
try {
  fs.unlinkSync(path.join(dir, 'RESTART'));
} catch {}
const hasHandoff = fs.existsSync(path.join(dir, 'handoff.md'));

const taskFile = state.task_file || '.marathon/tasks.md';
let progress = '';
try {
  const t = fs.readFileSync(path.join(cwd, taskFile), 'utf8');
  const open = (t.match(/^\s*[-*] \[ \]/gm) || []).length;
  const done = (t.match(/^\s*[-*] \[[xX]\]/gm) || []).length;
  progress = ` Stand: ${done} erledigt, ${open} offen.`;
} catch {}

console.log(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext:
        `🏃 Es läuft ein Marathon (Plugin marathon, Iteration ${state.iterations || 0}).${progress} ` +
        (hasHandoff
          ? `Es gibt eine Übergabe der vorherigen Session — lies ZUERST .marathon/handoff.md, dann ${taskFile} und .marathon/log.md. `
          : `Der komplette Zustand steht in ${taskFile} und .marathon/log.md — lies beide. `) +
        `Setze OHNE Rückfrage mit dem obersten offenen Task fort, sofern der Nutzer nicht gerade etwas anderes verlangt. ` +
        `Regeln: Task abarbeiten → verifizieren → abhaken → Checkpoint-Commit → Log aktualisieren.`,
    },
  })
);
