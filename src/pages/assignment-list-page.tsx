import { useQuery } from '@tanstack/react-query';
import { DefaultService } from '@/api';
import { Link } from 'react-router-dom';

export default function AssignmentListPage() {
  const { data: assignments, isLoading, isError } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => DefaultService.getAssignmentsReadAssignmentsGet(),
  });

  if (isLoading) return <div>Loading assignments...</div>;
  if (isError) return <div>Error fetching assignments.</div>;

  // Assuming assignments is an array of strings (IDs)
  return (
    <div>
      <h2 className="text-xl font-semibold">Assignments</h2>
      <ul className="mt-2">
        {Array.isArray(assignments) && assignments.map((id: string) => (
          <li key={id}>
            <Link to={`/assignment/${id}`} className="text-blue-500 hover:underline">
              {id}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
