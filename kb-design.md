# NIST Interatomic Potentials Knowledge Base

> `luckyrong.ysoseri.us/kb` 的知识库设计基线
>
> 文档版本：2026-09-01

## 1. 产品定义

`/kb` 是一个个人维护的 NIST Interatomic Potentials Repository 知识库镜像。

目标不是把 NIST 页面保存成几份静态 HTML，而是：

- 忠实保存 NIST 页面中的文字内容、字段、导航关系和原始链接。
- 将内容拆成可检索、可分页、可持续更新的数据记录。
- 保留原始页面地址、抓取时间、来源状态和同步版本。
- 明确标注这是个人知识库/镜像，不是 NIST 官方站点，也不暗示 NIST 对本项目的背书。

知识库最终覆盖 NIST Interatomic Potentials Repository 的整个相关站点范围。首次实现可以按数据域分批导入，但数据模型不能只为 Ti 页面定制。

## 2. 来源边界

### 2.1 纳入的站内路径

抓取器只允许访问 CTCMS Potentials Repository 的明确路径，不从 NIST 主站根目录无限扩展：

- `/potentials/`
- `/potentials/system/**`
- `/entry/**`
- `/Download/**` 的文件元数据和原始链接
- `/activities.html`
- `/atomman/**`
- `/credits.html`
- `/faq.html`
- `/iprPy/**`
- `/new.html`
- `/refs.html`
- `/requests.html`
- `/resources.html`

页面中的 DOI、OpenKIM、LAMMPS、论文出版社和其他外部站点只保存为外部资源链接，不纳入本项目的站内镜像范围。

### 2.2 内容保留规则

完整保留以下文字性内容：

- 页面标题和层级结构。
- 元素系统和元素组合。
- 势函数条目。
- 作者、年份、论文标题和 Citation。
- Abstract。
- Description Notes。
- Implementation Notes。
- Computed Properties 的入口和文字说明。
- 文件名、文件类型、版本目录和下载说明。
- 站内交叉引用和锚点，例如 `#C-Si-Ti`。
- 导航页面中的文字、链接和更新记录。

不在第一版重新托管二进制附件。PDF、DOCX、参数文件、源代码文件等下载项展示文件名、大小（如果来源可取得）、原始地址和当前可用状态，点击后跳转到 NIST 原始下载地址。

如果未来确认某些附件具有明确的再分发许可，可以单独增加 R2 镜像，不改变原始链接和来源记录。

不复制 NIST 的第三方统计脚本、无关的隐藏脚本、站点追踪代码或 NIST 主站的全局内容。

## 3. 站内页面与稳定地址

建议的公开路由：

```text
/kb
/kb/search?q=Ti
/kb/system/Ti
/kb/system/C-Si-Ti
/kb/entry/{entry-id}
/kb/reference/{reference-id}
/kb/file/{file-id}
/kb/updates
```

基本映射规则：

- NIST 的系统页面对应 `/kb/system/{system-id}`。
- NIST 的势函数条目对应 `/kb/entry/{entry-id}`。
- 参考文献和计算属性作为可独立访问的关联记录。
- NIST 页面中的语义锚点继续保留，确保 `#C-Si-Ti` 等定位方式有效。
- 页面显示名称可以按知识库需要整理，但内部 ID、来源 URL 和原始路径必须稳定。

## 4. 数据模型

源数据与解析结果分开保存。建议至少包含以下实体：

```text
source_page
system
potential_entry
implementation
reference
file
external_resource
computed_property
snapshot
sync_job
```

关系结构：

```text
system
  └── potential_entry
        ├── reference
        ├── implementation
        ├── file
        ├── computed_property
        └── external_resource
```

每条规范化记录至少保存：

- 稳定内部 ID。
- 原始来源 URL。
- 原始页面路径和锚点。
- 当前内容。
- 原始抓取时间。
- 最后变更时间（如果来源提供，或由内容哈希推断）。
- 内容哈希。
- 所属同步批次。
- 当前状态：active、changed、missing、parse_failed 或 archived。

原始 HTML、抓取清单、解析器版本和同步日志保存为 R2 快照，用于审计、重新解析和恢复。公开页面读取规范化数据，不在访客请求时重新抓取 NIST。

## 5. 搜索与索引

### 5.1 搜索范围

搜索覆盖：

- 势函数 ID。
- 元素和元素组合，例如 `Ti`、`C-Si-Ti`。
- 作者。
- 年份。
- 论文标题和 DOI。
- Citation、Abstract、Notes、Implementation Notes。
- 文件名和文件元数据。
- 实现类型，例如 EAM、MEAM、Tersoff、LAMMPS。
- OpenKIM ID 和其他外部资源标识。

纯文本参数文件、README、Fortran 源码等可以参与全文索引。PDF 和 DOCX 第一版只索引元数据与链接，不强制提取正文。

### 5.2 搜索行为

- 支持全文搜索。
- 支持精确匹配系统 ID 和势函数 ID。
- 支持元素、年份、作者、方法、文件类型等筛选。
- 支持按相关度、年份和最近同步时间排序。
- 结果分页，不能把整页数千条记录一次发送到浏览器。
- `C-Si-Ti` 等带连字符的系统 ID 使用单独的规范化字段，不能只依赖普通全文分词。

