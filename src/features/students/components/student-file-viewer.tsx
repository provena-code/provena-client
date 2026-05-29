import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DefaultService, MainTableEvent } from '@/api';
import FileList from '@/features/students/components/file-list';
import EventLogViewer from '@/features/students/components/event-log-viewer';
import EventDetailViewer from '@/features/students/components/event-detail-viewer';
import MetadataViewer from '@/features/students/components/metadata-viewer';
import ErrorViewer from '@/features/students/components/error-viewer';
import { Metadata, PS2 } from 'provena';
import ClipboardViewer from './clipboard-viewer';
import { getEmailFromAnonID } from '@/lib/anon';

interface StudentFileViewerProps {
    studentId: string;
    assignmentId?: string;
}

export default function StudentFileViewer({ studentId, assignmentId }: StudentFileViewerProps) {
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [currentFrameIndex, setCurrentFrame] = useState<number | null>(null);
    const [hoveredMetadata, setHoveredMetadata] = useState<Metadata | null>(null);

    const email = getEmailFromAnonID(studentId);

    const { data: files, isLoading: isLoadingFiles, isError: isErrorFiles } = useQuery({
        queryKey: ['files', assignmentId, studentId],
        queryFn: () => {
            if (assignmentId) {
                return DefaultService.getCodeStateSectionsForAssignmentSubject(assignmentId, email!);
            } else {
                return DefaultService.getCodeStateSectionsForSubject(email!);
            }
        },
        select: (data: string[]) => data.sort((a, b) => a.includes("test") ? 1 : a.localeCompare(b)),
        enabled: !!studentId,
    });

    const yielder = () => new Promise(resolve => setTimeout(resolve, 0)); // Yield to the event loop to keep UI responsive

    const { data: logsAndHistory, isLoading: isLoadingEventLogs, isError: isErrorEventLogs } = useQuery({
        queryKey: ['eventLogs', assignmentId, studentId, selectedFile],
        queryFn: () => DefaultService.getFileEdits(email!, selectedFile!).then(async events => {
            // console.log(`Fetched ${events.length} events for file ${selectedFile}`);
            return {
                eventLogs: events as MainTableEvent[],
                history: await PS2.createEditHistoryAsync(events, yielder, { newLineMode: PS2.NewlineMode.AutoDetect })
                // history: PS2.createEditHistory(events, { newLineMode: PS2.NewlineMode.AutoDetect })
            };
        }),
        enabled: !!(studentId && selectedFile),
    });
    const {eventLogs, history} = logsAndHistory || {};

    useEffect(() => {
        if (files && Array.isArray(files) && files.length > 0 && !selectedFile) {
            setSelectedFile(files[0]);
        }
    }, [files, selectedFile]);

    const handleFileSelect = (file: string) => {
        setSelectedFile(file);
        setCurrentFrame(null);
        setHoveredMetadata(null);
    };

    const currentFrameData = history && currentFrameIndex !== null ? history[currentFrameIndex] : null;
    const currentEventIDs = currentFrameData ? currentFrameData.eventIDs : null;
    const currentEvents = currentEventIDs && eventLogs && Array.isArray(eventLogs) ? eventLogs.filter(event => currentEventIDs.includes(event.EventID)) : [];

    const sessionChangeThresholds: number[] = [];
    let lastSessionID = '';
    if (eventLogs && eventLogs.length > 0 && history) {
        history.forEach((frame, index) => {
            const firstEventID = frame.eventIDs[0];
            const event = eventLogs.find(e => e.EventID === firstEventID);
            if (event && event.SessionID && event.SessionID !== lastSessionID) {
                sessionChangeThresholds.push(index / history.length);
                lastSessionID = event.SessionID;
            }
        });
    }


    const jumpToClientTime = (clientTime: number) => {
        if (!eventLogs || eventLogs.length === 0 || !history) return;
        const clientTimeToIsoString = new Date(clientTime).toISOString();
        console.log(`Jumping to client time ${clientTime} (${clientTimeToIsoString})`);
        let index = 0;
        let found = false;
        while (index < history.length && !found) {
            const frame = history[index];
            for (const eventID of frame.eventIDs) {
                const event = eventLogs.find(e => e.EventID === eventID);
                const clientTimestamp = event?.ClientTimestamp;
                if (clientTimestamp && clientTimestamp >= clientTimeToIsoString) {
                    setCurrentFrame(index);
                    found = true;
                    break;
                }
            }
            index++;
        }
    };

    return (
        <div className="p-4">
            {history && (
                <ErrorViewer history={history} onJump={(frameIndex) => setCurrentFrame(frameIndex)} />
            )}
            <div className="flex border border-gray-300 rounded-md h-full">
                <div className="w-1/4 border-r border-gray-300 flex flex-col">
                    {isLoadingFiles && <div className="p-4">Loading file list...</div>}
                    {isErrorFiles && <div className="p-4">Error fetching file list.</div>}
                    {files && Array.isArray(files) ? (
                        <FileList files={files} selectedFile={selectedFile} onSelectFile={handleFileSelect} />
                    ) : (
                        <div className="p-4">No files found.</div>
                    )}
                    <EventDetailViewer events={currentEvents} />
                    <ClipboardViewer clipboard={currentFrameData?.currentClipboard ?? ''} />
                    <MetadataViewer metadata={hoveredMetadata} />
                </div>

                {selectedFile ? (
                    <>
                        {isLoadingEventLogs && <div className="w-3/4 p-4">Loading event logs...</div>}
                        {isErrorEventLogs && <div className="w-3/4 p-4">Error fetching event logs.</div>}
                        {history && (
                            <>
                                <EventLogViewer
                                    eventHistory={history}
                                    file={selectedFile}
                                    onScrub={setCurrentFrame}
                                    currentFrame={currentFrameIndex}
                                    onMetadataHover={setHoveredMetadata}
                                    jumpToClientTime={jumpToClientTime}
                                    sessionChangeThresholds={sessionChangeThresholds}
                                />
                            </>
                        )}
                    </>
                ) : (
                    <div className="w-3/4 p-4">Select a file to view its logs.</div>
                )}
            </div>
        </div>
    );
}
