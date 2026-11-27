// main.ts — hands in Meridian Run: copies game/ and screenshots/ from
// this repository into the output directory, then writes the dossier
// that buildDossier produces from those very files.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function copyTree(name: string): void {
  const src = join(repoRoot, name);
  const dst = join(outDir, name);
  if (!existsSync(src)) throw new Error(`main.ts: missing ${name}/ in the repository`);
  cpSync(src, dst, { recursive: true });
}

// Empty the output directory's CONTENTS, never the directory itself:
// in the grader /output is a mount point whose parent is read-only, so
// removing /output itself fails, but its children can be cleared.
mkdirSync(outDir, { recursive: true });
for (const child of readdirSync(outDir)) {
  rmSync(join(outDir, child), { recursive: true, force: true });
}
copyTree('game');
copyTree('screenshots');
const dossier = buildDossier(outDir, caps);
const dossierPath = join(outDir, 'dossier.json');
writeFileSync(dossierPath, dossier);
// Sanity: the dossier must be non-empty and the game page must be in place.
if (dossier.length < 1000) throw new Error('main.ts: dossier unexpectedly small');
if (!existsSync(join(outDir, 'game', 'index.html'))) throw new Error('main.ts: game/index.html missing from output');
console.log(`wrote ${dossierPath} (${dossier.length} bytes)`);
