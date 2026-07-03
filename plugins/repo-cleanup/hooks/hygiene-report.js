#!/usr/bin/env node
'use strict';
// SessionStart-Hook: kompakter Repo-Hygiene-Report als Kontext für Claude.
// Meldet Wegwerf-Dateien, tote Branches und Stash-Bestand — ohne zu blocken.

const fs = require('fs');
const { execSync } = require('child_process');
const { untrackedJunk } = require('./junk-patterns');

let input = {};
try {
  input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
} catch {}
const cwd = input.cwd || process.cwd();

function git(cmd) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8', timeout: 8000, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

if (!git('git rev-parse --git-dir')) process.exit(0);

const parts = [];

const junk = untrackedJunk(git('git status --porcelain'));
if (junk.length) {
  parts.push(
    `- ${junk.length} untracked Wegwerf-Datei(en): ${junk.slice(0, 8).join(', ')}${junk.length > 8 ? ', …' : ''}`
  );
}

const PROTECTED = /^(main|master|develop|dev|release([/].*)?)$/;
const merged = git('git branch --merged')
  .split('\n')
  .map((l) => l.trim())
  .filter((b) => b && !b.startsWith('*') && !PROTECTED.test(b));
if (merged.length) {
  parts.push(`- ${merged.length} bereits gemergte lokale Branch(es): ${merged.slice(0, 6).join(', ')}${merged.length > 6 ? ', …' : ''}`);
}

const gone = git('git branch -vv')
  .split('\n')
  .filter((l) => l.includes(': gone]'))
  .map((l) => l.replace(/^[*+ ]+/, '').split(/\s+/)[0])
  .filter((b) => b && !PROTECTED.test(b));
if (gone.length) {
  parts.push(`- ${gone.length} Branch(es) mit gelöschtem Upstream (': gone'): ${gone.slice(0, 6).join(', ')}${gone.length > 6 ? ', …' : ''}`);
}

const stashes = git('git stash list').split('\n').filter(Boolean);
if (stashes.length >= 3) {
  parts.push(`- ${stashes.length} Stash-Einträge (Stash ist Zwischenablage, keine Datenbank)`);
}

if (!parts.length) process.exit(0);

console.log(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext:
        `Repo-Hygiene-Report (Plugin repo-cleanup):\n${parts.join('\n')}\n` +
        `Wenn es gerade passt, biete dem Nutzer einen Cleanup an (Skill "repo-cleanup" bzw. /repo-cleanup:cleanup). Nichts ungefragt löschen.`,
    },
  })
);
