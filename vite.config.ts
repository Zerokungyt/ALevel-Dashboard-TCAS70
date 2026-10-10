import { defineConfig } from 'vite';
import { execFileSync } from 'node:child_process';
import { basename } from 'node:path';
import { pagesBase } from './src/base-path.ts';

function repositoryName(): string {
  if (process.env.GITHUB_REPOSITORY) return process.env.GITHUB_REPOSITORY;
  try {
    const remote = execFileSync('git', ['config', '--get', 'remote.origin.url'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    const match = remote.match(/[:/]([^/:]+)\/([^/]+?)(?:\.git)?\/?$/);
    if (match) return `${match[1]}/${match[2]}`;
  } catch { /* A new checkout has no remote yet. */ }
  return basename(process.cwd());
}

export default defineConfig({
  base: pagesBase(repositoryName(), process.env.PAGES_BASE_PATH),
  build: { sourcemap: false, reportCompressedSize: true },
});
