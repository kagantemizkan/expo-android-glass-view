#!/usr/bin/env node
const { spawnSyncWithAutoShell } = require('./util');
const fs = require('fs');
const path = require('path');

const SUBTARGETS = ['plugin', 'cli', 'utils', 'scripts'];

function run(cmd, args = []) {
  const result = spawnSyncWithAutoShell(cmd, args, { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Clean and build main
fs.rmSync(path.join(process.cwd(), 'build'), { recursive: true, force: true });
run('tsc');

// tsc exits 0 without writing anything when noEmit is on (e.g. inherited through `extends`),
// which is how 0.1.4 and 0.1.5 were published without their JavaScript. Stop here instead.
if (!fs.existsSync(path.join(process.cwd(), 'build', 'index.js'))) {
  console.error('prepare: tsc emitted nothing (build/index.js is missing). Is noEmit on in tsconfig.json?');
  process.exit(1);
}

// Clean and build any existing subtargets
for (const target of SUBTARGETS) {
  const targetDir = path.join(process.cwd(), target);
  if (fs.existsSync(targetDir) && fs.existsSync(path.join(targetDir, 'tsconfig.json'))) {
    console.log(`Building ${target}`);
    fs.rmSync(path.join(targetDir, 'build'), { recursive: true, force: true });
    run('tsc', ['--build', targetDir]);
  }
}
