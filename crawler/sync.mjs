import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import * as cheerio from 'cheerio';

const BASE = 'https://www.ctcms.nist.gov';
const args = process.argv.slice(2);
const arg = (name, fallback = null) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const maxSystems = Number(arg('--max-systems', '0')) || 0;
const maxEntries = Number(arg('--max-entries', '0')) || 0;
const onlySystems = arg('--systems', '');
const outDir = path.resolve('data');

function absolute(href) { return new URL(href, `${BASE}/potentials/`).href.split('#')[0]; }
function clean(value) { return String(value ?? '').replace(/\s+/g, ' ').trim(); }
function html($, selector) { return $(selector).first().html()?.trim() ?? ''; }
function text($, selector) { return clean($(selector).first().text()); }
function yearOf(value) { const m = String(value).match(/\b(19|20)\d{2}\b/); return m ? Number(m[0]) : null; }
function sql(value) { if (value === null || value === undefined || value === '') return 'NULL'; return `'${String(value).replaceAll("'", "''")}'`; }

async function get(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'ysoseri-kb-sync/0.1 (+https://luckyrong.ysoseri.us/kb)' } });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return { url, html: await response.text(), lastModified: response.headers.get('last-modified'), etag: response.headers.get('etag') };
}

function parseSystemPage(page) {
  const $ = cheerio.load(page.html);
  const systems = [];
  const entries = new Map();
  $('a[name]').each((_, anchor) => {
    const systemId = clean($(anchor).attr('name'));
    if (!systemId || !/^[A-Za-z0-9-]+$/.test(systemId)) return;
    let node = $(anchor).next();
    let header = null;
    while (node.length) { if (node.is('.page-header')) { header = node; break; } if (node.is('a[name]')) break; node = node.next(); }
    if (!header) return;
    const name = text($, header.find('h1')) || systemId;
    const cards = [];
    node = header.next();
    while (node.length && !node.is('.page-header')) { if (node.is('.card')) cards.push(node); node = node.next(); }
    for (const card of cards) {
      const link = card.find('.card-header a').first();
      const href = link.attr('href');
      if (!href) continue;
      const sourceUrl = absolute(href);
      const id = sourceUrl.split('/').filter(Boolean).pop();
      const citation = html($, card.find('.citation'));
      const abstract = html($, card.find('.abstract'));
      const notes = html($, card.find('.description-notes'));
      const format = text($, card.find('.format'));
      const method = (format.match(/(?:pair_style|style)\s+([A-Za-z0-9_-]+)/i)?.[1] ?? format.split(/\s+/).pop() ?? '').trim();
      const authors = clean(`${citation} ${abstract}`.replace(/<[^>]+>/g, ''));
      const entry = { id, title: clean(link.text()), source_url: sourceUrl, system_id: systemId, citation_html: citation, abstract_html: abstract, notes_html: notes, method, authors, year: yearOf(citation), content_text: clean(card.text()), implementations: [] };
      card.find('.implementation-notes').each((__, impl) => {
        const implLink = $(impl).find('a').first();
        const implUrl = implLink.attr('href') ? absolute(implLink.attr('href')) : null;
        const label = text($, $(impl).prev('.format')) || text($, $(impl).find('.format'));
        const implementation = { id: `${id}:${implUrl ?? label}`, entry_id: id, label, source_url: implUrl, notes_html: html($, $(impl)), files: [] };
        $(impl).find('a[href*="/Download/"]').each((___, file) => { const fileUrl = absolute($(file).attr('href')); implementation.files.push({ id: fileUrl, implementation_id: implementation.id, entry_id: id, name: clean($(file).text()), source_url: fileUrl, kind: path.extname(new URL(fileUrl).pathname).slice(1) }); });
        entry.implementations.push(implementation);
      });
      if (!entries.has(id)) entries.set(id, entry);
    }
    systems.push({ id: systemId, name, source_url: `${page.url}#${systemId}`, source_anchor: systemId, description_html: '', potential_count: cards.length });
  });
  return { systems, entries: [...entries.values()] };
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  const index = await get(`${BASE}/potentials/`);
  const $index = cheerio.load(index.html);
  const systemUrls = [...new Set($index('a[href*="system/"]').map((_, a) => absolute($index(a).attr('href'))).get())].filter((u) => /\/potentials\/system\/[^/]+\/?$/.test(u));
  const filtered = onlySystems ? systemUrls.filter((u) => u.toLowerCase().includes(`/system/${onlySystems.toLowerCase()}`)) : systemUrls;
  const selected = maxSystems ? filtered.slice(0, maxSystems) : filtered;
  const systems = []; const entries = new Map(); const pages = [index];
  for (const url of selected) {
    try { const page = await get(url); pages.push(page); const parsed = parseSystemPage(page); systems.push(...parsed.systems); for (const entry of parsed.entries) if (!entries.has(entry.id)) entries.set(entry.id, entry); } catch (error) { console.warn(`skip ${url}: ${error.message}`); }
  }
  let allEntries = [...entries.values()];
  if (maxEntries) allEntries = allEntries.slice(0, maxEntries);
  const jobId = `sync-${new Date().toISOString().replace(/[-:.TZ]/g, '')}`;
  const payload = { generated_at: new Date().toISOString(), job_id: jobId, source_base: BASE, systems, entries: allEntries, pages: pages.map((p) => ({ url: p.url, last_modified: p.lastModified, etag: p.etag, html: p.html })) };
  await fs.writeFile(path.join(outDir, 'import.json'), JSON.stringify(payload, null, 2), 'utf8');
  const statements = [`INSERT OR REPLACE INTO sync_jobs (id, mode, status, started_at, finished_at, discovered_count, fetched_count, added_count) VALUES (${sql(jobId)}, 'manual', 'completed', ${sql(payload.generated_at)}, ${sql(payload.generated_at)}, ${systems.length + allEntries.length}, ${pages.length}, ${systems.length + allEntries.length});`];
  for (const page of pages) statements.push(`INSERT OR REPLACE INTO source_pages (id,url,path,title,status,last_modified,etag,fetched_at,sync_job_id) VALUES (${sql(page.url)},${sql(page.url)},${sql(new URL(page.url).pathname)},${sql(cheerio.load(page.html)('title').first().text())},'active',${sql(page.lastModified)},${sql(page.etag)},${sql(payload.generated_at)},${sql(jobId)});`);
  for (const system of systems) statements.push(`INSERT OR REPLACE INTO systems (id,name,source_url,source_anchor,description_html,potential_count,status,updated_at) VALUES (${sql(system.id)},${sql(system.name)},${sql(system.source_url)},${sql(system.source_anchor)},${sql(system.description_html)},${system.potential_count},'active',${sql(payload.generated_at)});`);
  for (const entry of allEntries) {
    statements.push(`INSERT OR REPLACE INTO potential_entries (id,title,source_url,system_id,citation_html,abstract_html,notes_html,method,authors,year,content_text,status,updated_at) VALUES (${sql(entry.id)},${sql(entry.title)},${sql(entry.source_url)},${sql(entry.system_id)},${sql(entry.citation_html)},${sql(entry.abstract_html)},${sql(entry.notes_html)},${sql(entry.method)},${sql(entry.authors)},${entry.year ?? 'NULL'},${sql(entry.content_text)},'active',${sql(payload.generated_at)});`);
    statements.push(`DELETE FROM entries_fts WHERE entry_id=${sql(entry.id)};`);
    statements.push(`INSERT INTO entries_fts (entry_id,title,content,authors,method) VALUES (${sql(entry.id)},${sql(entry.title)},${sql(entry.content_text)},${sql(entry.authors)},${sql(entry.method)});`);
    for (const impl of entry.implementations) {
      statements.push(`INSERT OR REPLACE INTO implementations (id,entry_id,label,source_url,notes_html,updated_at) VALUES (${sql(impl.id)},${sql(entry.id)},${sql(impl.label)},${sql(impl.source_url)},${sql(impl.notes_html)},${sql(payload.generated_at)});`);
      for (const file of impl.files) statements.push(`INSERT OR REPLACE INTO files (id,implementation_id,entry_id,name,source_url,kind,updated_at) VALUES (${sql(file.id)},${sql(impl.id)},${sql(entry.id)},${sql(file.name)},${sql(file.source_url)},${sql(file.kind)},${sql(payload.generated_at)});`);
    }
  }
  await fs.writeFile(path.join(outDir, 'import.sql'), statements.join('\n'), 'utf8');
  console.log(JSON.stringify({ systems: systems.length, entries: allEntries.length, pages: pages.length, files: path.join(outDir, 'import.sql') }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
