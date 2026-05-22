import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/auth';

export default function AdminRoute({ children }) {
  const user            = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady       = useAuthStore((s) => s.authReady);

  // fetchMe() pas encore terminé → on attend sans rediriger
  if (!authReady) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '60vh', background: 'var(--cream)',
      }}>
        <div className="spinner-border eth-spinner" role="status" />
      </div>
    );
  }

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  if (!user.is_staff && !user.is_superuser) return <Navigate to="/" replace />;

  return children;
}
