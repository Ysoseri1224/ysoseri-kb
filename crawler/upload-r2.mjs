import fs from 'node:fs/promises';
import path from 'node:path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const workspace = path.resolve('..');
const assets = await fs.readFile(path.join(workspace, 'assets.md'), 'utf8');
const value = (label) => {
  const line = assets.split(/\r?\n/).find((item) => item.includes(label));
  return line?.match(/`([^`]+)`/)?.[1];
};
const accessKeyId = value('Access Key ID');
const secretAccessKey = value('Secret Access ID');
const endpoint = assets.match(/S3 API endpoint[：:]\s*`([^`]+)`/)?.[1];
if (!accessKeyId || !secretAccessKey || !endpoint) throw new Error('assets.md 中缺少 R2 S3 凭据');

const bucket = process.env.KB_R2_BUCKET || 'ysoseri-kb-snapshots';
const payload = JSON.parse(await fs.readFile(path.resolve('data/import.json'), 'utf8'));
const root = `snapshots/${payload.job_id}`;
const client = new S3Client({ region: 'auto', endpoint, credentials: { accessKeyId, secretAccessKey } });
const manifest = { ...payload, pages: payload.pages.map(({ html, ...page }) => page) };
await client.send(new PutObjectCommand({ Bucket: bucket, Key: `${root}/manifest.json`, Body: JSON.stringify(manifest, null, 2), ContentType: 'application/json' }));

const concurrency = Math.max(1, Number(process.env.KB_R2_CONCURRENCY || 6));
let nextIndex = 0;
let completed = 0;
const failures = [];
async function uploadOne(index) {
  const page = payload.pages[index];
  const pathname = new URL(page.url).pathname.replace(/^\/+|\/+$/g, '').replace(/[^A-Za-z0-9._/-]/g, '_') || 'index';
  try {
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: `${root}/html/${pathname.replaceAll('/', '__')}.html`, Body: page.html, ContentType: 'text/html' }));
    completed += 1;
    process.stdout.write(`uploaded ${completed}/${payload.pages.length}\n`);
  } catch (error) {
    failures.push({ url: page.url, error: error.message });
  }
}
await Promise.all(Array.from({ length: Math.min(concurrency, payload.pages.length) }, async () => {
  while (nextIndex < payload.pages.length) { const index = nextIndex; nextIndex += 1; await uploadOne(index); }
}));
if (failures.length) {
  await fs.writeFile(path.resolve('data/r2-upload-failures.json'), JSON.stringify(failures, null, 2));
  throw new Error(`${failures.length} 个页面上传失败，详情见 data/r2-upload-failures.json`);
}
console.log(JSON.stringify({ bucket, root, pages: completed }));
