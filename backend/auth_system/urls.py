from django.urls import path, include, re_path
from django.views.generic import TemplateView
from .views import CustomTokenObtainPairView, LogoutView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("api/", include("sop.urls")),
    #path("google-drive/", include("sop.urls")),
    path("auth/jwt/create/", CustomTokenObtainPairView.as_view(), name="jwt-create"),
    path("auth/jwt/refresh/", TokenRefreshView.as_view(), name="jwt-refresh"),
    path("auth/logout/", LogoutView.as_view(), name='logout'),
    path('auth/', include('djoser.urls')),
    path('auth/', include('djoser.urls.jwt')),
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]
