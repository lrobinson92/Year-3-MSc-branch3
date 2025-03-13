from rest_framework_simplejwt.authentication import JWTAuthentication
from django.utils.deprecation import MiddlewareMixin
from django.http import HttpResponse

class JWTAuthenticationMiddleware(MiddlewareMixin):
    def process_request(self, request):
        # Exempt these URLs from authentication
        if request.path in ["/onedrive/callback/", "/auth/jwt/create/", "/auth/jwt/refresh/"]: # Added the refresh
            return None # Continue with request
        
        auth = JWTAuthentication()
        header = auth.get_header(request)
        
        if header is None:
            raw_token = request.COOKIES.get("access_token")
            if raw_token:
                request.META["HTTP_AUTHORIZATION"] = f"Bearer {raw_token}"

        return None # Continue with request
