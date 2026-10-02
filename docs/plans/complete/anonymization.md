# Plan: Optional, institution-agnostic anonymization

**Status:** implemented (2026-09-25)

## Goal

Right now the client only builds if `src/data/crosswalk.json` exists, and the crosswalk format is specific to NCSU (`UnityID`, `Email`, `AnonID`). This change makes the crosswalk:

* **Optional.** Without a crosswalk, the client shows raw SubjectIDs and does no anonymization.
* **Generic.** The only required columns are `SubjectID` and `AnonID`. Every other column is treated as identifying data to redact, the way `UnityID` is today.

This is a stopgap. Eventually the server should own the crosswalk, and most of this code can then be deleted. Until then, the crosswalk stays compiled into the bundle, and we document that as a limitation (see [Security](#security-limitation-punted)).

## Current behavior

`src/lib/anon.ts` statically imports `../data/crosswalk.json` and builds two maps, Email → AnonID and AnonID → Email.

| Export | Used by | Behavior |
| --- | --- | --- |
| `anonymizeEmail` | `home-page.tsx` | Maps each SubjectID to its AnonID. Subjects that aren't in the crosswalk are filtered out. |
| `anonymizeObject` / `anonymizeArray` | `assignment-detail-page.tsx`, `event-detail-viewer.tsx` | Replace `SubjectID` with the AnonID, and drop objects whose subject isn't in the crosswalk. |
| `getEmailFromAnonID` | `student-files-fetcher.tsx`, `student-time-range-fetcher.tsx`, `time-range-selector.tsx` | Turn the AnonID from the URL back into a SubjectID for API calls. |
| `redactCode` / `findIndicesToRedact` | `code-viewer.tsx`, `clipboard-viewer.tsx`, `event-detail-viewer.tsx`, `event-log-viewer.tsx` | Blank every crosswalk email and UnityID, plus lines beginning with `Author:`, `Name:`, `Email:`, `Class:`, `Lab:`, or `Unity:`. |
| `isParticipantEmail` | *(unused)* | |

## Proposed changes

### 1. Load the crosswalk optionally (`src/lib/anon.ts`)

Replace the static import with an eager glob. If the file doesn't exist, the glob returns an empty object, so the build still succeeds:

```ts
const crosswalkModules = import.meta.glob<CrosswalkEntry[]>('../data/crosswalk.json', { eager: true, import: 'default' });
const crosswalk: CrosswalkEntry[] | undefined = Object.values(crosswalkModules)[0];

export const isAnonymizationEnabled = !!crosswalk;
```

This needs no new dependencies, and `vite/client` types (already in `tsconfig.app.json`) type `import.meta.glob`. When the file exists it's still inlined into the bundle, the same as today.

Define an explicit type, because we lose the type TypeScript infers from the JSON file:

```ts
type CrosswalkEntry = { SubjectID: string; AnonID: string } & Record<string, string | null>;
```

Validate the entries at module load. If any row is missing `SubjectID` or `AnonID`, or if an AnonID appears twice, throw an error that names the problem, so a malformed crosswalk fails loudly instead of silently hiding students. Don't include row contents in the error message, since they contain student data.

### 2. Rename Email → SubjectID

| Old | New |
| --- | --- |
| `emailToAnonIDMap` | `subjectIDToAnonIDMap` |
| `anonIDToEmailMap` | `anonIDToSubjectIDMap` |
| `anonymizeEmail(email)` | `anonymizeSubjectID(subjectID)` |
| `getEmailFromAnonID(anonID)` | `getSubjectIDFromAnonID(anonID)` |
| `isParticipantEmail` | delete (unused) |
| local `email` variables in the two fetchers | `subjectId` |

### 3. Pass everything through when there's no crosswalk

When `isAnonymizationEnabled` is false:

* `anonymizeSubjectID(id)` returns `id`, and `anonymizeObject` / `anonymizeArray` return their input unchanged. Nothing is filtered out.
* `getSubjectIDFromAnonID(id)` returns `id`.
* `findIndicesToRedact` returns an empty set, and `redactCode` returns its input. Header-line redaction is skipped too, since it's part of anonymization.

When a crosswalk is present, behavior stays the same: subjects that aren't in the crosswalk are still hidden.

### 4. Redact every column except `AnonID`

Build the list of strings to redact once, at module load: every non-empty value in every column except `AnonID`, including `SubjectID` itself. This replaces the separate email and UnityID passes. Skip `null` and empty values (see breakages 2 and 3).

Match case-insensitively, since emails and usernames often vary in case. Matching uses values from every row, not just the current student's, so values shorter than 3 characters are skipped (with a console warning), and the README says to include only identifiers that are unique strings.

Drop `Unity` from the header-keyword list, since it's NCSU-specific. Keep `Author`, `Name`, `Email`, `Class`, and `Lab`, and move them to a named constant at the top of `anon.ts` so they're easy to find.

### 5. Clean up `util/csvtojson.cjs`

* Strip a leading UTF-8 BOM, which Excel adds. Otherwise the first header becomes `\uFEFFSubjectID` and validation fails.
* Exit with a non-zero code on error. Right now it logs the error and exits 0.
* Optionally add an npm script such as `"crosswalk": "node util/csvtojson.cjs"`.

The parser doesn't handle quoted fields that contain commas. That's acceptable for ID columns, but document it.

### 6. Redact all Event Details string fields

Run every string field of the current event through `redactCode`, not just `Code` and `InsertText`. This covers `DeleteText` (not in current logs, which only record `DeleteLength`), `CopiedText`, paths, and program output. It also avoids the old code mutating the cached event object.

### 7. Update docs

* **README:** add the section in [README text](#readme-text) below.
* **CLAUDE.md:** rewrite the "Anonymization" section. It should say the crosswalk is optional, the required columns are `SubjectID` and `AnonID`, other columns are redacted, the new function names, and the pass-through behavior. Also say that `isAnonymizationEnabled` is the switch.
* **`.env.template`:** no change.

## Things that may break

1. **The existing local `crosswalk.json` stops working.** It has an `Email` column, not `SubjectID`. Rename the column in `crosswalk.csv` and regenerate. Validation (step 1) turns this into a clear startup error rather than an empty student list. I don't plan to accept `Email` as an alias, because that would make the code institution-specific again.
2. **Existing bug: `null` values redact the literal text `null`.** `csvtojson.cjs` writes `null` for empty cells, and `code.indexOf(null)` coerces to `"null"`. Any student with a blank `UnityID` causes every `null` in their code to be blanked. With arbitrary extra columns this becomes more likely. Step 4 fixes it by skipping empty values.
3. **Existing bug: an empty-string value hangs the browser.** `findIndicesOfStrings` with `""` loops forever, because `indexOf("")` returns `startIndex` and the length is 0. `csvtojson.cjs` currently converts `""` to `null`, so this only happens with a hand-edited JSON file. Guard against it anyway.
4. **Short or common values cause over-redaction.** Matching is by plain substring and is case-sensitive. A column like `Section` = `1`, or a first name like `Al`, would blank every occurrence in the code (`Al` in `Also`). The README should say to include only identifying columns. Resolved with a 3-character minimum (see [Decisions](#decisions)).
5. **Raw SubjectIDs appear in URLs when there's no crosswalk.** These are emails in our deployment. They show up in routes, breadcrumbs, and browser history. That's expected, but the links in `home-page.tsx` and `students-table.tsx` build paths without `encodeURIComponent`. A SubjectID containing `/`, `?`, or `#` would break routing. Emails are fine. Encoding costs little, so I'd add it.
6. **Performance.** `code-viewer.tsx` calls `findIndicesToRedact` on every frame, and today it runs one `indexOf` scan per crosswalk string. Adding columns multiplies that work. Compiling a single regex from the escaped redaction strings at module load keeps the cost about the same no matter how many columns there are. Implemented this way.
7. **Types.** Code that relied on the inferred JSON type (`entry.Email`, `entry.UnityID`) needs to change. `tsc -b` will catch any we miss.
8. **Existing gaps, out of scope:**
   * File names (`CodeStateSection`) in the file list aren't redacted. They can contain usernames (for example, `C:\Users\<unityid>\...`).
   * In Event Details, only `Code` and `InsertText` are redacted. Other string fields are shown as-is.
   * `code-viewer.tsx` hard-codes `'█'` instead of using `CodeRedactionPlaceholder`.

   Event Details and the placeholder constant were fixed in this change (step 6). File-name redaction remains out of scope.

## Security limitation (punted)

When a crosswalk is present, Vite inlines it into the JS bundle. Anyone who can load the built site, or the dev server if it's exposed with `--host`, can read the full mapping and every redacted value. The static files have no authentication, so the API key doesn't protect them.

There's a second, more basic limitation. Anonymization happens only in the display. The server still returns real SubjectIDs, and they're visible in the browser's network tab. So this is a blinding convenience for the person looking at the screen, not access control.

**Alternative considered:** the instructor loads the CSV at runtime through a file picker, and the data is kept in memory or localStorage. This keeps student data out of the bundle. However, it means anonymization depends on each viewer's browser. It also means turning the module-level maps in `anon.ts` into React state or context that every consumer subscribes to. That isn't hard, but it's more churn than a stopgap deserves, since the server-side crosswalk will replace it.

**Decision:** keep the compiled-in JSON. Document that a build with a crosswalk should only be run locally and never deployed or shared, and that `dist/` built with a crosswalk contains student data.

## README text

Implemented as "Anonymizing students (optional)" in the README's Setup section.

## Decisions

1. Header-line redaction is off when there's no crosswalk.
2. Matching is case-insensitive and uses values from every row, with a minimum length of 3. We assume identifiers are unique strings. Per-student matching was considered and deferred.
3. Every string field in Event Details is redacted.
