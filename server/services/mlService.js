/**
 * mlService.js
 * Spawns the Python FastAPI ML service (ml-service/) as a managed child
 * process when the Node server starts.
 *
 *  - Pipes stdout / stderr with a coloured [ML] prefix
 *  - Auto-restarts on crash (up to MAX_RESTARTS times, with backoff)
 *  - Killed cleanly when the Node process exits (SIGINT / SIGTERM / exit)
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ml-service/ sits one level above server/
const ML_DIR = path.resolve(__dirname, '..', '..', 'ml-service');
const ML_PORT = process.env.ML_PORT || 8000;

const MAX_RESTARTS = 5;
const RESTART_DELAY_MS = 3000;

// ── Colour helpers (no dep) ───────────────────────────────────────────────────
const cyan   = (s) => `\x1b[36m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const red    = (s) => `\x1b[31m${s}\x1b[0m`;
const green  = (s) => `\x1b[32m${s}\x1b[0m`;
const PREFIX = cyan('[ML] ');

// ── Resolve the uvicorn executable inside the venv ───────────────────────────
function resolveCommand() {
  const isWin = process.platform === 'win32';

  // Use the venv Python directly with -m uvicorn — most reliable when spawned
  // from Node (avoids .exe wrapper env issues on Windows).
  const venvPython = path.join(
    ML_DIR, '.venv', isWin ? path.join('Scripts', 'python.exe') : path.join('bin', 'python'),
  );

  if (fs.existsSync(venvPython)) {
    return {
      cmd: venvPython,
      args: ['-m', 'uvicorn', 'main:app', '--reload', '--port', String(ML_PORT)],
    };
  }

  // Fallback: uv run (works when pyproject.toml / uv.lock present)
  return {
    cmd: isWin ? 'uv.exe' : 'uv',
    args: ['run', 'uvicorn', 'main:app', '--reload', '--port', String(ML_PORT)],
  };
}

// ── Main spawn logic ──────────────────────────────────────────────────────────
let mlProc = null;
let restarts = 0;
let stopping = false;

function startML() {
  if (stopping) return;
  if (!fs.existsSync(ML_DIR)) {
    console.warn(yellow(`[ML] ml-service/ directory not found at ${ML_DIR} — skipping ML spawn`));
    return;
  }

  const { cmd, args } = resolveCommand();

  console.log(green(`[ML] Starting FastAPI on :${ML_PORT}  (${path.basename(cmd)} ${args.join(' ')})`));

  mlProc = spawn(cmd, args, {
    cwd: ML_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
    env: { ...process.env },   // inherit all env vars (GEMINI_API_KEY, etc.)
  });

  const tag = (line) => `${PREFIX}${line}`;

  mlProc.stdout.on('data', (d) =>
    d.toString().split('\n').filter(Boolean).forEach((l) => console.log(tag(l))),
  );
  mlProc.stderr.on('data', (d) =>
    d.toString().split('\n').filter(Boolean).forEach((l) => {
      // uvicorn writes INFO/WARNING to stderr — show them but don't alarm
      const line = l.trim();
      if (/^INFO|^WARNING/.test(line)) console.log(tag(line));
      else console.error(red(tag(line)));
    }),
  );

  mlProc.on('close', (code) => {
    mlProc = null;
    if (stopping) return;
    if (restarts < MAX_RESTARTS) {
      restarts++;
      const delay = RESTART_DELAY_MS * restarts;
      console.warn(yellow(`[ML] Process exited (code ${code}). Restart ${restarts}/${MAX_RESTARTS} in ${delay / 1000}s…`));
      setTimeout(startML, delay);
    } else {
      console.error(red(`[ML] Gave up after ${MAX_RESTARTS} restarts. Start ml-service manually: cd ml-service && uv run uvicorn main:app --reload`));
    }
  });

  mlProc.on('error', (err) => {
    console.error(red(`[ML] Failed to spawn: ${err.message}`));
    if (err.code === 'ENOENT') {
      console.error(red(`[ML] uvicorn not found. Run: cd ml-service && uv pip install -r requirements.txt --python .venv/Scripts/python.exe`));
    }
  });
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────
function stopML() {
  stopping = true;
  if (mlProc) {
    console.log(yellow('[ML] Shutting down ML service…'));
    mlProc.kill('SIGTERM');
    mlProc = null;
  }
}

['exit', 'SIGINT', 'SIGTERM'].forEach((sig) => process.on(sig, stopML));

// ── Export ────────────────────────────────────────────────────────────────────
export { startML, stopML };
