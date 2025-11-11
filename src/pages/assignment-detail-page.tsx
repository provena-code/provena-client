import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { DefaultService } from '@/api';
import { StudentsTable } from '@/features/students/components/students-table';

export default function AssignmentDetailPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();

  const { data: students, isLoading, isError } = useQuery({
    queryKey: ['students', assignmentId],
    queryFn: () => DefaultService.getAssignmentsReadAssignmentsAssignmentIdSubjectsGet(assignmentId!),
    enabled: !!assignmentId, // Ensure the query only runs when assignmentId is available
  });

  return (
    <div>
      <h3 className="text-lg font-semibold">Students</h3>
      {isLoading && <div>Loading students...</div>}
      {isError && <div>Error fetching students.</div>}
      {students && (
        <div className="mt-2">
          <StudentsTable students={students} />
        </div>
      )}
    </div>
  );
}
