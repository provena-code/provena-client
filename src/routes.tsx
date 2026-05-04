import React from 'react';
import { RouteObject } from 'react-router-dom';
import App from './App';
import HomePage from '@/pages/home-page';
import StudentCodeStatesPage from '@/pages/student-codestates-page';
import StudentDetailPage from '@/pages/student-detail-page';
import AssignmentDetailPage from './pages/assignment-detail-page';

// Nested route definitions. Using nesting ensures `matchRoutes` returns
// an array with both the assignment and student matches for
// `/assignment/:assignmentId/student/:studentId` so breadcrumbs can show both.
export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'assignment',
        children: [
          {
            path: ':assignmentId',
            // parent route provides the assignment-level breadcrumb
            // child routes will render inside the assignment context
            children: [
              { index: true, element: <AssignmentDetailPage /> },
              {
                path: 'student/:studentId',
                element: <StudentDetailPage />,
                handle: {
                  crumb: (params: Record<string, string>) => `Student ${params.studentId}`,
                },
              },
            ],
            handle: {
              crumb: (params: Record<string, string>) => `Assignment ${params.assignmentId}`,
            },
          },
        ],
      },
      {
        path: 'student',
        children: [
          {
            path: ':studentId',
            element: <StudentCodeStatesPage />,
            handle: { crumb: (params: Record<string, string>) => `Student ${params.studentId}` },
          },
        ],
      },
    ],
  },
];

export default appRoutes;
