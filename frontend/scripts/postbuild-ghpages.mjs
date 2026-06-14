import { copyFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
const index = join(dist, 'index.html');

if (!existsSync(index)) {
  console.error('postbuild-ghpages: dist/index.html not found');
  process.exit(1);
}

writeFileSync(join(dist, '.nojekyll'), '');
copyFileSync(index, join(dist, '404.html'));
console.log('postbuild-ghpages: .nojekyll + 404.html OK');
