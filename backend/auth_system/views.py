from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from django.views import View

class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            access_token = response.data["access"]
            refresh_token = response.data["refresh"]

            response.set_cookie(
                key="access_token",
                value=access_token,
                httponly=True,
                secure=False,  # Change to True in production
                samesite="Lax",
                path="/",
            )
            response.set_cookie(
                key="refresh_token",
                value=refresh_token,
                httponly=True,
                secure=False,  # Change to True in production
                samesite="Lax",
                path="/",
            )
            # Include tokens in the response body
            response.data["access_token"] = access_token
            response.data["refresh_token"] = refresh_token
        return response


class LogoutView(View):
    def post(self, request, *args, **kwargs):
        response = JsonResponse({"message": "Logged out successfully"})
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")
        return response