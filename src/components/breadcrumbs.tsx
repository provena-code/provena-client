import { Link, UIMatch, useMatches } from 'react-router-dom';

export interface RouteHandle {
  crumb: (params: Record<string, string | undefined>) => React.ReactNode;
}

const Breadcrumbs = () => {

    const matches = useMatches() as UIMatch<unknown, RouteHandle>[];;

    // Filter matches that have a 'crumb' handle
    const breadcrumbs = matches
        .filter((match) => Boolean(match.handle?.crumb))
        .map((match) => {
            return {
                name: match.handle.crumb(match.params),
                path: match.pathname,
            };
        }
    );

    // Always ensure a Home entry exists
    if (!breadcrumbs.find((c) => c.path === '/')) {
        breadcrumbs.unshift({ name: 'Home', path: '/' });
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
