import { useParams } from 'react-router-dom';
import StudentFileViewer from '@/features/students/components/student-file-viewer';

export default function StudentDetailPage() {
    const { assignmentId, studentId } = useParams<{ assignmentId: string; studentId:string }>();

    return (
        <div>
            {studentId && assignmentId && <StudentFileViewer studentId={studentId} assignmentId={assignmentId} />}
        </div>
    );
}
