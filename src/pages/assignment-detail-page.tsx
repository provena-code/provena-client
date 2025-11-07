import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { DefaultService } from '@/api';

export default function AssignmentDetailPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();

  const { data: students, isLoading, isError } = useQuery({
    queryKey: ['students', assignmentId],
    queryFn: () => DefaultService.getAssignmentsReadAssignmentsAssignmentIdSubjectsGet(assignmentId!),
    enabled: !!assignmentId, // Ensure the query only runs when assignmentId is available
  });

  return (
    <div>
      <h2 className="text-xl font-semibold">Assignment Details</h2>
      <p className="mt-2 mb-4">Viewing details for assignment: {assignmentId}</p>

      <h3 className="text-lg font-semibold">Students</h3>
      {isLoading && <div>Loading students...</div>}
      {isError && <div>Error fetching students.</div>}
      {students && (
        <ul className="mt-2">
          {Array.isArray(students) && students.map((studentId: string) => (
            <li key={studentId}>
              <Link
                to={`/assignment/${assignmentId}/student/${studentId}`}
                className="text-blue-500 hover:underline"
              >
                {studentId}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
