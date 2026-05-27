import crosswalk from '../data/crosswalk.json'

const emailToAnonIDMap: Record<string, string> = crosswalk.reduce<Record<string, string>>((map, entry) => {
    map[entry.Email] = entry.AnonID;
    return map;
}, {});

const anonIDToEmailMap: Record<string, string> = crosswalk.reduce<Record<string, string>>((map, entry) => {
    map[entry.AnonID] = entry.Email;
    return map;
}, {});

export function anonymizeEmail(email: string) : string | undefined {
    return emailToAnonIDMap[email] || undefined;
}

export type HasSubjectID = { SubjectID?: string | null };

export function anonymizeObject<T extends HasSubjectID>(obj: T) : T | undefined {
    if (!obj.SubjectID) return obj; // If there's no SubjectID, return the object as is
    const anonID = emailToAnonIDMap[obj.SubjectID];
    if (!anonID) return undefined;
    return { ...obj, SubjectID: anonID };
}

export function anonymizeArray<T extends HasSubjectID>(arr: T[]) : T[] {
    return arr.map(anonymizeObject).filter((item): item is T => !!item);
}

export function isParticipantEmail(email: string) : boolean {
    return email in emailToAnonIDMap;
}

export function getEmailFromAnonID(anonID: string) : string | undefined {
    return anonIDToEmailMap[anonID] || undefined;
}

export const CodeRedactionPlaceholder = '█';

export function redactCode(code: string) : string {
    const indicesToRedact = findIndicesToRedact(code);
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
    let indicesToRedact: number[] = [];
    // First find any indices of any email from the crosswalk in the code
    indicesToRedact = findIndicesOfStrings(code, Object.keys(emailToAnonIDMap));

    // Then find any unityIDs
    const unityIDs = crosswalk.map(entry => entry.UnityID);
    indicesToRedact.push(...findIndicesOfStrings(code, unityIDs));

    // Then find any lines that start with whitespace followed by any of:
    const keywords = ['Author', 'Email', 'Class', 'Lab'].map(keyword => `${keyword}:`);
    const regex = new RegExp(`^[ \\t]*(${keywords.join('|')})`, 'gm');

    // And redact the whole line
    let match;
    while ((match = regex.exec(code)) !== null) {
        const lineStartIndex = match.index;
        const lineEndIndex = code.indexOf('\n', lineStartIndex + 1);
        // If there's no newline, redact to the end of the code
        let endIndex = lineEndIndex !== -1 ? lineEndIndex : code.length;
        // console.log(`Found match for redaction at index ${match.index}: ${match[0]} with length ${endIndex - lineStartIndex}`);
        for (let i = lineStartIndex; i < endIndex; i++) {
            indicesToRedact.push(i);
        }
    }

    // Return as a set to avoid duplicates
    return new Set(indicesToRedact);
}

function findIndicesOfStrings(code: string, toSearch: string[]) : number[] {
    const indices: number[] = [];
    for (const email in emailToAnonIDMap) {
        const anonID = emailToAnonIDMap[email];
        let startIndex = 0;
        while (true) {
            const index = code.indexOf(email, startIndex);
            if (index === -1) break;
            // Mark the range of the email for redaction
            for (let i = index; i < index + email.length; i++) {
                indices.push(i);
            }
            startIndex = index + email.length;
        }
    }
    return indices;
}