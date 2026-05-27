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

export type HasSubjectID = { SubjectID: string };

export function anonymizeObject<T extends HasSubjectID>(obj: T) : T | undefined {
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