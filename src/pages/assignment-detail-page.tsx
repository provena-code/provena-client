import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { AssignmentSubjectsResponseItem, DefaultService } from '@/api';
import { StudentsTable } from '@/features/students/components/students-table';
import { anonymizeArray, anonymizeObject } from '@/lib/anon';

export default function AssignmentDetailPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();

  const { data: students, isLoading, isError } = useQuery({
    queryKey: ['students', assignmentId],
    queryFn: () => DefaultService.getSubjectStatsForAssignment(assignmentId!),
    enabled: !!assignmentId, // Ensure the query only runs when assignmentId is available
    select: data => anonymizeArray(data).sort((a, b) => a.SubjectID.localeCompare(b.SubjectID)),
  });

  return (
    <div>
      <h3 className="text-lg font-semibold">Students</h3>
      {isLoading && <div>Loading students...</div>}
      {isError && <div>Error fetching students.</div>}
      {students && assignmentId && (
        <div className="mt-2">
          <StudentsTable students={students} assignmentId={assignmentId} />
        </div>
      )}
    </div>
  );
}