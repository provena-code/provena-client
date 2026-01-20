import { Link, useMatch, useParams } from 'react-router-dom';

const Breadcrumbs = () => {
    // useParams is simpler than useMatch for this case
    const params = useParams<{ assignmentId?: string; studentId?: string }>();
    const { assignmentId, studentId } = params;

    const breadcrumbs = [{ name: 'Home', path: '/' }];

    if (assignmentId) {
        breadcrumbs.push({
            name: `Assignment ${assignmentId}`,
            path: `/assignment/${assignmentId}`,
        });
    }

    if (studentId) {
        let path;
        if (assignmentId) {
            path = `/assignment/${assignmentId}/student/${studentId}`;
        } else {
            path = `/student/${studentId}`;
        }
        breadcrumbs.push({
            name: `Student ${studentId}`,
            path: path,
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
