# HF-01 ? Organizational data assessment

**Status: IN REVIEW ? HF-01 foundation implemented; identity reconciliation remains unresolved.**

Source: `C:\Users\BLC\Documents\IT\PROJECT\blc-procurement\src\docs\11. Organization BLC_Nov2026 - 09112026.xlsx`; sheet `Organization_BLC` only; SHA-256 `685fd04804ca9edae6bdd342ad0a10ed15772fe11ea54dcfdc997f94963b2bd5`. Workbook inspected read-only. No other worksheet used for hierarchy.

## Existing application master

- `server/auth.ts:22`: seven seeded test identities; stable IDs exist for those accounts but no verified mapping to spreadsheet employees. Display names differ from workbook in some cases; name similarity is not proof of identity.
- `src/domain/branches.ts`: UI branch names; not a division/department master. `src/types/document.ts` stores branch but no organization/division ID.
- `server/index.ts` uses SQLite workspace; `server/repository.ts:105-180` persists a JSON payload in a single `workspace` row. `db/schema.sql` describes a separate reference schema and is not evidence of live runtime tables.
- No organization assignment resolver or admin-managed assignment store was identified in these inspected application paths. Approval assignments are not created by reporting hierarchy.

## Workbook observations

The sheet is a spatial chart with merged cells, rather than a normalized employee table with explicit employee IDs, division IDs, or reporting IDs. Cell positions and labels below are direct observations, not proof of direct reporting or approval authority. Job titles and vacant positions are retained as source values. Do not automatically interpret consecutive cells as one person or assignment.

