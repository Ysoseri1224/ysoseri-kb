# ysoseri-kb

`luckyrong.ysoseri.us/kb` 的 NIST Interatomic Potentials Repository 知识库。

## 本地开发

```powershell
npm install
npm run build
npm run dev
```

## 抓取与导入

抓取器只访问设计文档中允许的 NIST 路径，默认先抓取有限样本：

```powershell
npm run sync:sample
npx wrangler d1 migrations apply ysoseri-kb --local
npx wrangler d1 execute ysoseri-kb --local --file data/import.sql
```

全量或按元素系统抓取：

```powershell
node crawler/sync.mjs --systems Ti --max-entries 200
node crawler/sync.mjs
```

`data/import.json` 保存抓取快照元数据，`data/import.sql` 是可审计的 D1 导入脚本。附件只写入 NIST 原始下载链接，不重新托管。

抓取完成后可把原始 HTML 和精简 manifest 写入 R2 快照桶：

```powershell
npm run sync:upload-r2
```

## API

- `GET /api/search?q=Ti`
- `GET /api/system/{system-id}`
- `GET /api/entry/{entry-id}`
- `GET /api/stats`
- `GET /api/updates`

同步任务在本地运行，避免把全站抓取放进访客请求或 Worker 的短时执行路径。
