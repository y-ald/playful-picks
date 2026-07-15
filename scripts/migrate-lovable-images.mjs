// One-off migration: move product images from Lovable-hosted /__l5e/ asset
// paths into Supabase Storage, then rewrite products.image_url /
// original_image_url / additional_images to absolute Supabase public URLs.
//
// Storage layout produced (bucket: "products"):
//   products/{productId}/main-{ts}.{ext}
//   products/{productId}/original-{ts}.{ext}
//   products/{productId}/additional/{ts}-{i}.{ext}
//
// Usage:
//   1. Put your Supabase service_role key in supabase/.env:
//        SUPABASE_SERVICE_ROLE_KEY=eyJ...
//   2. From the playful-picks/ directory run:
//        node scripts/migrate-lovable-images.mjs
//   3. Add --dry-run to preview without uploading or writing:
//        node scripts/migrate-lovable-images.mjs --dry-run
//
// Safe to re-run: rows whose URLs are already absolute (http...) are skipped.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');

const LOVABLE_HOST = 'https://3923f859-5de7-429d-b09a-7e8f16b14485.lovableproject.com';
const BUCKET = 'products';

function loadEnvFile(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const raw of readFileSync(path, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const rootEnv = loadEnvFile(join(ROOT, '.env'));
const supaEnv = loadEnvFile(join(ROOT, 'supabase', '.env'));

const SUPABASE_URL =
  process.env.SUPABASE_URL || rootEnv.VITE_SUPABASE_URL || rootEnv.SUPABASE_URL;
// Prefer the new "secret key" (sb_secret_...); fall back to the deprecated
// legacy service_role JWT. Both grant elevated (RLS-bypassing) access.
const SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  supaEnv.SUPABASE_SECRET_KEY ||
  supaEnv.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error('Missing SUPABASE URL. Set VITE_SUPABASE_URL in .env');
  process.exit(1);
}
if (!SECRET_KEY) {
  console.error(
    'Missing secret key. Set SUPABASE_SECRET_KEY (sb_secret_...) in supabase/.env\n' +
    '(the legacy SUPABASE_SERVICE_ROLE_KEY still works too).',
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SECRET_KEY, {
  auth: { persistSession: false },
});

const isLovable = (url) => typeof url === 'string' && url.startsWith('/__l5e/');
const extFromContentType = (ct) => {
  if (!ct) return 'jpg';
  if (ct.includes('png')) return 'png';
  if (ct.includes('webp')) return 'webp';
  if (ct.includes('gif')) return 'gif';
  return 'jpg';
};

async function ensureBucket() {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw error;
  if (!buckets?.find((b) => b.name === BUCKET)) {
    console.log(`Creating public bucket "${BUCKET}"`);
    if (!DRY_RUN) {
      const { error: e } = await supabase.storage.createBucket(BUCKET, { public: true });
      if (e) throw e;
    }
  }
}

async function migrateOne(lovablePath, destPathNoExt) {
  const src = LOVABLE_HOST + lovablePath;
  const res = await fetch(src);
  if (!res.ok) throw new Error(`fetch ${src} -> HTTP ${res.status}`);
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  const ext = extFromContentType(contentType);
  const bytes = new Uint8Array(await res.arrayBuffer());
  const destPath = `${destPathNoExt}.${ext}`;

  console.log(`  ${lovablePath}\n    -> ${BUCKET}/${destPath} (${bytes.length} bytes, ${contentType})`);
  if (DRY_RUN) {
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${destPath}`;
  }

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(destPath, bytes, { contentType, upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(destPath);
  return data.publicUrl;
}

async function main() {
  console.log(`Migration${DRY_RUN ? ' (DRY RUN)' : ''} against ${SUPABASE_URL}\n`);
  await ensureBucket();

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, image_url, original_image_url, additional_images');
  if (error) throw error;

  let changed = 0;
  for (const p of products) {
    const ts = Date.now();
    const patch = {};
    const needsMigration =
      isLovable(p.image_url) ||
      isLovable(p.original_image_url) ||
      (Array.isArray(p.additional_images) && p.additional_images.some(isLovable));

    if (!needsMigration) continue;
    console.log(`\nProduct ${p.id} — ${p.name}`);

    if (isLovable(p.image_url)) {
      patch.image_url = await migrateOne(p.image_url, `${p.id}/main-${ts}`);
    }
    if (isLovable(p.original_image_url)) {
      patch.original_image_url = await migrateOne(p.original_image_url, `${p.id}/original-${ts}`);
    }
    if (Array.isArray(p.additional_images) && p.additional_images.some(isLovable)) {
      const next = [];
      for (let i = 0; i < p.additional_images.length; i++) {
        const url = p.additional_images[i];
        next.push(isLovable(url) ? await migrateOne(url, `${p.id}/additional/${ts}-${i}`) : url);
      }
      patch.additional_images = next;
    }

    if (Object.keys(patch).length === 0) continue;
    if (!DRY_RUN) {
      const { error: upErr } = await supabase.from('products').update(patch).eq('id', p.id);
      if (upErr) throw upErr;
    }
    console.log('  DB row updated', DRY_RUN ? '(skipped, dry run)' : 'OK');
    changed++;
  }

  console.log(`\nDone. ${changed} product(s) ${DRY_RUN ? 'would be' : ''} migrated.`);
}

main().catch((e) => {
  console.error('\nMigration failed:', e);
  process.exit(1);
});
