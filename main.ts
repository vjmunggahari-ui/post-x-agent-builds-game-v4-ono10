// NEON ORBIT v4 entrypoint (Node 22, standard library only): copies POST.json
// from the repository root to MAKEFUN_OUTPUT_DIR, where the gate reads it,
// then reads the copy back and verifies it byte-for-byte against the source
// so a silent partial write can never pass as success.
// Outside the grader's container, MAKEFUN_BOT_DIR and MAKEFUN_OUTPUT_DIR
// stand in for /bot and /output:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const src = join(BOT_DIR, 'POST.json');
const dst = join(OUTPUT_DIR, 'POST.json');

mkdirSync(OUTPUT_DIR, { recursive: true });
copyFileSync(src, dst);

// Read-back self-check: the copy must be byte-identical to the source, and
// it must parse as JSON carrying a string url field.
const a = readFileSync(src);
const b = readFileSync(dst);
if (!a.equals(b)) {
  console.error('POST.json copy differs from source');
  process.exit(1);
}
let parsed: unknown;
try {
  parsed = JSON.parse(b.toString('utf8'));
} catch (err) {
  console.error(`POST.json is not valid JSON: ${(err as Error).message}`);
  process.exit(1);
}
if (typeof parsed !== 'object' || parsed === null || typeof (parsed as { url?: unknown }).url !== 'string') {
  console.error('POST.json has no string url field');
  process.exit(1);
}
// Second check: the parsed url in the copy must equal the parsed url in the
// source, and the output size must equal the source size — a copy that
// parsed fine but silently lost the address would still fail here.
const srcParsed: unknown = JSON.parse(a.toString('utf8'));
if (
  typeof srcParsed !== 'object' || srcParsed === null ||
  (srcParsed as { url?: unknown }).url !== (parsed as { url?: unknown }).url ||
  b.length !== a.length
) {
  console.error('POST.json copy does not match the source');
  process.exit(1);
}
