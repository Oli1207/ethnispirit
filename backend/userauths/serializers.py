from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User, Profile


# ── JWT token enrichi ─────────────────────────────────────────────────────────
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email']        = user.email
        token['full_name']    = user.full_name
        token['username']     = user.username
        token['is_staff']     = user.is_staff
        token['is_superuser'] = user.is_superuser
        return token


# ── Inscription ───────────────────────────────────────────────────────────────
class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model  = User
        fields = ('email', 'full_name', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Les mots de passe ne correspondent pas.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            username  = validated_data['email'].split('@')[0],
            email     = validated_data['email'],
            full_name = validated_data.get('full_name', ''),
            password  = validated_data['password'],
        )
        return user


# ── Profil ────────────────────────────────────────────────────────────────────
class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Profile
        fields = ('pid', 'image', 'full_name', 'about', 'country', 'city', 'address', 'phone')
        read_only_fields = ('pid',)


# ── Staff Profile (inline) ────────────────────────────────────────────────────
class StaffProfileInlineSerializer(serializers.Serializer):
    """Représentation légère du StaffProfile pour inclusion dans UserSerializer."""
    role                   = serializers.CharField()
    role_label             = serializers.SerializerMethodField()
    extra_permissions      = serializers.JSONField()
    effective_permissions  = serializers.SerializerMethodField()
    notify_universes       = serializers.JSONField()
    is_active              = serializers.BooleanField()

    def get_role_label(self, obj):
        return obj.get_role_display()

    def get_effective_permissions(self, obj):
        return obj.get_effective_permissions()


# ── Utilisateur (lecture) ─────────────────────────────────────────────────────
class UserSerializer(serializers.ModelSerializer):
    profile       = ProfileSerializer(read_only=True)
    staff_profile = StaffProfileInlineSerializer(read_only=True)

    class Meta:
        model  = User
        fields = ('id', 'email', 'username', 'full_name', 'phone',
                  'is_staff', 'is_superuser', 'profile', 'staff_profile')
        read_only_fields = ('id', 'email', 'username', 'is_staff', 'is_superuser')


# ── Changement de mot de passe ────────────────────────────────────────────────
class ChangePasswordSerializer(serializers.Serializer):
    old_password  = serializers.CharField(required=True)
    new_password  = serializers.CharField(required=True, validators=[validate_password])
    new_password2 = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({'new_password': 'Les mots de passe ne correspondent pas.'})
        return attrs


# ── Mot de passe oublié ───────────────────────────────────────────────────────
class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class ResetPasswordSerializer(serializers.Serializer):
    token        = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
