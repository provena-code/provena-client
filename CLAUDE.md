# CLAUDE.md

Instructor-facing React dashboard for browsing and replaying student coding logs collected by the Provena VSCode plugin and served by provena-server. `docs\plans\complete\concept.md` holds the original agent guidelines and conventions (kebab-case filenames, `@/` absolute imports, shadcn/Tailwind styling, don't modify `core/`). Parts of it are stale as noted at the top.

## Commands

- `npm run dev`: Vite dev server
- `npm run build`: `tsc -b && vite build` into `dist/`
- `npm run lint`: ESLint
- `npm run gen`: regenerates `src/api/` from a provena-server running at `http://127.0.0.1:8001/openapi.json`. `src/api/` is generated, so don't hand-edit it.
- No test suite in this repo (`core/` has vitest tests).

## Architecture

- **`core/`** is the `provena-core` git submodule, consumed as `"provena": "file:core"`. Its `main` points directly at `src/index.ts`, so there's no build step. It provides `PS2.Builder`, which turns ProgSnap2-style event logs into `EditHistoryFrame[]` (code, per-character authorship `Metadata`, clipboard, `errors`, `hadDiscontinuity`, `isInternallyConsistent`). Treat it as read-only from this repo. It is co-developed separately.
- **All history reconstruction happens client-side** in the browser, which is why large logs are slow. Metrics exist (`builder.calculateMetrics()`) but aren't displayed yet (commented TODO in `student-file-viewer.tsx`).
- **Auth**: the user enters an API key in `ApiKeyModal`. It's verified by calling `getAssignmentIDs`, stored in localStorage as `provena-api-key`, and sent as the `X-API-KEY` header via `OpenAPI.HEADERS` (`src/App.tsx`). SSO is planned.
- **Env** (`src/main.tsx`, `vite.config.ts`): `VITE_API_URL` sets `OpenAPI.BASE` (falls back to `http://127.0.0.1:8001`). `VITE_APP_BASE_PATH` sets both Vite `base` and the router `basename`. Both are build-time values.
- **React Query**: `refetchOnWindowFocus: false`. `staleTime` is 0 in dev and Infinity in prod.
- **Routes** (`src/routes.tsx`, nested so breadcrumbs show every level):
  - `/` lists assignments and students
  - `/assignment/:assignmentId` shows the students table (Student, Last Submission Time, MaxScore)
  - `/assignment/:assignmentId/student/:studentId` shows that student's files for the assignment
  - `/student/:studentId` shows all of the student's files, plus the time-range selector
  - `/student/:studentId/range/:start...:end` shows activity across files in a time range (still buggy)
- **Main viewer** is `features/students/components/student-file-viewer.tsx`. Page-level `*-fetcher.tsx` components supply the file list and event fetcher. It composes a file list, `EventDetailViewer`, `ClipboardViewer`, `MetadataViewer` (hover), `ErrorViewer`, and `EventLogViewer` → `CodeHistoryPlayer` → `CodeViewer`.
  - The provenance Highlight toggle is persisted in localStorage (`src/lib/highlight-setting.ts`). Author→color map is in `code-viewer.tsx`.
  - Ctrl/Cmd+click on code jumps to that span's creation time (`jumpToClientTime`).
  - Red slider ticks mark `hadDiscontinuity` frames. The viewer border is red when a frame is not `isInternallyConsistent`.

## Anonymization (optional)

`src/lib/anon.ts` optionally loads `src/data/crosswalk.json` via `import.meta.glob`. The file is gitignored. It's generated from `src/data/crosswalk.csv` by `npm run crosswalk` (`util/csvtojson.cjs`). It's a stopgap until the server owns the crosswalk. See `docs/plans/anonymization.md` for the design and known limitations.

- **Without the file**, `isAnonymizationEnabled` is false and every function passes its input through: raw SubjectIDs, no filtering, no redaction.
- **With the file:**
  - Required columns are `SubjectID` and `AnonID`. The file is validated at load and throws on missing values or duplicate AnonIDs.
  - The UI shows AnonIDs, and subjects who aren't in the crosswalk are filtered out.
  - Fetchers convert the URL's ID back with `getSubjectIDFromAnonID` before making API calls.
- **Redaction:** `redactCode` / `findIndicesToRedact` blank every value from every column except `AnonID`. Matching is case-insensitive, uses values from all rows, and skips values under 3 characters. They also blank header lines (`Author:`, `Name:`, `Email:`, `Class:`, `Lab:`). This applies to code, clipboard contents, and every string field in Event Details. File names in the file list are *not* redacted.
- The crosswalk is inlined into the bundle, so a build that includes one must stay local.
- The crosswalk contains real student data. Never commit it or print its contents.
