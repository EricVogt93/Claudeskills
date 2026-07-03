#!/usr/bin/env node
/**
 * llm-delegate MCP server (stdio, dependency-free).
 *
 * Delegates coding tasks to external LLMs:
 *   - glm      → Z.ai GLM        (OpenAI-compatible, default model glm-5.2)
 *   - kimi     → Moonshot Kimi   (OpenAI-compatible, default model kimi-k2.7-code)
 *   - opencode → opencode CLI    (headless `opencode run`, agentic by itself)
 *
 * Modes:
 *   - agent (default for glm/kimi): tool-calling loop — the external LLM gets
 *     list_files / read_file / write_file (+ optional run_command) scoped to
 *     the given workdir and implements the plan directly in the repo.
 *   - chat: single completion, returns the model's answer as text.
 *
 * Configuration via environment variables (see README):
 *   ZAI_API_KEY,  ZAI_BASE_URL,  ZAI_MODEL
 *   MOONSHOT_API_KEY (or KIMI_API_KEY), KIMI_BASE_URL, KIMI_MODEL
 *   OPENCODE_BIN, OPENCODE_MODEL, OPENCODE_TIMEOUT_S
 *   LLM_DELEGATE_ALLOW_SHELL=1  → enables run_command for the external LLM
 *   LLM_DELEGATE_MAX_TURNS      → agent loop turn limit (default 40)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');

// ---------------------------------------------------------------------------
// Provider registry
// ---------------------------------------------------------------------------

const PROVIDERS = {
  glm: {
    label: 'Z.ai GLM',
    kind: 'openai',
    baseUrl: () => process.env.ZAI_BASE_URL || 'https://api.z.ai/api/coding/paas/v4',
    apiKey: () => process.env.ZAI_API_KEY || '',
    model: () => process.env.ZAI_MODEL || 'glm-5.2',
    keyHint: 'ZAI_API_KEY',
  },
  kimi: {
    label: 'Moonshot Kimi',
    kind: 'openai',
    baseUrl: () => process.env.KIMI_BASE_URL || 'https://api.moonshot.ai/v1',
    apiKey: () => process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY || '',
    model: () => process.env.KIMI_MODEL || 'kimi-k2.7-code',
    keyHint: 'MOONSHOT_API_KEY (oder KIMI_API_KEY)',
  },
  opencode: {
    label: 'opencode CLI',
    kind: 'cli',
    bin: () => process.env.OPENCODE_BIN || 'opencode',
    model: () => process.env.OPENCODE_MODEL || '', // e.g. "opencode/gpt-5.5" (Zen) or "zai/glm-5.2"
    keyHint: 'opencode selbst konfigurieren (opencode auth login / Zen)',
  },
};

const MAX_TURNS = parseInt(process.env.LLM_DELEGATE_MAX_TURNS || '40', 10);
const ALLOW_SHELL = process.env.LLM_DELEGATE_ALLOW_SHELL === '1';
const REQUEST_TIMEOUT_MS = parseInt(process.env.LLM_DELEGATE_REQUEST_TIMEOUT_S || '300', 10) * 1000;
const MAX_FILE_READ = 256 * 1024; // 256 KiB per read_file
const IGNORED_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '__pycache__', '.venv', 'venv', 'target']);

// ---------------------------------------------------------------------------
// Workdir-scoped file tools handed to the external LLM (agent mode)
// ---------------------------------------------------------------------------

function safeResolve(workdir, p) {
  const abs = path.resolve(workdir, p || '.');
  const root = path.resolve(workdir);
  if (abs !== root && !abs.startsWith(root + path.sep)) {
    throw new Error(`Pfad verlässt das Arbeitsverzeichnis: ${p}`);
  }
  return abs;
}

function listFilesRecursive(root, dir, out, limit) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (out.length >= limit) return;
    if (e.name.startsWith('.') && e.name !== '.github') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (IGNORED_DIRS.has(e.name)) continue;
      listFilesRecursive(root, full, out, limit);
    } else {
      out.push(path.relative(root, full));
    }
  }
}

function buildAgentTools(workdir) {
  const changed = new Set();

  const defs = [
    {
      type: 'function',
      function: {
        name: 'list_files',
        description: 'List files in the working directory (recursive, common build/VCS dirs ignored).',
        parameters: {
          type: 'object',
          properties: { path: { type: 'string', description: 'Subdirectory relative to workdir (default ".")' } },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'read_file',
        description: 'Read a text file relative to the working directory.',
        parameters: {
          type: 'object',
          properties: { path: { type: 'string' } },
          required: ['path'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'write_file',
        description: 'Create or overwrite a text file relative to the working directory. Parent directories are created automatically.',
        parameters: {
          type: 'object',
          properties: { path: { type: 'string' }, content: { type: 'string' } },
          required: ['path', 'content'],
        },
      },
    },
  ];

  if (ALLOW_SHELL) {
    defs.push({
      type: 'function',
      function: {
        name: 'run_command',
        description: 'Run a shell command inside the working directory (e.g. tests, linters). 120s timeout.',
        parameters: {
          type: 'object',
          properties: { command: { type: 'string' } },
          required: ['command'],
        },
      },
    });
  }

  async function execute(name, args) {
    switch (name) {
      case 'list_files': {
        const dir = safeResolve(workdir, args.path || '.');
        const out = [];
        listFilesRecursive(dir, dir, out, 500);
        return out.length ? out.join('\n') : '(leer)';
      }
      case 'read_file': {
        const file = safeResolve(workdir, args.path);
        const stat = fs.statSync(file);
        if (stat.size > MAX_FILE_READ) {
          return fs.readFileSync(file, 'utf8').slice(0, MAX_FILE_READ) + '\n…(abgeschnitten)';
        }
        return fs.readFileSync(file, 'utf8');
      }
      case 'write_file': {
        const file = safeResolve(workdir, args.path);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, args.content, 'utf8');
        changed.add(path.relative(path.resolve(workdir), file));
        return `OK: ${args.path} geschrieben (${Buffer.byteLength(args.content)} bytes)`;
      }
      case 'run_command': {
        if (!ALLOW_SHELL) return 'run_command ist deaktiviert (LLM_DELEGATE_ALLOW_SHELL=1 setzen).';
        return await runShell(args.command, workdir, 120_000);
      }
      default:
        return `Unbekanntes Tool: ${name}`;
    }
  }

  return { defs, execute, changed };
}

function runShell(command, cwd, timeoutMs) {
  return new Promise((resolve) => {
    const child = spawn(command, { shell: true, cwd, timeout: timeoutMs });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (out += d));
    child.on('close', (code) => resolve(`exit=${code}\n${out.slice(0, 32_000)}`));
    child.on('error', (err) => resolve(`Fehler: ${err.message}`));
  });
}

// ---------------------------------------------------------------------------
// OpenAI-compatible chat completions
// ---------------------------------------------------------------------------

async function chatCompletion(provider, model, messages, tools) {
  const body = { model, messages, temperature: 0.2 };
  if (tools && tools.length) body.tools = tools;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${provider.baseUrl().replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey()}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`API-Fehler ${res.status} von ${provider.label}: ${text.slice(0, 2000)}`);
    }
    const data = await res.json();
    const choice = data.choices && data.choices[0];
    if (!choice) throw new Error(`Leere Antwort von ${provider.label}: ${JSON.stringify(data).slice(0, 500)}`);
    return choice.message;
  } finally {
    clearTimeout(timer);
  }
}

const AGENT_SYSTEM_PROMPT = `You are an expert software engineer acting as the IMPLEMENTER in a two-model workflow.
A planner model (Claude) has produced an implementation plan. Your job is to execute it precisely.

Rules:
- Use the provided tools (list_files, read_file, write_file${''}) to inspect the repository and write the code.
- Follow the plan. If the plan is ambiguous, make the most reasonable engineering choice and note it.
- Read existing files before modifying them; match the project's style and conventions.
- write_file overwrites the whole file — always write complete file contents, never diffs or placeholders like "... rest unchanged".
- When you are done, reply WITHOUT tool calls and summarize: which files you created/changed and any notes, caveats or follow-ups for the planner.`;

async function runAgentLoop(providerKey, provider, model, task, workdir, maxTurns) {
  const { defs, execute, changed } = buildAgentTools(workdir);
  const messages = [
    { role: 'system', content: AGENT_SYSTEM_PROMPT },
    { role: 'user', content: `Working directory: ${workdir}\n\nIMPLEMENTATION PLAN / TASK:\n\n${task}` },
  ];

  let turns = 0;
  let finalText = '';

  while (turns < maxTurns) {
    turns++;
    const msg = await chatCompletion(provider, model, messages, defs);
    messages.push(msg);

    const toolCalls = msg.tool_calls || [];
    if (!toolCalls.length) {
      finalText = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
      break;
    }

    for (const tc of toolCalls) {
      let args = {};
      try {
        args = JSON.parse(tc.function.arguments || '{}');
      } catch {
        /* tolerate malformed JSON args */
      }
      let result;
      try {
        result = await execute(tc.function.name, args);
      } catch (err) {
        result = `Fehler: ${err.message}`;
      }
      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: String(result),
      });
      log(`[${providerKey}] turn ${turns}: ${tc.function.name}(${(args.path || args.command || '').slice(0, 120)})`);
    }
  }

  if (!finalText) {
    finalText = `⚠️ Turn-Limit (${maxTurns}) erreicht, ohne dass das Modell fertig gemeldet hat. Bisher geänderte Dateien siehe unten — bitte prüfen.`;
  }

  const changedList = [...changed];
  return [
    `## Ergebnis von ${provider.label} (${model}, agent-Modus, ${turns} Turns)`,
    '',
    finalText,
    '',
    changedList.length
      ? `### Geänderte/erstellte Dateien (${changedList.length})\n${changedList.map((f) => `- ${f}`).join('\n')}`
      : '### Keine Dateien geändert.',
    '',
    '➡️ Nächster Schritt für den Planner: `git diff` prüfen und das Ergebnis verifizieren.',
  ].join('\n');
}

