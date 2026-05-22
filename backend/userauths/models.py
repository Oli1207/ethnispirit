import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save
from django.dispatch import receiver


class User(AbstractUser):
    username    = models.CharField(max_length=100, unique=True)
    email       = models.EmailField(unique=True)
    full_name   = models.CharField(max_length=200, blank=True)
    phone       = models.CharField(max_length=30, blank=True)
    otp         = models.CharField(max_length=10, blank=True, null=True)
    reset_token = models.CharField(max_length=200, blank=True, null=True)

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

    def save(self, *args, **kwargs):
        if not self.username:
            self.username = self.email.split('@')[0]
        super().save(*args, **kwargs)


class Profile(models.Model):
    user      = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    pid       = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    image     = models.ImageField(upload_to='profile/', blank=True, null=True)
    full_name = models.CharField(max_length=200, blank=True)
    about     = models.TextField(blank=True)
    country   = models.CharField(max_length=100, blank=True)
    city      = models.CharField(max_length=100, blank=True)
    address   = models.TextField(blank=True)
    phone     = models.CharField(max_length=30, blank=True)
    date      = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user.email} — Profil'


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
