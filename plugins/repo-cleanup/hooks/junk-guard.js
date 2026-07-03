#!/usr/bin/env node
'use strict';
// Stop-Hook: Wenn am Turn-Ende untracked Wegwerf-Dateien im Repo liegen,
// wird Claude einmalig zum Aufräumen angehalten.
// Loop-Schutz doppelt: stop_hook_active (nie zweimal in Folge blocken) +
// Session-Statusdatei (jede Datei wird pro Session nur einmal angemahnt).

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const { untrackedJunk } = require('./junk-patterns');

let input = {};
try {
  input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
} catch {}

if (input.stop_hook_active) process.exit(0);

const cwd = input.cwd || process.cwd();

let status = '';
try {
  status = execSync('git status --porcelain', {
    cwd,
    encoding: 'utf8',
    timeout: 8000,
    stdio: ['ignore', 'pipe', 'ignore'],
  });
} catch {
  process.exit(0); // kein Git-Repo → nichts zu tun
}

const junk = untrackedJunk(status);
if (!junk.length) process.exit(0);

// Pro Session jede Datei nur einmal anmahnen
const sessionKey = crypto
  .createHash('sha256')
  .update(String(input.session_id || cwd))
  .digest('hex')
  .slice(0, 16);
const stateFile = path.join(os.tmpdir(), `repo-cleanup-guard-${sessionKey}.json`);
let reported = [];
try {
  reported = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
} catch {}

const fresh = junk.filter((f) => !reported.includes(f));
if (!fresh.length) process.exit(0);

try {
  fs.writeFileSync(stateFile, JSON.stringify([...new Set([...reported, ...junk])]));
} catch {}

const list = fresh.slice(0, 15).map((f) => `- ${f}`).join('\n');
const more = fresh.length > 15 ? `\n… und ${fresh.length - 15} weitere` : '';

console.log(
  JSON.stringify({
    decision: 'block',
    reason:
      `Repo-Hygiene (repo-cleanup Stop-Guard): ${fresh.length} untracked Datei(en) mit Wegwerf-Mustern im Repo:\n` +
      `${list}${more}\n\n` +
      `Bitte vor dem Beenden aufräumen: löschen bzw. ins Scratchpad verschieben — oder, falls eine Datei absichtlich bleibt, ` +
      `committen bzw. in .gitignore aufnehmen und dem Nutzer in einem Satz sagen warum. Danach normal beenden ` +
      `(dieser Hinweis kommt pro Datei nur einmal je Session).`,
  })
);