async function runChat(provider, model, task, contextBlocks) {
  const messages = [
    {
      role: 'system',
      content:
        'You are an expert software engineer. Answer with complete, production-quality code and concise explanations.',
    },
    { role: 'user', content: contextBlocks ? `${contextBlocks}\n\n---\n\n${task}` : task },
  ];
  const msg = await chatCompletion(provider, model, messages, null);
  return `## Antwort von ${provider.label} (${model}, chat-Modus)\n\n${msg.content}`;
}

// ---------------------------------------------------------------------------
// opencode CLI provider
// ---------------------------------------------------------------------------

function runOpencode(task, workdir, model) {
  const bin = PROVIDERS.opencode.bin();
  const timeoutMs = parseInt(process.env.OPENCODE_TIMEOUT_S || '900', 10) * 1000;
  const args = ['run'];
  if (model) args.push('--model', model);
  args.push(task);

  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { cwd: workdir, timeout: timeoutMs });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', (e) =>
      reject(
        new Error(
          e.code === 'ENOENT'
            ? `opencode-Binary "${bin}" nicht gefunden. Installieren: https://opencode.ai (oder OPENCODE_BIN setzen).`
            : e.message
        )
      )
    );
    child.on('close', (code) => {
      const header = `## Ergebnis von opencode${model ? ` (${model})` : ''} — exit=${code}`;
      const body = out.trim() || '(keine Ausgabe auf stdout)';
      const errBlock = err.trim() ? `\n\n<details>stderr:\n${err.slice(0, 8000)}</details>` : '';
      resolve(`${header}\n\n${body.slice(0, 60_000)}${errBlock}\n\n➡️ Nächster Schritt: \`git diff\` prüfen.`);
    });
  });
}

