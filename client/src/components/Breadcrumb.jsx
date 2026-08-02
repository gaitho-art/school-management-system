import { Link, useLocation } from 'react-router-dom';
import { FiChevronRight } from 'react-icons/fi';

export default function Breadcrumb() {
  const location = useLocation();
  const paths = location.pathname.split('/').filter(x => x);

  return (
    <nav className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-6">
      <Link to="/" className="hover:text-blue-500">Home</Link>
      {paths.map((p, i) => {
        const path = '/' + paths.slice(0, i + 1).join('/');
        const isLast = i === paths.length - 1;
        return (
          <div key={i} className="flex items-center">
            <FiChevronRight className="mx-2 text-xs" />
            {isLast ? (
              <span className="text-slate-800 dark:text-slate-200 font-medium capitalize">{p}</span>
            ) : (
              <Link to={path} className="hover:text-blue-500 capitalize">{p}</Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}