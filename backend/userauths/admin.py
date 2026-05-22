from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User, Profile


class ProfileInline(admin.StackedInline):
    model  = Profile
    extra  = 0
    fields = ('image', 'full_name', 'about', 'country', 'city', 'address', 'phone')


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    inlines         = [ProfileInline]
    list_display    = ('email', 'full_name', 'username', 'is_staff', 'date_joined')
    list_filter     = ('is_staff', 'is_active')
    search_fields   = ('email', 'full_name', 'username')
    ordering        = ('-date_joined',)
    fieldsets       = (
        (None,           {'fields': ('email', 'username', 'password')}),
        ('Infos',        {'fields': ('full_name', 'phone')}),
        ('Réinitial.',   {'fields': ('otp', 'reset_token')}),
        ('Permissions',  {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets   = (
        (None, {
            'classes': ('wide',),
            'fields':  ('email', 'username', 'full_name', 'password1', 'password2'),
        }),
    )


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display  = ('user', 'full_name', 'country', 'city')
    search_fields = ('user__email', 'full_name')
    readonly_fields = ('pid',)