// ---------------------------------------------------------------------------
// MCP tool implementations
// ---------------------------------------------------------------------------

function providerStatus() {
  const lines = ['# Konfigurierte Provider', ''];
  for (const [key, p] of Object.entries(PROVIDERS)) {
    if (p.kind === 'openai') {
      const hasKey = Boolean(p.apiKey());
      lines.push(
        `- **${key}** (${p.label}): Modell \`${p.model()}\`, Endpoint \`${p.baseUrl()}\` — API-Key: ${
          hasKey ? '✅ gesetzt' : `❌ fehlt (${p.keyHint})`
        }`
      );
    } else {
      lines.push(
        `- **${key}** (${p.label}): Binary \`${p.bin()}\`${p.model() ? `, Modell \`${p.model()}\`` : ' (Modell aus opencode-Config)'} — Auth: ${p.keyHint}`
      );
    }
  }
  lines.push('', `Agent-Loop: max. ${MAX_TURNS} Turns, run_command ${ALLOW_SHELL ? 'AKTIV ⚠️' : 'deaktiviert'}.`);
  return lines.join('\n');
}

async function toolDelegateTask(args) {
  const providerKey = String(args.provider || '').toLowerCase();
  const provider = PROVIDERS[providerKey];
  if (!provider) {
    throw new Error(`Unbekannter Provider "${args.provider}". Verfügbar: ${Object.keys(PROVIDERS).join(', ')}`);
  }
  const task = args.task;
  if (!task || typeof task !== 'string') throw new Error('Parameter "task" (string) ist erforderlich.');

  const workdir = path.resolve(args.workdir || process.cwd());
  if (!fs.existsSync(workdir) || !fs.statSync(workdir).isDirectory()) {
    throw new Error(`workdir existiert nicht oder ist kein Verzeichnis: ${workdir}`);
  }

  // Optional file context, prepended to the task (useful in chat mode).
  let contextBlocks = '';
  for (const f of args.context_files || []) {
    const file = safeResolve(workdir, f);
    const content = fs.readFileSync(file, 'utf8').slice(0, MAX_FILE_READ);
    contextBlocks += `### Datei: ${f}\n\`\`\`\n${content}\n\`\`\`\n\n`;
  }

  if (provider.kind === 'cli') {
    const fullTask = contextBlocks ? `${contextBlocks}\n---\n\n${task}` : task;
    return runOpencode(fullTask, workdir, args.model || provider.model());
  }

  if (!provider.apiKey()) {
    throw new Error(`Kein API-Key für ${provider.label}. Bitte ${provider.keyHint} setzen.`);
  }

  const model = args.model || provider.model();
  const mode = args.mode || 'agent';

  if (mode === 'chat') {
    return runChat(provider, model, task, contextBlocks);
  }
  const maxTurns = Math.min(parseInt(args.max_turns || MAX_TURNS, 10) || MAX_TURNS, 100);
  const fullTask = contextBlocks ? `${contextBlocks}\n---\n\n${task}` : task;
  return runAgentLoop(providerKey, provider, model, fullTask, workdir, maxTurns);
}

const TOOLS = [
  {
    name: 'delegate_task',
    description:
      'Delegiert einen Coding-Task an ein externes LLM. Typischer Ablauf: Claude erstellt einen präzisen Implementierungsplan und übergibt ihn hier als "task"; der Provider (glm = Z.ai GLM-5.2, kimi = Moonshot Kimi k2.7, opencode = opencode CLI) implementiert ihn im workdir. Im "agent"-Modus (Default) bekommt das externe Modell Datei-Tools und schreibt den Code direkt; im "chat"-Modus liefert es nur eine Textantwort. Gibt eine Zusammenfassung + Liste geänderter Dateien zurück — danach immer git diff prüfen.',
    inputSchema: {
      type: 'object',
      properties: {
        provider: {
          type: 'string',
          enum: ['glm', 'kimi', 'opencode'],
          description: 'Ziel-LLM: glm (Z.ai), kimi (Moonshot), opencode (lokale CLI).',
        },
        task: {
          type: 'string',
          description:
            'Der vollständige Implementierungsplan/Task. Je präziser (Dateien, gewünschtes Verhalten, Akzeptanzkriterien), desto besser das Ergebnis.',
        },
        mode: {
          type: 'string',
          enum: ['agent', 'chat'],
          description:
            'agent (Default): Modell implementiert direkt via Datei-Tools im workdir. chat: nur Textantwort. Für opencode irrelevant (immer agentisch).',
        },
        workdir: {
          type: 'string',
          description: 'Arbeitsverzeichnis (Default: cwd). Datei-Zugriffe des externen LLM sind hierauf beschränkt.',
        },
        model: {
          type: 'string',
          description: 'Modell-Override, z.B. "glm-5.2", "kimi-k2.7-code" oder für opencode "opencode/gpt-5.5".',
        },
        context_files: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optionale Dateien (relativ zum workdir), deren Inhalt dem Task vorangestellt wird.',
        },
        max_turns: {
          type: 'number',
          description: `Max. Tool-Turns im agent-Modus (Default ${MAX_TURNS}, Obergrenze 100).`,
        },
      },
      required: ['provider', 'task'],
    },
  },
  {
    name: 'list_providers',
    description:
      'Zeigt alle verfügbaren Delegations-Provider, deren Default-Modelle, Endpoints und ob API-Keys konfiguriert sind.',
    inputSchema: { type: 'object', properties: {} },
  },
];

