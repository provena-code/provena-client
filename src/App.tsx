import { Routes, Route } from 'react-router-dom';
import AssignmentListPage from '@/pages/assignment-list-page';
import AssignmentDetailPage from '@/pages/assignment-detail-page';
import StudentDetailPage from '@/pages/student-detail-page';
import Breadcrumbs from '@/components/breadcrumbs';

function App() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Teacher Dashboard</h1>
      <Breadcrumbs />
      <Routes>
        <Route path="/" element={<AssignmentListPage />} />
        <Route path="/assignment/:assignmentId" element={<AssignmentDetailPage />} />
        <Route path="/assignment/:assignmentId/student/:studentId" element={<StudentDetailPage />} />
      </Routes>
    </div>
  );
}

export default App;
