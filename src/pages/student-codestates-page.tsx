import { useParams } from 'react-router-dom';
import StudentFileViewer from '@/features/students/components/student-file-viewer';

export default function StudentCodeStatesPage() {
    const { studentId } = useParams<{ studentId: string }>();

    return (
        <div>
            {studentId && <StudentFileViewer studentId={studentId} />}
        </div>
    );
}
