import { DefaultService } from '@/api/services/DefaultService';
import StudentFileViewer, { LogsAndHistory } from '@/features/students/components/student-file-viewer';
import { getEmailFromAnonID } from '@/lib/anon';
import { useQuery } from '@tanstack/react-query';
import { PS2 } from 'provena';

export type StudentTimeRangeFetcherProps = {
    studentId: string;
    startTime: string;
    endTime: string;
}

export function StudentTimeRangeFetcher({ studentId, startTime, endTime }: StudentTimeRangeFetcherProps) {
    const email = getEmailFromAnonID(studentId);

    const yielder = () => new Promise(resolve => setTimeout(resolve, 0)); // Yield to the event loop to keep UI responsive

    // TODO: We now are essentially using enabled instead of isLoading, and aren't catching errors,
    // so I'm not sure the best way to handle that...
    const {data, isLoading, isError} = useQuery({
        queryKey: ['eventLogsRange', studentId, startTime, endTime],
        queryFn: () => DefaultService.getEditsInRange(email!, startTime, endTime).then(async events => {
            // TODO: Make an async version
            const builder = new PS2.MultiFileBuilder({
                addHistory: true,
                newLineMode: PS2.NewlineMode.AutoDetect,
            });
            builder.addEvents(events);
            return {
                builder,
                events,
            };
        }),
        enabled: !!(studentId && startTime && endTime),
    })
    const { builder, events } = data || {};

    // TODO: These may end up double-caching things and being a performance hit...
    // It'd be nice if I could not refactor this to deal with query/not-query results,
    // so maybe it doesn't matter and maybe I can just tell it not to cache?
    // Or maybe I can create my own UseQueryResult manually? This would allow passing the
    // isLoading and isError states from above...
    const filesResult = useQuery({
        queryKey: ['filesInRange', studentId, startTime, endTime],
        queryFn: () => Array.from(builder!.builderMap.keys()),
        enabled: !!(builder),
    });

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const eventFetcher = (selectedFile: string | null) => useQuery({
        queryKey: ['eventsForFileInRange', studentId, selectedFile, startTime, endTime],
        queryFn: () => {
            return {
                builder: builder!.builderMap.get(selectedFile!),
                eventLogs: events
            } as LogsAndHistory;
        },
        enabled: !!(selectedFile && events),
    });

    return (
        <div>
            {<StudentFileViewer studentId={studentId} filesResult={filesResult} eventFetcher={eventFetcher} />}
        </div>
    );
}