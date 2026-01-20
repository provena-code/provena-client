import { Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/home-page';
import StudentCodeStatesPage from '@/pages/student-codestates-page';
import StudentDetailPage from '@/pages/student-detail-page';
import Breadcrumbs from '@/components/breadcrumbs';
import AssignmentDetailPage from './pages/assignment-detail-page';

function App() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Teacher Dashboard</h1>
      <Breadcrumbs />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/assignment/:assignmentId" element={<AssignmentDetailPage />} />
        <Route path="/student/:studentId" element={<StudentCodeStatesPage />} />
        <Route path="/assignment/:assignmentId/student/:studentId" element={<StudentDetailPage />} />
      </Routes>
    </div>
  );
}

export default App;
