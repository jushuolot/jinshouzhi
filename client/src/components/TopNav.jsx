import { Link, useLocation } from 'react-router-dom';

export default function TopNav({ role }) {
  const loc = useLocation();
  const link = (to, label) => (
    <Link to={to} className={loc.pathname === to ? 'top-nav-link active' : 'top-nav-link'}>
      {label}
    </Link>
  );

  return (
    <nav className="top-nav">
      {link('/', '首页')}
      {link('/rules', '规则')}
      {role === 'male' && link('/deposit', '保证金')}
    </nav>
  );
}
