import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/auth';
import { hasPermission } from '../utils/permissions';

/**
 * Protège une route admin.
 *
 * @param {string}  [requiredPerm]  Permission RBAC requise (ex: "orders_view").
 *                                  Si absente, seul is_staff suffit.
 * @param {boolean} [superadminOnly] Réservé aux superadmins (is_superuser ou rôle superadmin).
 */
export default function AdminRoute({ children, requiredPerm, superadminOnly }) {
  const user       = useAuthStore((s) => s.user);
  const isAuth     = useAuthStore((s) => s.isAuthenticated);
  const authReady  = useAuthStore((s) => s.authReady);

  // En attente du fetchMe()
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

  // Non connecté
  if (!isAuth || !user) return <Navigate to="/login" replace />;

  // Pas du tout staff
  if (!user.is_staff && !user.is_superuser) return <Navigate to="/" replace />;

  // Superadmin-only : is_superuser Django OU rôle superadmin avec compte actif
  const isSuperAdmin = user.is_superuser || user.staff_profile?.role === 'superadmin';

  if (superadminOnly && !isSuperAdmin) {
    return <Navigate to="/admin-dashboard" replace />;
  }

  // Permission spécifique requise
  if (requiredPerm && !hasPermission(user, requiredPerm)) {
    return <Navigate to="/admin-dashboard" replace />;
  }

  return children;
}
