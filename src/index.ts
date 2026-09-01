interface Env {
  DB: D1Database;
  SNAPSHOTS: R2Bucket;
  SOURCE_BASE?: string;
  KB_ADMIN_PASSWORD?: string;
}

const headers = { 'content-type': 'application/json; charset=utf-8' };

function json(data: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...headers, ...extra } });
}

function html(body: string, status = 200) {
  return new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=60' } });
}

function esc(value: unknown) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] ?? char));
}

function normalizeId(value: string) {
  return decodeURIComponent(value).replace(/^\/+|\/+$/g, '');
}

function pageShell() {
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>私人知识库 · NIST Interatomic Potentials</title>
<style>
:root{color-scheme:light;--paper:#faf8f8;--surface:#f2eeee;--ink:#1a1414;--muted:#746b69;--line:#e0d8d8;--ruby:#b22222;--ruby-soft:#f2d8d4;--shadow:0 18px 45px rgba(92,32,24,.09)}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.6}
main{width:min(1180px,calc(100% - 40px));margin:0 auto;padding:34px 0 70px}.masthead{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;border-bottom:1px solid var(--line);padding-bottom:24px}.eyebrow{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--ruby);font-weight:700}.title{margin:7px 0 4px;font-family:Georgia,"Times New Roman",serif;font-size:clamp(32px,5vw,58px);line-height:1.05;font-weight:600}.subtitle{margin:0;color:var(--muted);max-width:620px}.source{font-size:12px;color:var(--muted);text-align:right}.source a{color:var(--ruby)}
.search{display:grid;grid-template-columns:1fr auto;gap:10px;margin:28px 0 18px}.search input{border:1px solid var(--line);background:#fff;padding:14px 16px;font:inherit;font-size:16px;border-radius:9px;outline:none}.search input:focus{border-color:var(--ruby);box-shadow:0 0 0 3px var(--ruby-soft)}button{border:0;border-radius:9px;background:var(--ruby);color:#fff;padding:0 23px;font:inherit;font-weight:650;cursor:pointer}button:hover{filter:brightness(.92)}
.filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:26px}.filter{border:1px solid var(--line);background:transparent;color:var(--muted);border-radius:999px;padding:6px 11px;font-size:13px;cursor:pointer}.filter.active{color:var(--ruby);border-color:var(--ruby);background:var(--ruby-soft)}
.layout{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(300px,1fr);gap:22px;align-items:start}.panel{background:var(--surface);border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow);padding:20px}.panel h2{font:600 22px/1.2 Georgia,serif;margin:0 0 14px}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px}.stat{padding:13px;background:#fff;border-radius:10px;border:1px solid var(--line)}.stat b{display:block;font:600 27px Georgia,serif;color:var(--ruby)}.stat span{font-size:12px;color:var(--muted)}
.result{display:block;padding:15px 0;border-top:1px solid var(--line);text-decoration:none;color:inherit}.result:first-child{border-top:0}.result:hover .result-title{color:var(--ruby)}.result-title{font-weight:700;font-size:17px}.result-type{display:inline-block;margin-right:8px;color:var(--ruby);font-size:11px;letter-spacing:.08em;text-transform:uppercase}.result-meta{color:var(--muted);font-size:12px;margin-top:3px}.snippet{font-size:13px;color:#4e4644;margin-top:7px}.empty{color:var(--muted);padding:30px 0;text-align:center}.detail{position:sticky;top:20px}.detail h3{font:600 28px/1.2 Georgia,serif;margin:4px 0 14px}.detail .label{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ruby);font-weight:700;margin-top:18px}.detail p{margin:6px 0;font-size:14px}.detail a{color:var(--ruby)}.detail .html{font-size:14px}.detail .html b{font-weight:700}.badge{display:inline-block;background:var(--ruby-soft);color:var(--ruby);border-radius:999px;font-size:12px;padding:3px 8px;margin:0 4px 4px 0}.entry-list{margin:0;padding:0;list-style:none}.entry-list li{border-top:1px solid var(--line);padding:8px 0}.entry-list a{color:var(--ink);text-decoration:none}.entry-list a:hover{color:var(--ruby)}.fineprint{font-size:12px;color:var(--muted);margin-top:24px}.status{font-size:12px;color:var(--muted)}
@media(max-width:800px){main{width:min(100% - 24px,680px);padding-top:20px}.masthead{display:block}.source{text-align:left;margin-top:14px}.layout{grid-template-columns:1fr}.detail{position:static}.stats{grid-template-columns:repeat(3,1fr)}.search{grid-template-columns:1fr}.search button{height:46px}}
</style></head><body><main>
<header class="masthead"><div><div class="eyebrow">Private Knowledge Base</div><h1 class="title">私人知识库</h1><p class="subtitle">NIST Interatomic Potentials Repository 的可检索个人镜像。界面使用中文，原始技术内容保留英文。</p></div><div class="source">非官方镜像<br><a href="https://www.ctcms.nist.gov/potentials/" target="_blank" rel="noreferrer">查看 NIST 原站 ↗</a><div id="sync-status" class="status">正在读取同步状态…</div></div></header>
<form class="search" id="search-form"><input id="query" name="q" placeholder="搜索势函数、元素、作者、年份、方法或文件名" autocomplete="off"><button type="submit">搜索</button></form>
<div class="filters"><button type="button" class="filter active" data-filter="all">全部</button><button type="button" class="filter" data-filter="system">系统</button><button type="button" class="filter" data-filter="entry">势函数条目</button><button type="button" class="filter" data-filter="reference">参考文献</button></div>
<section class="stats" id="stats"><div class="stat"><b>—</b><span>系统</span></div><div class="stat"><b>—</b><span>势函数条目</span></div><div class="stat"><b>—</b><span>最近同步</span></div></section>
<div class="layout"><section class="panel"><h2 id="results-title">最近收录</h2><div id="results"><div class="empty">正在读取知识库…</div></div><div id="pager"></div></section><aside class="panel detail" id="detail"><div class="empty">选择一条记录查看详情</div></aside></div>
<p class="fineprint">数据来自 NIST Interatomic Potentials Repository。附件不在本镜像重新托管，下载链接会跳转 NIST 原始地址。同步失败时保留上一份可用快照。</p>
</main><script>
const $=s=>document.querySelector(s);const routeBase=location.pathname.startsWith('/kb')?'/kb':'';const apiBase=routeBase+'/api';let kind='all',lastResults=[];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fmtDate(s){if(!s)return '—';try{return new Date(s).toLocaleString('zh-CN',{dateStyle:'medium',timeStyle:'short'})}catch{return s}}
async function loadStats(){const r=await fetch(apiBase+'/stats');if(!r.ok)return;const d=await r.json();$('#stats').innerHTML='<div class="stat"><b>'+esc(d.systems)+'</b><span>系统</span></div><div class="stat"><b>'+esc(d.entries)+'</b><span>势函数条目</span></div><div class="stat"><b>'+esc(fmtDate(d.lastSync))+'</b><span>最近同步</span></div>';$('#sync-status').textContent=d.lastSync?'最近同步 '+fmtDate(d.lastSync):'尚未同步'}
function renderResults(items,total,page,limit){lastResults=items;const box=$('#results');if(!items.length){box.innerHTML='<div class="empty">没有匹配记录。可以尝试元素符号、系统 ID 或作者姓名。</div>';return}box.innerHTML=items.map((x,i)=>'<a class="result" href="'+routeBase+(x.type==='system'?'/system/':'/entry/')+encodeURIComponent(x.id)+'" data-index="'+i+'"><div><span class="result-type">'+esc(x.type==='system'?'系统':'势函数')+'</span><span class="result-title">'+esc(x.title)+'</span></div><div class="result-meta">'+esc(x.meta||'')+'</div><div class="snippet">'+esc(x.snippet||'')+'</div></a>').join('');box.querySelectorAll('.result').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();showDetail(lastResults[Number(a.dataset.index)])}));$('#results-title').textContent=$('#query').value?'搜索结果':'最近收录';}
async function search(){const q=$('#query').value.trim();const url=new URL(apiBase+'/search',location.origin);if(q)url.searchParams.set('q',q);if(kind!=='all')url.searchParams.set('type',kind);url.searchParams.set('limit','30');const r=await fetch(url);const d=await r.json();renderResults(d.items||[],d.total||0,d.page||1,d.limit||30)}
async function showDetail(x){if(!x)return;const r=await fetch(apiBase+'/'+(x.type==='system'?'system/':'entry/')+encodeURIComponent(x.id));const d=await r.json();if(!r.ok){$('#detail').innerHTML='<div class="empty">详情读取失败</div>';return}if(x.type==='system'){const entries=d.entries||[];$('#detail').innerHTML='<div class="label">系统</div><h3>'+esc(d.system.name)+'</h3><p>'+esc(d.system.description||'')+'</p><div class="label">势函数条目（'+entries.length+'）</div><ul class="entry-list">'+entries.map(e=>'<li><a href="'+routeBase+'/entry/'+encodeURIComponent(e.id)+'" data-entry="'+esc(e.id)+'">'+esc(e.title)+'</a></li>').join('')+'</ul><p class="fineprint"><a href="'+esc(d.system.source_url)+'" target="_blank" rel="noreferrer">查看 NIST 原页 ↗</a></p>';$('#detail').querySelectorAll('[data-entry]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();showDetail({type:'entry',id:a.dataset.entry,title:a.textContent})}));}else{$('#detail').innerHTML='<div class="label">势函数条目</div><h3>'+esc(d.entry.title)+'</h3><div class="label">所属系统</div><p><a href="'+routeBase+'/system/'+encodeURIComponent(d.entry.system_id||'')+'">'+esc(d.entry.system_id||'未归类')+'</a></p>'+(d.entry.method?'<div class="label">方法</div><p><span class="badge">'+esc(d.entry.method)+'</span></p>':'')+(d.entry.citation_html?'<div class="label">Citation</div><div class="html">'+d.entry.citation_html+'</div>':'')+(d.entry.abstract_html?'<div class="label">Abstract</div><div class="html">'+d.entry.abstract_html+'</div>':'')+(d.entry.notes_html?'<div class="label">Notes</div><div class="html">'+d.entry.notes_html+'</div>':'')+(d.implementations?.length?'<div class="label">实现与文件</div><ul class="entry-list">'+d.implementations.map(i=>'<li><b>'+esc(i.label||'Implementation')+'</b>'+(i.files||[]).map(f=>' · <a href="'+esc(f.source_url)+'" target="_blank" rel="noreferrer">'+esc(f.name)+'</a>').join('')+'</li>').join('')+'</ul>':'')+'<p class="fineprint"><a href="'+esc(d.entry.source_url)+'" target="_blank" rel="noreferrer">查看 NIST 原页 ↗</a></p>';}}
$('#search-form').addEventListener('submit',e=>{e.preventDefault();search()});document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');kind=b.dataset.filter;search()}));
loadStats();search();
</script></body></html>`;
}

async function stats(env: Env) {
  const [systems, entries, sync] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS count FROM systems WHERE status = 'active'").first<{ count: number }>(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM potential_entries WHERE status = 'active'").first<{ count: number }>(),
    env.DB.prepare("SELECT finished_at FROM sync_jobs WHERE status = 'completed' ORDER BY finished_at DESC LIMIT 1").first<{ finished_at: string }>(),
  ]);
  return { systems: systems?.count ?? 0, entries: entries?.count ?? 0, lastSync: sync?.finished_at ?? null };
}

async function search(env: Env, url: URL) {
  const q = url.searchParams.get('q')?.trim() ?? '';
  const type = url.searchParams.get('type') ?? 'all';
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 30), 1), 100);
  const page = Math.max(Number(url.searchParams.get('page') ?? 1), 1);
  const offset = (page - 1) * limit;
  if (!q) {
    const rows = await env.DB.prepare("SELECT id, title, system_id, method, authors, year, substr(content_text, 1, 220) AS snippet FROM potential_entries WHERE status = 'active' ORDER BY updated_at DESC LIMIT ? OFFSET ?").bind(limit, offset).all();
    const systems: any = type === 'entry' ? { results: [] } : await env.DB.prepare("SELECT id, name AS title, 'system' AS type, substr(description_html, 1, 220) AS snippet FROM systems WHERE status = 'active' ORDER BY name LIMIT ? OFFSET ?").bind(limit, offset).all();
    const items = [...(systems.results ?? []), ...(type === 'system' ? [] : (rows.results ?? []).map((x: any) => ({ ...x, type: 'entry', meta: [x.system_id, x.method, x.year].filter(Boolean).join(' · ') })))];
    return json({ items, total: items.length, page, limit });
  }
  const normalizedTokens = q.replace(/[^A-Za-z0-9_]+/g, ' ').split(/\s+/).filter(Boolean);
  let result: any = { results: [] };
  if (normalizedTokens.length) {
    const match = normalizedTokens.map((x) => `"${x.replaceAll('"', '')}"*`).join(' AND ');
    try {
      result = await env.DB.prepare("SELECT f.entry_id AS id, e.title, e.system_id, e.method, e.authors, e.year, substr(e.content_text, 1, 240) AS snippet FROM entries_fts f JOIN potential_entries e ON e.id = f.entry_id WHERE entries_fts MATCH ? AND e.status = 'active' ORDER BY rank LIMIT ? OFFSET ?").bind(match, limit, offset).all();
    } catch {
      result = { results: [] };
    }
  }
  if (!result.results?.length) {
    result = await env.DB.prepare("SELECT id, title, system_id, method, authors, year, substr(content_text, 1, 240) AS snippet FROM potential_entries WHERE status = 'active' AND (id = ? OR title LIKE ? OR system_id = ?) ORDER BY updated_at DESC LIMIT ? OFFSET ?").bind(q, `%${q}%`, q, limit, offset).all();
  }
  const systemRows: any = type === 'entry' ? { results: [] } : await env.DB.prepare("SELECT id, name AS title, 'system' AS type, substr(description_html, 1, 220) AS snippet FROM systems WHERE status = 'active' AND (id LIKE ? OR name LIKE ?) ORDER BY name LIMIT ?").bind(`%${q}%`, `%${q}%`, limit).all();
  const entryRows = type === 'system' ? [] : (result.results ?? []).map((x: any) => ({ ...x, type: 'entry', meta: [x.system_id, x.method, x.year, x.authors].filter(Boolean).join(' · ') }));
  return json({ items: [...(systemRows.results ?? []), ...entryRows], total: (systemRows.results?.length ?? 0) + entryRows.length, page, limit });
}

async function getSystem(env: Env, id: string) {
  const system = await env.DB.prepare('SELECT * FROM systems WHERE id = ?').bind(id).first();
  if (!system) return json({ error: 'system_not_found' }, 404);
  const entries = await env.DB.prepare("SELECT id, title, method, authors, year FROM potential_entries WHERE system_id = ? AND status = 'active' ORDER BY title").bind(id).all();
  return json({ system, entries: entries.results ?? [] });
}

async function getEntry(env: Env, id: string) {
  const entry = await env.DB.prepare('SELECT * FROM potential_entries WHERE id = ?').bind(id).first<any>();
  if (!entry) return json({ error: 'entry_not_found' }, 404);
  const implementations = await env.DB.prepare('SELECT * FROM implementations WHERE entry_id = ? ORDER BY label').bind(id).all<any>();
  const enriched = [];
  for (const implementation of implementations.results ?? []) {
    const files = await env.DB.prepare('SELECT * FROM files WHERE implementation_id = ? ORDER BY name').bind(implementation.id).all();
    enriched.push({ ...implementation, files: files.results ?? [] });
  }
  return json({ entry, implementations: enriched });
}

function authorized(request: Request, env: Env) {
  if (!env.KB_ADMIN_PASSWORD) return false;
  return request.headers.get('x-kb-admin-password') === env.KB_ADMIN_PASSWORD;
}

async function handleSync(request: Request, env: Env) {
  if (!authorized(request, env)) return json({ error: 'sync_not_configured_or_unauthorized' }, 503);
  return json({ error: 'sync_runner_is_external', message: '请在仓库中运行 npm run sync:sample 或 crawler/sync.mjs，再用 wrangler d1 execute 导入生成的 SQL。' }, 501);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/kb(?=\/|$)/, '') || '/';
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type,x-kb-admin-password' } });
    if (path === '/' || path === '/index.html') return html(pageShell());
    if (path === '/api/health') return json({ status: 'ok', service: 'ysoseri-kb' });
    if (path === '/api/stats') return json(await stats(env));
    if (path === '/api/search') return search(env, url);
    if (path === '/api/updates') return json(await env.DB.prepare('SELECT * FROM sync_jobs ORDER BY started_at DESC LIMIT 30').all());
    if (path === '/api/sync' && request.method === 'POST') return handleSync(request, env);
    if (path.startsWith('/api/system/')) return getSystem(env, normalizeId(path.slice('/api/system/'.length)));
    if (path.startsWith('/api/entry/')) return getEntry(env, normalizeId(path.slice('/api/entry/'.length)));
    if (path.startsWith('/system/')) return html(pageShell());
    if (path.startsWith('/entry/')) return html(pageShell());
    return json({ error: 'not_found' }, 404);
  },
};
