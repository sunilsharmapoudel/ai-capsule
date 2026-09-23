import { Link } from 'react-router-dom';
import Icon from './Icons.jsx';

export default function Brand({ to = '/' }) {
  const inner = (
    <>
      <span className="brand-mark"><Icon name="capsule" size={19} strokeWidth={2} /></span>
      <span className="brand-name">AI&nbsp;<em>Capsule</em></span>
    </>
  );

  if (!to) return <span className="brand">{inner}</span>;
  return <Link className="brand" to={to}>{inner}</Link>;
}
