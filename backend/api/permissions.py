"""
Permissions RBAC du personnel (rôles staff), appliquées CÔTÉ SERVEUR.

Avant : seule l'interface React masquait les pages selon le rôle ; l'API se contentait de
IsAdminUser (= is_staff). Un compte « Livraison » pouvait donc, en appelant l'API directement,
supprimer des produits ou lire les analytics.

La règle reproduit exactement celle de l'interface (frontend/src/utils/permissions.js) :
  - il faut is_staff ;
  - superuser Django                          → tout est permis ;
  - pas de StaffProfile, ou profil inactif    → rien (hors pages sans permission requise) ;
  - rôle « superadmin » actif                 → tout est permis ;
  - sinon : permissions par défaut du rôle + surcharges individuelles (extra_permissions).

Usage :
    @permission_classes([staff_permission('products_manage')])
    @permission_classes([staff_permission('orders_manage', 'orders_status_only')])   # l'une OU l'autre
    @permission_classes([staff_permission('products_manage', GET='products_view')])  # selon la méthode
"""
from rest_framework.permissions import BasePermission


def user_has_staff_permission(user, perm):
    if not (user and user.is_authenticated and user.is_staff):
        return False
    if user.is_superuser:
        return True
    profile = getattr(user, 'staff_profile', None)   # absent => RelatedObjectDoesNotExist (un AttributeError)
    if profile is None or not profile.is_active:
        return False
    if profile.role == 'superadmin':
        return True
    return profile.has_permission(perm)


def staff_permission(*perms, **by_method):
    """Fabrique une permission DRF : autorisé si l'utilisateur a AU MOINS UNE des `perms`.
    `by_method` (ex. GET='products_view') remplace la liste pour cette méthode HTTP."""
    per_method = {
        method.upper(): (value if isinstance(value, (tuple, list)) else (value,))
        for method, value in by_method.items()
    }

    class _StaffPermission(BasePermission):
        message = "Votre rôle ne vous permet pas d'effectuer cette action."

        def has_permission(self, request, view):
            needed = per_method.get(request.method, perms)
            return any(user_has_staff_permission(request.user, p) for p in needed)

    _StaffPermission.__name__ = 'StaffPermission_' + '_'.join(perms or ('custom',))
    return _StaffPermission
