from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from api import views as api_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('userauths.urls')),
    path('api/',      include('api.urls')),
    # SEO
    path('sitemap.xml', api_views.sitemap_xml, name='sitemap_xml'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
