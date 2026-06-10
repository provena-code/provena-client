import { useParams } from 'react-router-dom';
import { StudentFilesFetcher } from '@/features/students/components/student-files-fetcher';

export default function StudentDetailPage() {
    const { assignmentId, studentId } = useParams<{ assignmentId: string; studentId: string }>();

    return (
        <div>
            {studentId && <StudentFilesFetcher studentId={studentId} assignmentId={assignmentId} />}
        </div>
    );
}
