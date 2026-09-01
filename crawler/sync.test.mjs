import test from 'node:test';
import assert from 'node:assert/strict';

test('crawler package is configured for explicit source scope', async () => {
  const design = await (await import('node:fs/promises')).readFile(new URL('../kb-design.md', import.meta.url), 'utf8');
  assert.match(design, /\/potentials\/system/);
  assert.match(design, /\/entry/);
});
