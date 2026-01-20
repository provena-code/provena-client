import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DefaultService } from '@/api';
import FileList from '@/features/students/components/file-list';
import EventLogViewer from '@/features/students/components/event-log-viewer';
import EventDetailViewer from '@/features/students/components/event-detail-viewer';
import MetadataViewer from '@/features/students/components/metadata-viewer';
import { Metadata } from 'provena';

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

    const currentEvent = eventLogs && currentFrame !== null ? eventLogs[currentFrame] : null;

    return (
        <div className="p-4">
            <div className="flex border border-gray-300 rounded-md h-full">
                <div className="w-1/4 border-r border-gray-300 flex flex-col">
                    {isLoadingFiles && <div className="p-4">Loading file list...</div>}
                    {isErrorFiles && <div className="p-4">Error fetching file list.</div>}
                    {files && Array.isArray(files) ? (
                        <FileList files={files} selectedFile={selectedFile} onSelectFile={handleFileSelect} />
                    ) : (
                        <div className="p-4">No files found.</div>
                    )}
                    <EventDetailViewer event={currentEvent} />
                    <MetadataViewer metadata={hoveredMetadata} />
                </div>

                {selectedFile ? (
                    <>
                        {isLoadingEventLogs && <div className="w-3/4 p-4">Loading event logs...</div>}
                        {isErrorEventLogs && <div className="w-3/4 p-4">Error fetching event logs.</div>}
                        {eventLogs && (
                            <EventLogViewer
                                eventLogs={eventLogs}
                                file={selectedFile}
                                onScrub={setCurrentFrame}
                                onMetadataHover={setHoveredMetadata}
                            />
                        )}
                    </>
                ) : (
                    <div className="w-3/4 p-4">Select a file to view its logs.</div>
                )}
            </div>
        </div>
    );
}