| Column group / unit label | Source cells (row: value) | Reporting and approval mapping |
|---|---|---|
| C25: Finance & Cashier | C28: Finance Supervisor ; C29: Erika Ayu Fitriana; C30: Finance Staff; C31: Aprinia Eka Pratiwi ; C32: Sifa Fauziah; C33: Cashier Supervisor (V1); C34: Kenny Andariska; C35: Cashier Staff; C36: Dwi Nur ‘Aini; C37: Meta Anggraini; C38: Refina Mawarli | UNRESOLVED: no explicit approval assignment; direct reporting requires visual/owner verification |
| I25: HR & GA | I28: HR Supervisor (V1); I29: Ira Kusmawati; I30: GA Staff (V1); I31: Cepi Saepullah; I32: GA Driver; I33: Gusti Adhitya Putra; I34: Rudianto | UNRESOLVED: no explicit approval assignment; direct reporting requires visual/owner verification |
| O25: Digital Marketing | O28: Staff; O29: Muhamad Sirajuddin; O30: Latiko Aldilla Dirga | UNRESOLVED: no explicit approval assignment; direct reporting requires visual/owner verification |
| U25: Marketing | U28: Staff; U29: Suci Purnami | UNRESOLVED: no explicit approval assignment; direct reporting requires visual/owner verification |
| AA25: Legal | AA28: Staff; AA29: Vacant | UNRESOLVED: no explicit approval assignment; direct reporting requires visual/owner verification |
| AG25: Document Control | AG28: Staff; AG29: Dzikri Andi; AG30: Hendra Kurniawan | UNRESOLVED: no explicit approval assignment; direct reporting requires visual/owner verification |
| AM25: IT | AM28: Staff; AM29: Danang Saputra; AM30: Bernard Wilson | UNRESOLVED: no explicit approval assignment; direct reporting requires visual/owner verification |
| AS25: Goods Auction | AS28: Staff; AS29: Andreansyah | UNRESOLVED: no explicit approval assignment; direct reporting requires visual/owner verification |
| AY25: Sales | AY21: Sales Manager  (S2); AY22: Vacant; AY28: Sales; AY29: Nita Monica; AY30: Steven; AY31: Hikmah Qoriah ; AY32: Yuliana Adec Fitriani  | UNRESOLVED: no explicit approval assignment; direct reporting requires visual/owner verification |
| BE25: Bekasi | BE21:  Branch Head (S2); BE22: Vacant; BE28: Operation SPV ; BE29: Riyadi Yuda Nugraha ; BE30: Operation Staff; BE31: Satrinal Handrika; BE32: Nova Susanto; BE33: Jogi Andreas Siadari; BE34: Tatang Suhanda; BE35: Rizki Bayu Permana; BE36: Indrayan Prananta | UNRESOLVED: no explicit approval assignment; direct reporting requires visual/owner verification |
| BK25: Surabaya | BK21:  Branch Head (S2); BK22: Asepta Gunawan; BK28: Operation Staff; BK29: Sucik Bakdarwati (SPV); BK30: Rizky Bagus Nurullah; BK31: Putut Panji Susilo; BK32: Diana Kurnia Dewi ; BK34: Pool Kupang; BK35: Security | UNRESOLVED: no explicit approval assignment; direct reporting requires visual/owner verification |
| BQ25: Semarang | BQ21: Branch Head (S2); BQ22: Gilang Pungkasan; BQ28: Operation Staff; BQ29: Ahmad Fauzan; BQ30: Sandy Yudha | UNRESOLVED: no explicit approval assignment; direct reporting requires visual/owner verification |
| BW25: Palembang | BW21: Branch Head (S2); BW22: Oktavianus Kurniawan; BW28: Operation Staff; BW29: Ronald Parulian ; BW30: M Aidil ; BW31: Muhamad Yamhari; BW33: Pool Jambi; BW34: Aldo Dwi Septian; BW36: Pool Muara Bungo; BW37: Agussusanto; BW39: Pool Pangkal Pinang 1&2; BW40: Ridho Riadi Ramli; BW42: Pool Bengkulu; BW43: Security; BW45: Pool Lampung; BW46: Mad Sari  | UNRESOLVED: no explicit approval assignment; direct reporting requires visual/owner verification |
| CC25: Medan | CC21: Branch Head (S2); CC22: Franzi Rajani Manahason Tampubolon; CC28: Operation Staff; CC29: Mangarisan Sirait; CC30: Reynald Berutu | UNRESOLVED: no explicit approval assignment; direct reporting requires visual/owner verification |
| CI25: Pekanbaru | CI21: Branch Head (S2); CI22: M Syafrizal Sahputra; CI28: Operation Staff; CI29: Muhammad Aditya Rachman; CI30: Muhtar; CI31: Nurpiyenti; CI33: Pool Solok; CI34: M Ali Anavia ; CI36: Pool Batam; CI37: Hafidz Islami; CI39: Padang; CI40: Rendy (Leader Pool); CI41: Fijen Prihenki; CI42: Fanny Khazanah; CI44: Pool Bukit Tinggi; CI45: Taufik; CI47: Pool Pasaman; CI48: Almanar | UNRESOLVED: no explicit approval assignment; direct reporting requires visual/owner verification |
| CO25: Makassar | CO21: Branch Head (S2); CO22: M. Jabal Rakhmat; CO28: Operation Staff; CO29: Miftha Khuljannah (SPV); CO30: Yusrang; CO32: Pool Pare-Pare; CO33: Gali Rakasimi; CO35: Pool Manado; CO36: Muh. Arif Rachmat; CO38: Pool Gorontalo 1&2; CO39: Rustam Alim; CO41: Pool Palu; CO42: Januario Melfont; CO44: Pool Mamuju; CO45: M Khaeril Fadli | UNRESOLVED: no explicit approval assignment; direct reporting requires visual/owner verification |
| CU25: Samarinda | CU21: Branch Head (S2); CU22: Yuke Ariyanto ; CU28: Operation Staff ; CU29: Andi Fajarudin; CU30: Muhammad Nanda; CU31: Siti Tiara; CU32: Mufid Mas'ud; CU34: Pool Balikpapan; CU35: Moch Noor Ifansyah; CU37: Pool Tarakan; CU38: Tomi | UNRESOLVED: no explicit approval assignment; direct reporting requires visual/owner verification |
| DA25: Cibinong | DA21: Branch Head (S2); DA22: Fachrizal Siddiq; DA28: Operation Staff; DA29: Achmad Sopian Putra; DA30: Mahpudin Abdul Rohman; DA31: Muhammad Nandi; DA32: Primayansyah; DA33: Lutfy Hana Almathea | UNRESOLVED: no explicit approval assignment; direct reporting requires visual/owner verification |

