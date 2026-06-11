import { useParams } from 'react-router-dom';
import { StudentTimeRangeFetcher } from '@/features/students/components/student-time-range-fetcher';

export default function StudentTimeRangePage() {
    const { studentId, range } = useParams<{ studentId: string; range: string }>();
    const startTime = range ? range.split('...')[0] : undefined;
    const endTime = range ? range.split('...')[1] : undefined;

    return (
        <div>
            {studentId && startTime && endTime && <StudentTimeRangeFetcher studentId={studentId} startTime={startTime} endTime={endTime} />}
        </div>
    );
}