// ---------------------------------------------------------------------------
// Minimal MCP stdio transport (newline-delimited JSON-RPC 2.0)
// ---------------------------------------------------------------------------

function log(msg) {
  process.stderr.write(`[llm-delegate] ${msg}\n`);
}

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

function reply(id, result) {
  send({ jsonrpc: '2.0', id, result });
}

function replyError(id, code, message) {
  send({ jsonrpc: '2.0', id, error: { code, message } });
}

async function handle(msg) {
  const { id, method, params } = msg;

  switch (method) {
    case 'initialize':
      reply(id, {
        protocolVersion: (params && params.protocolVersion) || '2025-06-18',
        capabilities: { tools: {} },
        serverInfo: { name: 'llm-delegate', version: '0.1.0' },
      });
      return;

    case 'notifications/initialized':
    case 'notifications/cancelled':
      return; // notifications: no response

    case 'ping':
      reply(id, {});
      return;

    case 'tools/list':
      reply(id, { tools: TOOLS });
      return;

    case 'tools/call': {
      const name = params && params.name;
      const args = (params && params.arguments) || {};
      try {
        let text;
        if (name === 'delegate_task') text = await toolDelegateTask(args);
        else if (name === 'list_providers') text = providerStatus();
        else throw new Error(`Unbekanntes Tool: ${name}`);
        reply(id, { content: [{ type: 'text', text }] });
      } catch (err) {
        log(`Tool-Fehler (${name}): ${err.message}`);
        reply(id, { content: [{ type: 'text', text: `❌ ${err.message}` }], isError: true });
      }
      return;
    }

    case 'resources/list':
      reply(id, { resources: [] });
      return;
    case 'prompts/list':
      reply(id, { prompts: [] });
      return;

    default:
      if (id !== undefined && id !== null) replyError(id, -32601, `Method not found: ${method}`);
  }
}

let pending = 0;
let stdinClosed = false;

function maybeExit() {
  if (stdinClosed && pending === 0) process.exit(0);
}

const rl = readline.createInterface({ input: process.stdin, terminal: false });
rl.on('line', (line) => {
  line = line.trim();
  if (!line) return;
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    log(`Ungültiges JSON verworfen: ${line.slice(0, 200)}`);
    return;
  }
  pending++;
  handle(msg)
    .catch((err) => {
      log(`Unerwarteter Fehler: ${err.stack || err.message}`);
      if (msg.id !== undefined && msg.id !== null) replyError(msg.id, -32603, err.message);
    })
    .finally(() => {
      pending--;
      maybeExit();
    });
});

// Bei stdin-Ende laufende Tool-Calls noch abschließen, dann beenden.
process.stdin.on('close', () => {
  stdinClosed = true;
  maybeExit();
});
log('MCP-Server gestartet (stdio).');
