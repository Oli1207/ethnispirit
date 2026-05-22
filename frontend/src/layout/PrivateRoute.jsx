import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/auth';

export default function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady       = useAuthStore((s) => s.authReady);

  // Attend la fin de fetchMe() avant de décider
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

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
