from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from django.http import JsonResponse

class JWTAuthenticationMiddleware(MiddlewareMixin):
    """
    Custom middleware for JWT authentication that allows specific paths
    to bypass authentication checks (like registration endpoints).
    """
    def process_request(self, request):
        # Skip authentication for specific paths
        public_paths = [
            '/auth/users/',               # Registration
            '/auth/users/activation/',    # Account activation
            '/auth/jwt/create/',          # Login
            '/auth/users/reset_password/' # Password reset
        ]
        
        # Skip authentication for public paths
        for path in public_paths:
            if request.path.startswith(path):
                return None

        # Skip OPTIONS requests (for CORS preflight)
        if request.method == 'OPTIONS':
            return None
            
        # Skip authentication if the user is already authenticated
        if hasattr(request, 'user') and request.user.is_authenticated:
            return None
            
        # Try to authenticate with JWT
        try:
            jwt_authenticator = JWTAuthentication()
            user_auth_tuple = jwt_authenticator.authenticate(request)
            if user_auth_tuple:
                # Store the authenticated user in the request
                request.user, _ = user_auth_tuple
        except (InvalidToken, AuthenticationFailed):
            # Continue processing if there's no valid token
            # This allows unauthenticated access to public paths
            pass
            
        return None
