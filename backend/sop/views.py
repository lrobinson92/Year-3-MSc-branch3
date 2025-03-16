import requests
from rest_framework import status, generics, viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.views import APIView
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
from django.db.models import Q  # Import Q
from django.http import JsonResponse, HttpResponse
from django.utils.decorators import method_decorator
from .models import UserAccount, Team, TeamMembership, Task, Document
from .serializers import TeamSerializer, TaskSerializer
from django.contrib.sites.shortcuts import get_current_site
from sop.serializers import UserCreateSerializer, DocumentSerializer
from .permissions import IsOwnerOrAssignedUser
from django.shortcuts import HttpResponseRedirect, redirect, get_object_or_404
import urllib.parse
from django.conf import settings
from django.views import View
from oauth2client.client import OAuth2Credentials
import logging
import json
from pydrive2.auth import GoogleAuth
from pydrive2.drive import GoogleDrive

logger = logging.getLogger(__name__)  # Use Django's logging system

User = get_user_model()

class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Team.objects.filter(team_memberships__user=user)

    def perform_create(self, serializer):
        team = serializer.save(created_by=self.request.user)
        # Create a TeamMembership entry for the creator
        TeamMembership.objects.create(
            user=self.request.user,
            team=team,
            role='owner'
        )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def invite_member(self, request, pk=None):
        team = self.get_object()
        email = request.data.get('email')
        role = request.data.get('role', 'member')

        if role not in dict(TeamMembership.ROLE_CHOICES):
            return Response({'error': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)

        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'User does not exist'}, status=status.HTTP_404_NOT_FOUND)

        # Check if the user is already a member of the team
        if TeamMembership.objects.filter(user=user, team=team).exists():
            return Response({'error': 'User is already a member of the team'}, status=status.HTTP_400_BAD_REQUEST)

        # Add the user to the team
        TeamMembership.objects.create(user=user, team=team, role=role)

        # Send an email notification
        current_site = get_current_site(request)
        mail_subject = 'Team Invitation'
        message = f'Hi {user.name},\n\nYou have been added to the team {team.name} on SOPify.\n\nYou can now access the team and start collaborating.\n\nBest regards,\n{current_site.domain}'
        send_mail(
            mail_subject,
            message,
            'SOPify Admin',
            [email],
            fail_silently=False,
        )

        return Response({'message': 'Invitation sent and user added to the team'}, status=status.HTTP_200_OK)   

    @action(detail=True, methods=['get'], url_path='users-in-same-team')
    def users_in_same_team(self, request, pk=None):
        team = self.get_object()
        memberships = TeamMembership.objects.filter(team=team).select_related('user')
        users = UserAccount.objects.filter(team_memberships__team=team)
        serializer = UserCreateSerializer(users, many=True)

        data = [
            {
                "user": membership.user.id,  # User ID
                "user_name": membership.user.name,  # User Name
                "role": membership.role  # Include role
            }
            for membership in memberships
        ]
        
        return Response(data)

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_member_role(self, request, pk=None):
        """ Allow only the team owner to update a member’s role. """


        team = self.get_object()

        # ✅ Ensure the requesting user is the owner
        is_owner = TeamMembership.objects.filter(user=request.user, team=team, role='owner').exists()
        
        if not is_owner:
            return Response({'error': 'Only the team owner can update member roles'}, status=status.HTTP_403_FORBIDDEN)

        user_id = request.data.get('user_id')
        new_role = request.data.get('role')

        if new_role not in dict(TeamMembership.ROLE_CHOICES):
            return Response({'error': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            membership = TeamMembership.objects.get(user_id=user_id, team=team)
            
            # Prevent owners from demoting themselves
            if membership.user == request.user:
                return Response({'error': 'You cannot change your own role'}, status=status.HTTP_400_BAD_REQUEST)

            membership.role = new_role
            membership.save()
            return Response({'message': f'User role updated to {new_role} successfully'}, status=status.HTTP_200_OK)
        except TeamMembership.DoesNotExist:
            return Response({'error': 'User is not in this team'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['delete'], permission_classes=[IsAuthenticated])
    def remove_member(self, request, pk=None):
        """ Allow only the team owner to remove a member. """
        team = self.get_object()

        # Check if the requesting user is the owner
        if not TeamMembership.objects.filter(user=request.user, team=team, role='owner').exists():
            return Response({'error': 'Only the team owner can remove members'}, status=status.HTTP_403_FORBIDDEN)

        user_id = request.data.get('user_id')

        try:
            membership = TeamMembership.objects.get(user_id=user_id, team=team)

            # Prevent owners from removing themselves
            if membership.user == request.user:
                return Response({'error': 'You cannot remove yourself as an owner'}, status=status.HTTP_400_BAD_REQUEST)

            membership.delete()
            return Response({'message': 'User removed from team successfully'}, status=status.HTTP_200_OK)
        except TeamMembership.DoesNotExist:
            return Response({'error': 'User is not in this team'}, status=status.HTTP_404_NOT_FOUND)


class IsTeamOwner(BasePermission):
    """ Custom permission: Only team owners can edit roles or remove members. """
    def has_object_permission(self, request, view, obj):
        return TeamMembership.objects.filter(user=request.user, team=obj, role='owner').exists()



class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAssignedUser]

    def get_queryset(self):
        user = self.request.user
        return Task.objects.filter(
            Q(assigned_to=user) | 
            Q(team__team_memberships__user=user)
        ).distinct()
    
    @action(detail=False, methods=['get'], url_path='user-and-team-tasks', permission_classes=[IsAuthenticated])
    def user_and_team_tasks(self, request):
        user = request.user
        user_tasks = Task.objects.filter(assigned_to=user)
        team_tasks = Task.objects.filter(team__team_memberships__user=user).exclude(assigned_to=user)
        user_tasks_serializer = TaskSerializer(user_tasks, many=True)
        team_tasks_serializer = TaskSerializer(team_tasks, many=True)
        return Response({
            'user_tasks': user_tasks_serializer.data,
            'team_tasks': team_tasks_serializer.data
        })
    
class UsersInSameTeamView(generics.ListAPIView):
    serializer_class = UserCreateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        team_id = self.kwargs['team_id']
        return UserAccount.objects.filter(team_memberships__team_id=team_id)
    

class GoogleDriveLoginView(View):
    def get(self, request, *args, **kwargs):
        """
        Initiate OAuth flow with Google Drive.
        """
        gauth = GoogleAuth()
        # Point to your client_secrets.json file (update the path as needed)
        gauth.DEFAULT_SETTINGS['client_config_file'] = settings.GOOGLE_CLIENT_SECRETS_FILE  # e.g., "client_secrets.json"
        
        # Get the authentication URL and redirect the user there
        auth_url = gauth.GetAuthUrl()
        return redirect(auth_url)

class GoogleDriveCallbackView(View):
    def get(self, request, *args, **kwargs):
        """
        Handles the OAuth callback from Google, exchanges the code for credentials,
        and stores the credentials in the session.
        """
        code = request.GET.get('code')
        if not code:
            return HttpResponse("Error: No authorization code provided", status=400)
        
        gauth = GoogleAuth()
        gauth.DEFAULT_SETTINGS['client_config_file'] = settings.GOOGLE_CLIENT_SECRETS_FILE
        # Exchange the code for credentials
        gauth.Auth(code=code)
        
        # Save the credentials (as JSON) in the session; in production, store them securely!
        request.session['google_drive_credentials'] = gauth.credentials.to_json()
        
        # Redirect the user to the Documents page (or wherever you need)
        return redirect("http://localhost:3000/view/documents")

class ListDriveFilesView(View):
    def get(self, request, *args, **kwargs):
        creds_json = request.session.get('google_drive_credentials')
        if not creds_json:
            return HttpResponse("Not authenticated with Google Drive", status=401)
        
        gauth = GoogleAuth()
        gauth.DEFAULT_SETTINGS['client_config_file'] = settings.GOOGLE_CLIENT_SECRETS_FILE
        
        # Load the credentials using from_json, which returns an OAuth2Credentials instance.
        credentials = OAuth2Credentials.from_json(creds_json)
        gauth.credentials = credentials
        
        drive = GoogleDrive(gauth)
        file_list = drive.ListFile({'q': "'root' in parents and trashed=false"}).GetList()
        files = [{"id": f['id'], "title": f['title']} for f in file_list]
        
        return JsonResponse({"files": files})