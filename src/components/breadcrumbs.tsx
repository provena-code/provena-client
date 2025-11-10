
import { Link, useMatch } from 'react-router-dom';

const Breadcrumbs = () => {
  // useMatch allows us to get route params even outside the <Routes> context.
  const studentRouteMatch = useMatch('/assignment/:assignmentId/student/:studentId');
  const assignmentRouteMatch = useMatch('/assignment/:assignmentId');

  // The params from the most specific match will be used.
  const params = studentRouteMatch?.params || assignmentRouteMatch?.params || {};
  const { assignmentId, studentId } = params;

  const breadcrumbs = [{ name: 'Home', path: '/' }];

  if (assignmentId) {
    breadcrumbs.push({
      name: `Assignment ${assignmentId}`,
      path: `/assignment/${assignmentId}`,
    });
  }

  if (studentId) {
    breadcrumbs.push({
      name: `Student ${studentId}`,
      path: `/assignment/${assignmentId}/student/${studentId}`,
    });
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center space-x-2 text-sm">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <li key={crumb.path} className="flex items-center">
              {index > 0 && <span className="mx-2">/</span>}
              {isLast ? (
                <span className="font-semibold text-gray-600">{crumb.name}</span>
              ) : (
                <Link to={crumb.path} className="text-blue-600 hover:underline">
                  {crumb.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