## Explicit top-level source observations

| Cell | Source value | Mapping status |
|---|---|---|
| AY4 | President Director | Position/name pairing observed from layout; reporting edges and system identity UNRESOLVED |
| AY5 | Koji Hashimoto | Position/name pairing observed from layout; reporting edges and system identity UNRESOLVED |
| H12 | Director | Position/name pairing observed from layout; reporting edges and system identity UNRESOLVED |
| H13 | Hery Sugiarto | Position/name pairing observed from layout; reporting edges and system identity UNRESOLVED |
| C17 | Finance & HRGA GM (S1) | Position/name pairing observed from layout; reporting edges and system identity UNRESOLVED |
| C18 | Ayu Martina | Position/name pairing observed from layout; reporting edges and system identity UNRESOLVED |
| W17 | IT, Legal, Document & Unit Control Manager (S1) | Position/name pairing observed from layout; reporting edges and system identity UNRESOLVED |
| W18 | Eva Nazzla Sutanto | Position/name pairing observed from layout; reporting edges and system identity UNRESOLVED |

## Outstanding work and constraints

- Confirm chart reporting lines and division/user identifiers against the authoritative owner; do not infer approval assignments from titles or visual proximity. Workbook has no explicit stable application IDs in the inspected cells.
- HF01-003 through HF01-006 are implemented as a generic foundation. No workbook-derived approval grants are inserted; actual organizational eligibility remains unresolved until explicit Admin-managed records are established.
- Existing documents, active approval states and historical events have not been migrated or changed. No database migration was executed.
- HF-01 tests and current build results are recorded below; Phase 00 results are not used as HF-01 evidence.
- Workbook contains no approval assignment grants; Admin-managed grants must be explicit and separate from reporting. HF-02 snapshot/reassignment remains out of scope.


## HF-01 implementation and migration

`server/organization.ts` provides a separate organizational unit master with generated stable ID and explicit Admin creation, assignment records keyed by stable unit ID and existing application user ID, active state, created/updated timestamp and actor, and immutable before/after assignment audit events. No approval relationship is inferred from workbook or position. One supervisor can be assigned to several units. A partial unique SQLite index prevents identical active assignments; foreign keys enforce assignment-to-unit and audit-to-assignment references. The existing user master is the seeded `SEEDED_USERS` map, not a SQLite table: user IDs are validated against it in server code, not by a SQLite foreign key. Removing or replacing that master later requires reconciliation and a durable identity service; the resolver omits unknown user IDs rather than granting access. An organizational unit is not automatically a branch or reporting edge.

`migrateOrganization(path)` creates only `org_units`, `org_assignments`, `org_assignment_audit` and an index, using CREATE IF NOT EXISTS in a transaction. `server/index.ts` does not run migration; it configures the repository only when `BLC_ORGANIZATION_DB` is explicitly supplied. Without configuration organizational routes return 503; existing approval endpoints remain unchanged. Migration must be explicitly invoked on a selected database after backup and authorization; no operational migration was performed. Tests invoked it twice on a temporary SQLite file containing a pre-existing workspace row and verified that row remains unchanged and data survives reopening. The unconfigured-store test also verifies that a missing database file is not created. For rollback of an isolated test, restore its backup or remove only the new org tables/index after confirming no needed assignments; any production rollback and backup execution requires separate authorization. Do not remove the workspace table or mutate document payload/history.

### Isolated setup example

Use a disposable SQLite path and back up any existing file before migration. To prepare a **test** database, set `BLC_ORGANIZATION_DB` to its absolute path and run `npx tsx -e "import { migrateOrganization } from './server/organization.ts'; migrateOrganization(process.env.BLC_ORGANIZATION_DB!)"`. Start the server with the same variable only after preparing the database. With no variable, the new API responds 503; with a missing file it also responds 503 and does not create one. Operational migration requires separate authorization and a verified backup; this example is not permission to run it there.

