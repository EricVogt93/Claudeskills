'use strict';
// Gemeinsame Wegwerf-Muster für beide Hooks. Bewusst konservativ:
// lieber echten Müll verpassen als legitime Dateien anmahnen.

const JUNK_ANYWHERE = [
  /\.(bak|orig|rej|tmp|swp|swo)$/i,
  /~$/,
  /\.log$/i,
  /(^|\/)(scratch|debug|temp|tmp)[-_.]?[\w.-]*\.(sh|py|js|ts|mjs|cjs|txt|json|md|html)$/i,
  /(^|\/)(out|output|result|response|dump)[-_]?\d*\.(txt|json|log|html)$/i,
  /(^|\/)(tmp|temp|scratch|debug|outputs?)\/$/i, // untracked Wegwerf-Verzeichnisse
  /(^|\/)\.DS_Store$/,
  /(^|\/)nul$/i,
];

// Nur auf Repo-Root-Ebene verdächtig (in Unterordnern oft legitim benannt)
const JUNK_ROOT_ONLY = [
  /^(test|t|x|xx|foo|bar|baz|asdf|untitled|new|final|copy|kopie)\d*\.(sh|py|js|ts|mjs|txt|json|html)$/i,
  /^.*[-_.](v2|v3|final|neu|alt|old|backup|copy|kopie)\.(sh|py|js|ts|mjs|txt|json|md|html|css)$/i,
];

function isJunk(relPath) {
  if (JUNK_ANYWHERE.some((r) => r.test(relPath))) return true;
  if (!relPath.replace(/\/$/, '').includes('/') && JUNK_ROOT_ONLY.some((r) => r.test(relPath))) return true;
  return false;
}

function untrackedJunk(gitStatusPorcelain) {
  return gitStatusPorcelain
    .split('\n')
    .filter((l) => l.startsWith('?? '))
    .map((l) => l.slice(3).replace(/^"(.*)"$/, '$1'))
    .filter(isJunk);
}

module.exports = { isJunk, untrackedJunk };
