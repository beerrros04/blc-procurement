# Graph Report - BLC  (2026-11-06)

## Corpus Check
- 15 files · ~5,795 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .css 1)

## Summary
- 93 nodes · 124 edges · 8 communities (7 shown, 1 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Dependencies and tooling
- Product planning and migration
- PR draft implementation
- Business rules and data
- TypeScript configuration
- Runtime and scripts
- Technical architecture
- Graph navigation

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 9 edges
2. `Kebutuhan produk procurement dan pembayaran` - 8 edges
3. `validateDraft()` - 7 edges
4. `App()` - 7 edges
5. `saveDraft()` - 6 edges
6. `Rancangan proses bisnis` - 6 edges
7. `readDrafts()` - 5 edges
8. `Paket kebutuhan BLC Procurement` - 5 edges
9. `Model data konseptual PostgreSQL` - 5 edges
10. `Rancangan teknis modular monolith` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Pratinjau draf PR lokal` --conceptually_related_to--> `Rencana irisan awal draf PR`  [INFERRED]
  README.md → docs/superpowers/plans/2026-11-06-pr-draft.md
- `Migrasi dan operasi paralel` --semantically_similar_to--> `Migrasi SharePoint dan rekonsiliasi`  [INFERRED] [semantically similar]
  PRD.md → DBD.md
- `Rencana irisan awal draf PR` --references--> `Kebutuhan produk procurement dan pembayaran`  [EXTRACTED]
  docs/superpowers/plans/2026-11-06-pr-draft.md → PRD.md
- `Persetujuan bertahap dan riwayat` --semantically_similar_to--> `Aturan persetujuan bertahap`  [INFERRED] [semantically similar]
  PRD.md → BSD.md
- `Worker dan transactional outbox` --semantically_similar_to--> `Transaksi atomik, audit, dan outbox`  [INFERRED] [semantically similar]
  TDD.md → DBD.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Persetujuan yang dapat diaudit** — prd_approval, bsd_approval, dbd_approval_events, tdd_outbox [INFERRED 0.85]

## Communities (8 total, 1 thin omitted)

### Community 0 - "Dependencies and tooling"
Cohesion: 0.12
Nodes (22): dependencies, react@^19.0.0, react-dom@^19.0.0, devDependencies, @types/react@^19.0.0, @types/react-dom@^19.0.0, typescript@^5.8.0, vite@^6.3.0 (+14 more)

### Community 1 - "Product planning and migration"
Cohesion: 0.14
Nodes (14): Migrasi SharePoint dan rekonsiliasi, Rencana irisan awal draf PR, Validasi draf PR, Halaman BLC Procurement draf PR, Cutover dan rekonsiliasi, Roadmap implementasi dan pilot, UAT dan pengujian lintas fase, Design system aplikasi kerja (+6 more)

### Community 2 - "PR draft implementation"
Cohesion: 0.20
Nodes (12): DraftErrors, DraftInput, Draft, DraftStorage, readDrafts(), saveDraft(), validateDraft(), App() (+4 more)

### Community 3 - "Business rules and data"
Cohesion: 0.18
Nodes (12): Aturan persetujuan bertahap, Realisasi uang muka AV dan RC, Rancangan proses bisnis, Nilai terutang dan pembayaran PV, Alur PR, PO, GR, dan PV, Tenggat dan pengingat realisasi, Ambang dan pengecualian, Tugas dan peristiwa persetujuan (+4 more)

### Community 4 - "TypeScript configuration"
Cohesion: 0.18
Nodes (10): compilerOptions, jsx, lib, module, moduleResolution, noEmit, skipLibCheck, strict (+2 more)

### Community 5 - "Runtime and scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, test

### Community 6 - "Technical architecture"
Cohesion: 0.29
Nodes (7): Transaksi atomik, audit, dan outbox, Autentikasi dan otorisasi server, API REST pengajuan dan pembayaran, Backend Node.js dan Fastify, Frontend React dan TypeScript, Worker dan transactional outbox, Rancangan teknis modular monolith

## Knowledge Gaps
- **14 isolated node(s):** `Validasi draf PR`, `UAT dan pengujian lintas fase`, `Design system aplikasi kerja`, `Status approval terpisah dari pembayaran`, `Pemohon, penyetuju, Keuangan, admin, auditor` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 37 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Paket kebutuhan BLC Procurement` connect `Product planning and migration` to `Business rules and data`, `Technical architecture`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **What connects `Validasi draf PR`, `UAT dan pengujian lintas fase`, `Design system aplikasi kerja` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dependencies and tooling` be split into smaller, more focused modules?**
  _Cohesion score 0.11857707509881422 - nodes in this community are weakly interconnected._
- **Why does `Kebutuhan produk procurement dan pembayaran` connect `Product planning and migration` to `Business rules and data`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Should `Product planning and migration` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Dependencies and tooling` to `PR draft implementation`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._