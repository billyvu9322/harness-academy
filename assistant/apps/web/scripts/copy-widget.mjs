// Copy the built widget bundle into academy/public so the academy site can self-host it.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url)); // assistant/apps/web/scripts
const src = resolve(here, '../dist-widget/assistant-widget.js');
const destDir = resolve(here, '../../../../academy/public');
const dest = resolve(destDir, 'assistant-widget.js');

if (!existsSync(src)) {
  console.error(`Widget bundle not found at ${src}. Run the widget build first.`);
  process.exit(1);
}
mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log(`Copied widget → ${dest}`);
