import { spawn } from 'node:child_process';

// Never use the developer's .env API origin for mock browser tests (including SSR metadata).
const child = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', '3005'],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_PUBLIC_API_MODE: 'mock',
      NEXT_PUBLIC_SITE_URL: 'http://127.0.0.1:3005',
      MEETEAM_API_BASE_URL: 'http://127.0.0.1:9',
      NEXT_TELEMETRY_DISABLED: '1',
    },
  },
);
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
