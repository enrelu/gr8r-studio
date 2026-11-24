import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

const root = process.cwd();
const bin = resolve(root, 'pocketbase', process.platform === 'win32' ? 'pocketbase.exe' : 'pocketbase');

if (!existsSync(bin)) {
  console.error('No se encontró PocketBase en:', bin);
  console.error('Ejecuta: powershell -ExecutionPolicy Bypass -File scripts/setup-pb.ps1');
  process.exit(1);
}

const pubIndex = resolve(root, 'pocketbase', 'pb_public', 'index.html');
if (!existsSync(pubIndex)) {
  console.warn('Aviso: pocketbase/pb_public no existe todavía. Ejecuta "npm run build:pb" para compilar la interfaz.');
}

const child = spawn(bin, ['serve', ...process.argv.slice(2)], {
  cwd: root,
  stdio: 'inherit',
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    if (!child.killed) child.kill(sig);
  });
}

child.on('exit', code => process.exit(code ?? 0));