### API (all organization endpoints restricted to ADMIN)

- `GET/POST /api/v1/organization/units` lists/creates explicitly managed unit records.
- `GET/POST /api/v1/organization/assignments` lists or creates; optional `unitId` filters the list.
- `GET /api/v1/organization/units/:id/assignments` lists assignments for a unit; `GET .../:id/eligible` resolves eligible IDs with `AVAILABLE` or `NO_ASSIGNMENT`.
- `PATCH /api/v1/organization/assignments/:id` changes unit, supervisor, or boolean active status; `POST .../:id/deactivate` deactivates without deleting history.
- Every organization route requires a verified ADMIN JWT. Missing store returns `ORGANIZATION_UNAVAILABLE` (503); invalid values/users, nonexistent units, duplicate active entries, and missing assignment produce structured error responses. The resolver uses current unit assignments and existing IDs without testing global role; it is **not connected** to submission, decisions, or HF-02 snapshots.

### Identity reconciliation

| Workbook evidence | Existing application identity | Classification | Reason |
|---|---|---|---|
| `C18` Ayu Martina | `usr-ayu-01`, display name Bu Ayu | UNRESOLVED | Similar display, no shared verified employee identifier. |
| `H13` Hery Sugiarto | `usr-bod-hery`, display name Pak Hery | UNRESOLVED | Similar name/title alone does not establish identity. |
| `AY5` Koji Hashimoto | `usr-bod-hashimoto`, display name Mr. Hashimoto | UNRESOLVED | Similar name alone does not establish identity. |
| `C29` Erika Ayu Fitriana | `usr-keuangan-01`, display name Tim Keuangan & Treasury | UNRESOLVED | Role/label do not establish same person. |
| All other named workbook employees | No confirmed account association | UNRESOLVED | Seed data is not a complete identity directory; absence of a verified match does not prove a person is unregistered. |
| Test accounts Admin, Pemohon, Atasan | No confirmed workbook linkage | UNRESOLVED | Demo identities; no authority or organizational relationship assigned. |

No identity is marked VERIFIED or NOT REGISTERED without authoritative confirmation. Admin/Product Owner must reconcile stable user and unit identities and explicitly establish grants. The workbook chart is not an authorization list.

### Validation

- Red test: `npx vitest run server/organization.test.ts` initially failed because the new module did not exist.
- Green isolated test: `npx vitest run server/organization.test.ts`: 3 tests passed. Exercises additive rerunnable migration, legacy row preservation, persistence, invalid users/units, duplicate active assignment, multi-unit GM assignment, inactive eligibility, audit events, Admin API and non-Admin mutation denial.
- `npm test`: 27 files, 160 tests passed; includes existing server approval tests. First parallel run had one existing workspace test timeout while build/typecheck competed for resources; rerun sequentially passed.
- `npm run build`: PASS, including `tsc --noEmit`, Vite 6.4.5. Standalone `npx tsc --noEmit` also passed before final API validation adjustment; build re-ran it afterward.
- Tests use temporary SQLite files and dummy units; they do not migrate or write operational database. No end-to-end production identity reconciliation or operating database migration was performed.

### Changed files and HF-02 readiness

HF-01 changes: `server/organization.ts`, `server/organization.test.ts`, `server/app.ts`, `server/index.ts`, and this report. Existing pre-task working-tree changes remain. Approval progression, existing approval authorization, BOD behavior, and document payload/history were not intentionally changed; regression suite passed. The graphify artifact was already modified before this work and was not regenerated to avoid overwriting pre-existing graph changes.

HF-02 remains **NOT AUTHORIZED**. Before integration: establish a trustworthy user/organizational master and reconcile IDs, choose operational database deployment/migration and backup procedure, review role access for organization reads, and settle assignment changes versus snapshots. The runtime currently relies on a small demo user map and has no HR identity source; this is a material limitation, not proof that workbook staff have application accounts. No snapshot, reassignment of active documents, or automatic approval is implemented.
