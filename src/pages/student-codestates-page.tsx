import { useParams } from 'react-router-dom';
import { StudentFilesFetcher } from '@/features/students/components/student-files-fetcher';
import TimeRangeSelector from '@/features/students/components/time-range-selector';

export default function StudentCodeStatesPage() {
    const { studentId } = useParams<{ studentId: string }>();

    return (
        <div>
            {studentId && <TimeRangeSelector subjectId={studentId} />}
            {studentId && <StudentFilesFetcher studentId={studentId} />}
        </div>
    );
}
