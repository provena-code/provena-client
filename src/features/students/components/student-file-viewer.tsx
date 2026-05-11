import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DefaultService } from '@/api';
import FileList from '@/features/students/components/file-list';
import EventLogViewer from '@/features/students/components/event-log-viewer';
import EventDetailViewer from '@/features/students/components/event-detail-viewer';
import MetadataViewer from '@/features/students/components/metadata-viewer';
import ErrorViewer from '@/features/students/components/error-viewer';
import { Metadata, PS2 } from 'provena';

interface StudentFileViewerProps {
    studentId: string;
    assignmentId?: string;
}

export default function StudentFileViewer({ studentId, assignmentId }: StudentFileViewerProps) {
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [currentFrame, setCurrentFrame] = useState<number | null>(null);
    const [hoveredMetadata, setHoveredMetadata] = useState<Metadata | null>(null);

    const { data: files, isLoading: isLoadingFiles, isError: isErrorFiles } = useQuery({
        queryKey: ['files', assignmentId, studentId],
        queryFn: () => {
            if (assignmentId) {
                return DefaultService.getCodeStateSectionsForAssignmentSubject(assignmentId, studentId);
            } else {
                return DefaultService.getCodeStateSectionsForSubject(studentId);
            }
        },
        enabled: !!studentId,
    });

    const { data: eventLogs, isLoading: isLoadingEventLogs, isError: isErrorEventLogs } = useQuery({
        queryKey: ['eventLogs', assignmentId, studentId, selectedFile],
        queryFn: () => DefaultService.getFileEdits(studentId!, selectedFile!),
        enabled: !!(studentId && selectedFile),
    });

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

    const processedEditList = useMemo(() =>  {
        if (!eventLogs || !Array.isArray(eventLogs)) {
            return null;
        }
        return PS2.createEditHistory(eventLogs, {newLineMode: PS2.NewlineMode.AutoDetect});
    }, [eventLogs]);
    const currentEventIDs = processedEditList && currentFrame !== null ? processedEditList[currentFrame].eventIDs : null;
    const currentEvents = currentEventIDs && eventLogs && Array.isArray(eventLogs) ? eventLogs.filter(event => currentEventIDs.includes(event.EventID)) : [];

    return (
        <div className="p-4">
            {processedEditList && (
                <ErrorViewer history={processedEditList} onJump={(frameIndex) => setCurrentFrame(frameIndex)} />
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
                    <MetadataViewer metadata={hoveredMetadata} />
                </div>

                {selectedFile ? (
                    <>
                        {isLoadingEventLogs && <div className="w-3/4 p-4">Loading event logs...</div>}
                        {isErrorEventLogs && <div className="w-3/4 p-4">Error fetching event logs.</div>}
                        {processedEditList && (
                            <>
                                <EventLogViewer
                                    eventHistory={processedEditList}
                                    file={selectedFile}
                                    onScrub={setCurrentFrame}
                                    currentFrame={currentFrame}
                                    onMetadataHover={setHoveredMetadata}
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
