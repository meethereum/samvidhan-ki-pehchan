import util from 'util';

// ─── ANSI colour helpers ───────────────────────────────────────────────────────
const c = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  cyan:    '\x1b[36m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  red:     '\x1b[31m',
  magenta: '\x1b[35m',
  blue:    '\x1b[34m',
  white:   '\x1b[37m',
};

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

const levelColour: Record<LogLevel, string> = {
  INFO:  c.green,
  WARN:  c.yellow,
  ERROR: c.red,
  DEBUG: c.blue,
};

function timestamp(): string {
  return new Date().toISOString();
}

function pretty(value: unknown): string {
  if (typeof value === 'string') return value;
  return util.inspect(value, { depth: 6, colors: true, breakLength: 100 });
}

function log(level: LogLevel, message: string, meta?: unknown): void {
  const lc = levelColour[level];
  const prefix = `${c.dim}${timestamp()}${c.reset} ${lc}${c.bold}[${level}]${c.reset}`;
  const line   = `${prefix} ${c.white}${message}${c.reset}`;
  if (meta !== undefined) {
    console.log(line);
    console.log(pretty(meta));
  } else {
    console.log(line);
  }
}

export const logger = {
  info:  (msg: string, meta?: unknown) => log('INFO',  msg, meta),
  warn:  (msg: string, meta?: unknown) => log('WARN',  msg, meta),
  error: (msg: string, meta?: unknown) => log('ERROR', msg, meta),
  debug: (msg: string, meta?: unknown) => log('DEBUG', msg, meta),
};

export const morganFormat =
  `${c.cyan}:method${c.reset} ${c.magenta}:url${c.reset} ` +
  `${c.bold}:status${c.reset} ${c.dim}:response-time ms${c.reset} ` +
  `— ${c.dim}:res[content-length] bytes${c.reset}`;
