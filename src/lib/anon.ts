// Optional crosswalk from server SubjectIDs to anonymous IDs. It must have SubjectID and AnonID
// columns. Every other column (and SubjectID itself) is treated as identifying text to redact.
// If src/data/crosswalk.json doesn't exist, anonymization is disabled and everything passes through.
// See README.md for setup. This is a stopgap until the server owns the crosswalk.
type CrosswalkEntry = { SubjectID: string; AnonID: string } & Record<string, string | null>;

const crosswalkModules = import.meta.glob<CrosswalkEntry[]>('../data/crosswalk.json', { eager: true, import: 'default' });
const crosswalk: CrosswalkEntry[] | undefined = Object.values(crosswalkModules)[0];

export const isAnonymizationEnabled = !!crosswalk;

if (crosswalk) validateCrosswalk(crosswalk);

// Don't report entry contents in errors; the crosswalk contains student data.
function validateCrosswalk(entries: CrosswalkEntry[]) {
    if (!Array.isArray(entries)) {
        throw new Error('crosswalk.json must be an array of entries.');
    }
    const anonIDs = new Set<string>();
    entries.forEach((entry, i) => {
        if (!entry.SubjectID || !entry.AnonID) {
            throw new Error(`crosswalk.json entry ${i + 1} is missing a SubjectID or AnonID.`);
        }
        if (anonIDs.has(entry.AnonID)) {
            throw new Error(`crosswalk.json entry ${i + 1} has a duplicate AnonID.`);
        }
        anonIDs.add(entry.AnonID);
    });
}

const subjectIDToAnonIDMap: Record<string, string> = {};
const anonIDToSubjectIDMap: Record<string, string> = {};
for (const entry of crosswalk ?? []) {
    subjectIDToAnonIDMap[entry.SubjectID] = entry.AnonID;
    anonIDToSubjectIDMap[entry.AnonID] = entry.SubjectID;
}

/** Returns the AnonID for a SubjectID, or undefined if the subject isn't in the crosswalk. */
export function anonymizeSubjectID(subjectID: string) : string | undefined {
    if (!isAnonymizationEnabled) return subjectID;
    return subjectIDToAnonIDMap[subjectID] || undefined;
}

export type HasSubjectID = { SubjectID?: string | null };

export function anonymizeObject<T extends HasSubjectID>(obj: T) : T | undefined {
    if (!isAnonymizationEnabled) return obj;
    if (!obj.SubjectID) return obj; // If there's no SubjectID, return the object as is
    const anonID = subjectIDToAnonIDMap[obj.SubjectID];
    if (!anonID) return undefined;
    return { ...obj, SubjectID: anonID };
}

export function anonymizeArray<T extends HasSubjectID>(arr: T[]) : T[] {
    return arr.map(anonymizeObject).filter((item): item is T => !!item);
}

/** Converts an AnonID (e.g., from the URL) back to the SubjectID the server expects. */
export function getSubjectIDFromAnonID(anonID?: string) : string | undefined {
    if (!anonID) return undefined;
    if (!isAnonymizationEnabled) return anonID;
    return anonIDToSubjectIDMap[anonID] || undefined;
}

export const CodeRedactionPlaceholder = '█';

// Values shorter than this are skipped, since they'd match too much of students' code.
const MinRedactionLength = 3;

// Lines starting with (optional whitespace and) any of these are redacted entirely.
const HeaderKeywords = ['Author', 'Name', 'Email', 'Class', 'Lab'];

const redactionRegex = buildRedactionRegex();
const headerRegex = new RegExp(`^[ \\t]*(${HeaderKeywords.map(keyword => `${keyword}:`).join('|')})`, 'gm');

function buildRedactionRegex() : RegExp | undefined {
    const values = new Set<string>();
    let skipped = 0;
    for (const entry of crosswalk ?? []) {
        for (const [column, value] of Object.entries(entry)) {
            if (column === 'AnonID' || typeof value !== 'string') continue;
            const trimmed = value.trim();
            if (trimmed.length === 0) continue;
            if (trimmed.length < MinRedactionLength) {
                skipped++;
                continue;
            }
            values.add(trimmed);
        }
    }
    if (skipped > 0) {
        console.warn(`Anonymization: skipped ${skipped} crosswalk value(s) shorter than ${MinRedactionLength} characters.`);
    }
    if (values.size === 0) return undefined;
    // Longest first, so e.g. a full email matches before a username that prefixes it
    const alternatives = [...values]
        .sort((a, b) => b.length - a.length)
        .map(value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return new RegExp(alternatives.join('|'), 'gi');
}

export function redactCode(code: string) : string {
    const indicesToRedact = findIndicesToRedact(code);
    if (indicesToRedact.size === 0) return code;
    let redactedCode = '';
    for (let i = 0; i < code.length; i++) {
        if (indicesToRedact.has(i)) {
            redactedCode += CodeRedactionPlaceholder;
        } else {
            redactedCode += code[i];
        }
    }
    return redactedCode;
}

export function findIndicesToRedact(code: string) : Set<number> {
    const indicesToRedact = new Set<number>();
    if (!isAnonymizationEnabled) return indicesToRedact;

    // First find any crosswalk values (case-insensitive)
    if (redactionRegex) {
        for (const match of code.matchAll(redactionRegex)) {
            for (let i = match.index; i < match.index + match[0].length; i++) {
                indicesToRedact.add(i);
            }
        }
    }

    // Then redact the whole of any header line (e.g., "Name: ...")
    for (const match of code.matchAll(headerRegex)) {
        const lineStartIndex = match.index;
        const lineEndIndex = code.indexOf('\n', lineStartIndex + 1);
        // If there's no newline, redact to the end of the code
        const endIndex = lineEndIndex !== -1 ? lineEndIndex : code.length;
        for (let i = lineStartIndex; i < endIndex; i++) {
            indicesToRedact.add(i);
        }
    }

    return indicesToRedact;
}
