import time
import uuid
from django.conf import settings
from django.core.mail import send_mail
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from api.throttles import LoginThrottle, PasswordResetThrottle

from .models import User, Profile
from .serializers import (
    MyTokenObtainPairSerializer,
    RegisterSerializer,
    UserSerializer,
    ProfileSerializer,
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
)


# ── JWT login (rate-limité : 10 tentatives/minute par IP) ────────────────────
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    throttle_classes = [LoginThrottle]


# ── Inscription ───────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'Compte créé avec succès.'}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── Profil courant ────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


# ── Mise à jour du profil ─────────────────────────────────────────────────────
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profile_view(request):
    profile = request.user.profile
    serializer = ProfileSerializer(profile, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        if 'full_name' in request.data:
            request.user.full_name = request.data['full_name']
            request.user.save(update_fields=['full_name'])
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── Changement de mot de passe ────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    serializer = ChangePasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = request.user
    if not user.check_password(serializer.validated_data['old_password']):
        return Response({'old_password': 'Mot de passe actuel incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(serializer.validated_data['new_password'])
    user.save()
    return Response({'message': 'Mot de passe modifié avec succès.'})


# ── Mot de passe oublié (rate-limité : 5 demandes/minute par IP) ─────────────
RESET_TOKEN_TTL = 3600  # 1 heure en secondes

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([PasswordResetThrottle])
def forgot_password_view(request):
    serializer = ForgotPasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data['email']
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Réponse identique qu'il existe ou non — évite l'énumération d'emails
        return Response({'message': 'Si ce compte existe, un email a été envoyé.'})

    # Token avec timestamp intégré : "{unix_ts}:{uuid}"
    # Permet de vérifier l'expiration sans migration de base de données.
    ts    = int(time.time())
    token = f"{ts}:{uuid.uuid4()}"
    user.reset_token = token
    user.save(update_fields=['reset_token'])

    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    send_mail(
        subject='Réinitialisation de votre mot de passe — EthniSpirit',
        message=(
            f"Cliquez sur ce lien pour réinitialiser votre mot de passe :\n\n"
            f"{reset_url}\n\n"
            f"Ce lien expire dans 1 heure."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=True,
    )
    return Response({'message': 'Si ce compte existe, un email a été envoyé.'})


# ── Réinitialisation du mot de passe ─────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_view(request):
    serializer = ResetPasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    token = serializer.validated_data['token']

    # Vérification de l'expiration (format "{ts}:{uuid}")
    try:
        ts_str, _ = token.split(':', 1)
        if time.time() - int(ts_str) > RESET_TOKEN_TTL:
            return Response(
                {'error': 'Ce lien a expiré. Veuillez faire une nouvelle demande.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
    except (ValueError, AttributeError):
        return Response({'error': 'Lien invalide ou expiré.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(reset_token=token)
    except User.DoesNotExist:
        return Response({'error': 'Lien invalide ou expiré.'}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(serializer.validated_data['new_password'])
    user.reset_token = None
    user.save()
    return Response({'message': 'Mot de passe réinitialisé avec succès.'})
