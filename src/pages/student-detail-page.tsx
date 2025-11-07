import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DefaultService } from '@/api';
import FileList from '@/features/students/components/file-list';
import EventLogViewer from '@/features/students/components/event-log-viewer';

export default function StudentDetailPage() {
  const { assignmentId, studentId } = useParams<{ assignmentId: string; studentId: string }>();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const { data: files, isLoading: isLoadingFiles, isError: isErrorFiles } = useQuery({
    queryKey: ['files', assignmentId, studentId],
    queryFn: () => DefaultService.getAssignmentsReadAssignmentsAssignmentIdSubjectIdCodeStateSectionsGet(assignmentId!, studentId!),
    enabled: !!(assignmentId && studentId),
  });

  // Set the first file as selected by default
  useEffect(() => {
    if (files && Array.isArray(files) && files.length > 0 && !selectedFile) {
      setSelectedFile(files[0]);
    }
  }, [files, selectedFile]);

  if (isLoadingFiles) return <div>Loading file list...</div>;
  if (isErrorFiles) return <div>Error fetching file list.</div>;

  return (
    <div>
      <h2 className="text-xl font-semibold">Student Details</h2>
      <p className="mt-2">Assignment: {assignmentId}</p>
      <p className="mb-4">Student: {studentId}</p>
      <div className="flex border border-gray-300 rounded-md">
        {files && Array.isArray(files) ? (
          <FileList files={files} selectedFile={selectedFile} onSelectFile={setSelectedFile} />
        ) : (
          <div className="w-1/4 border-r border-gray-300 p-4">No files found.</div>
        )}
        {selectedFile && assignmentId && studentId ? (
          <EventLogViewer assignmentId={assignmentId} studentId={studentId} file={selectedFile} />
        ) : (
          <div className="w-3/4 p-4">Select a file to view its logs.</div>
        )}
      </div>
    </div>
  );
}
