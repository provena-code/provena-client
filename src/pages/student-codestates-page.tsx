import { useParams } from 'react-router-dom';
import { StudentFilesFetcher } from '@/features/students/components/student-files-fetcher';

export default function StudentCodeStatesPage() {
    const { studentId } = useParams<{ studentId: string }>();

    return (
        <div>
            {studentId && <StudentFilesFetcher studentId={studentId} />}
        </div>
    );
}
