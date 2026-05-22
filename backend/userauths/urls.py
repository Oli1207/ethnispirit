from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    MyTokenObtainPairView,
    register_view,
    me_view,
    update_profile_view,
    change_password_view,
    forgot_password_view,
    reset_password_view,
)

urlpatterns = [
    path('token/',         MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(),      name='token_refresh'),
    path('register/',      register_view,                   name='register'),
    path('me/',            me_view,                         name='me'),
    path('me/update/',     update_profile_view,             name='update_profile'),
    path('me/password/',   change_password_view,            name='change_password'),
    path('forgot-password/', forgot_password_view,          name='forgot_password'),
    path('reset-password/',  reset_password_view,           name='reset_password'),
]
