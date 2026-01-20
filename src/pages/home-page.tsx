import { useQuery } from '@tanstack/react-query';
import { DefaultService } from '@/api';
import { Link } from 'react-router-dom';

export default function HomePage() {
  const { data: assignments, isLoading: isLoadingAssignments, isError: isErrorAssignments } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => DefaultService.getAssignmentIDs(),
  });

  const { data: students, isLoading: isLoadingStudents, isError: isErrorStudents } = useQuery({
    queryKey: ['students'],
    queryFn: () => DefaultService.getSubjectIDs(),
  });

  return (
    <div>
      <h2 className="text-xl font-semibold">Assignments</h2>
      {isLoadingAssignments && <div>Loading assignments...</div>}
      {isErrorAssignments && <div>Error fetching assignments.</div>}
      <ul className="mt-2">
        {Array.isArray(assignments) && assignments.map((id: string) => (
          <li key={id}>
            <Link to={`/assignment/${id}`} className="text-blue-500 hover:underline">
              {id}
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="text-xl font-semibold mt-8">Students</h2>
      {isLoadingStudents && <div>Loading students...</div>}
      {isErrorStudents && <div>Error fetching students.</div>}
      <ul className="mt-2">
        {Array.isArray(students) && students.map((id: string) => (
          <li key={id}>
            <Link to={`/student/${id}`} className="text-blue-500 hover:underline">
              {id}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
