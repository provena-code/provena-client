import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DefaultService } from '@/api';
import { createEditList } from '@/util/edit-list-utils';
import CodeViewer from './code-viewer'; // Import the new CodeViewer component

interface EventLogViewerProps {
  assignmentId: string;
  studentId: string;
  file: string;
}

export default function EventLogViewer({ assignmentId, studentId, file }: EventLogViewerProps) {
  const { data: eventLogs, isLoading, isError } = useQuery({
    queryKey: ['eventLogs', assignmentId, studentId, file],
    queryFn: () => DefaultService.getStudentEditsReadSubjectIdAssignmentIdCodestateSectionEditsGet(studentId, assignmentId, file),
    enabled: !!(assignmentId && studentId && file),
  });

  const processedEditList = eventLogs ? createEditList(eventLogs) : null;

  return (
    <div className="w-3/4 p-4">
      <h3 className="text-lg font-semibold mb-2">Processed Edit List for {file}</h3>
      {isLoading && <div>Loading event logs...</div>}
      {isError && <div>Error fetching event logs.</div>}
      {processedEditList && (
        <CodeViewer edits={processedEditList} />
      )}
    </div>
  );
}
