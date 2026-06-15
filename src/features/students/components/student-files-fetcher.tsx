import StudentFileViewer, { LogsAndHistory } from '@/features/students/components/student-file-viewer';
import { getEmailFromAnonID } from '@/lib/anon';
import { useQuery } from '@tanstack/react-query';
import { DefaultService } from '@/api/services/DefaultService';
import { MainTableEvent } from '@/api';
import { PS2 } from 'provena';

export type StudentFilesFetcherProps = {
    studentId: string;
    assignmentId?: string;
}

export function StudentFilesFetcher({ studentId, assignmentId }: StudentFilesFetcherProps) {
    const email = getEmailFromAnonID(studentId);

    const files = useQuery({
        queryKey: ['files', assignmentId, studentId],
        queryFn: () => {
            if (assignmentId) {
                return DefaultService.getCodeStateSectionsForAssignmentSubject(assignmentId, email!);
            } else {
                return DefaultService.getCodeStateSectionsForSubject(email!);
            }
        },
        select: (data: string[]) => data.sort((a, b) => a.includes("test") ? 1 : b.includes("test") ? -1 : a.localeCompare(b)),
        enabled: !!studentId,
    });

    const yielder = () => new Promise(resolve => setTimeout(resolve, 0)); // Yield to the event loop to keep UI responsive

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const eventFetcher = (selectedFile: string | null) => useQuery({
        queryKey: ['eventLogs', assignmentId, studentId, selectedFile],
        queryFn: () => DefaultService.getFileEdits(email!, selectedFile!).then(async events => {
            // console.log(`Fetched ${events.length} events for file ${selectedFile}`);
            const result: LogsAndHistory = {
                eventLogs: events as MainTableEvent[],
                builder: await PS2.createEditHistoryAsync(events, yielder, { newLineMode: PS2.NewlineMode.AutoDetect })
                // history: PS2.createEditHistory(events, { newLineMode: PS2.NewlineMode.AutoDetect })
            };
            return result;
        }),
        enabled: !!(studentId && selectedFile),
    });

    return (
        <div>
            {<StudentFileViewer studentId={studentId} filesResult={files} eventFetcher={eventFetcher} />}
        </div>
    );
}