D1 使用 FTS5 保存全文索引，同时保留结构化字段索引。索引是规范化数据的派生物，可以从快照和主记录重建。

## 6. 界面语言与视觉边界

- 界面控件、筛选器、状态、错误提示和帮助文本使用中文。
- NIST 原始标题、作者、论文标题、Citation、Abstract、Notes 和技术术语忠实保留原站语言，第一版不做机器翻译。
- 页面需要明显显示来源链接、最后同步时间和镜像声明。
- 知识库应优先保证搜索、阅读和数据密度，不复制 NIST 旧页面中与内容无关的视觉限制。
- `/kb` 作为 luckyrong 的独立子路由接入，但不把大规模知识库内容硬编码进 Bridgetown 首页。

## 7. 抓取与同步

### 7.1 默认模式

同步默认由管理员手动触发，不在每次访客访问时抓取。

管理端至少需要支持：

- 开始一次全量同步。
- 开始一次增量同步。
- 查看同步批次。
- 查看新增、修改、删除和解析失败数量。
- 查看失败 URL 和错误原因。
- 查看当前数据最后同步时间。
- 重新执行失败页面。

同步控制可以接入现有 Dashboard；不增加公开编辑能力。个人收藏、标签、笔记和实验记录不属于当前需求，作为 future work。

### 7.2 同步流程

```text
发现站内 URL
    ↓
按白名单抓取并限速
    ↓
保存原始快照和 manifest
    ↓
解析系统、条目、引用和文件元数据
    ↓
生成新增/修改/删除差异
    ↓
更新 D1 规范化数据和 FTS5 索引
    ↓
原子切换当前快照
```

要求：

- 使用 `ETag`、`Last-Modified` 或内容哈希减少重复下载。
- 忽略 URL fragment 进行去重，但保留 fragment 对应的页面锚点。
- 限制同源并发和请求速率，避免给 NIST 产生日志压力。
- 同步失败时保留旧数据，不发布半成品。
- 源页面被删除或重命名时，不立即物理删除内部记录，先标记为 missing 或 archived。
- 每个同步批次可复查，解析器升级后可以从原始快照重建。

### 7.3 网站监控函数

自动监控不是当前默认需求。可以后续增加一个轻量监控函数，仅检查入口页面的 `Last-Modified`、ETag 或内容哈希，并在发生变化时通知管理员；真正的全量抓取仍由手动同步触发。

## 8. 首页入口

在 `luckyrong.ysoseri.us/` 首页新增知识库模块卡片，链接到 `/kb`。

卡片标题、描述和图标在实现阶段确定，但必须明确表达它是原子间势函数知识库，不使用含义过宽的“工具箱”名称。

## 9. 抓取可行性评估

技术上对全站抓取有较高把握，原因如下：

- 目标页面可以直接返回服务端 HTML，不依赖登录或浏览器执行 JavaScript。
- 相关 `robots.txt` 没有禁止 `/potentials/`、`/entry/` 或 `/Download/`。
- 页面链接结构稳定，系统页、条目页和下载路径具有可枚举关系。
- 页面提供 `Last-Modified`，可用于增量检查。
- 文件不需要重新托管，因此不需要为每一种附件格式建立下载和预览系统。

当前页面规模已经说明不能把它当成普通落地页处理：

- `/potentials/` 当前可发现约 118 个一级元素入口。
- `/potentials/system/Ti/` 当前约有 480 个标题节点。
- 该页出现约 4,208 次 `/entry/` 链接引用；这包含重复关联链接，不等于 4,208 个唯一条目。
- 该页出现约 186 个下载链接。

因此，HTML 和元数据的完整抓取把握高；全站一次性导入需要依靠 URL manifest、唯一 ID 去重、状态校验和失败重试来保证完整性，不能仅凭抓取进程结束就宣称完成。

真正的不确定性主要不在抓取技术，而在：

- 某些页面的 HTML 结构是否存在历史版本差异。
- 站内链接是否存在失效、重定向或特殊路径。
- 外部资源是否长期可访问。
- 附件是否允许再分发；本设计通过只保留原始下载链接规避这一边界。

## 10. 验收标准

- `/kb` 在 luckyrong 子路由下可访问。
- 首页存在知识库入口卡片。
- Ti 系统页和 `C-Si-Ti` 系统页可访问，内容字段与来源页面一致。
- 所有已导入条目都有独立稳定地址、来源 URL 和同步时间。
- 搜索 `Ti`、`C-Si-Ti`、作者、年份和势函数 ID 均可返回结果。
- 搜索结果支持筛选和分页。
- Citation、Abstract、Notes、Implementation Notes、文件清单和外部链接完整呈现。
- 文件下载默认跳转原始 NIST 地址。
- 同步批次能报告新增、修改、缺失和失败记录。
- 同步失败不会替换当前可用数据。
- 公开页面不执行 NIST 的第三方统计脚本。
- 页面明确声明数据来源和非官方镜像身份。

## 11. Future work

- 个人收藏、标签、笔记和实验记录。
- 纯文本参数文件的更深层结构解析。
- PDF/DOCX 正文提取和可选全文索引。
- 可验证许可的附件 R2 镜像。
- 入口页变化监控和通知。
- 对不同势函数、论文和计算属性建立关系图。
