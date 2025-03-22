from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.sites.shortcuts import get_current_site
from django.core.mail import send_mail
from django.db.models import Q  # Import Q
from django.http import JsonResponse, HttpResponse
from django.shortcuts import HttpResponseRedirect, redirect, get_object_or_404
from django.utils.decorators import method_decorator
from django.views import View
from pydrive2.auth import GoogleAuth
from pydrive2.drive import GoogleDrive
from oauth2client.client import OAuth2Credentials
from rest_framework import status, generics, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView
from sop.serializers import UserCreateSerializer, DocumentSerializer
from .models import UserAccount, Team, TeamMembership, Task, Document
from .permissions import IsOwnerOrAssignedUser
from .serializers import TeamSerializer, TaskSerializer
import docx2txt
import json
import logging
import os
import requests
import time
import tempfile
import urllib.parse

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
    
class GoogleDriveUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Get title, team id, and file/text from the request.
            title = request.data.get('title')
            team_id = request.data.get('team_id')
            file_obj = request.FILES.get('file')
            text_content = request.data.get('text_content')
            
            if not title or not team_id:
                return Response({"error": "Title and team are required."}, status=status.HTTP_400_BAD_REQUEST)
            
            if not file_obj and not text_content:
                return Response({"error": "You must provide either a file or text content."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Retrieve the team (if not provided, you could default to None for a personal document)
            team = get_object_or_404(Team, id=team_id) if team_id else None
            
            # Prepare Google Auth with PyDrive2
            gauth = GoogleAuth()
            gauth.DEFAULT_SETTINGS['client_config_file'] = settings.GOOGLE_CLIENT_SECRETS_FILE
            
            # Load credentials stored in the session
            creds_json = request.session.get('google_drive_credentials')
            if not creds_json:
                return Response({"error": "Not authenticated with Google Drive."}, status=status.HTTP_401_UNAUTHORIZED)
            
            try:
                credentials = OAuth2Credentials.from_json(creds_json)
            except Exception as e:
                logger.error("Failed to load Google Drive credentials: %s", e, exc_info=True)
                return Response({"error": "Invalid Google Drive credentials."}, status=status.HTTP_400_BAD_REQUEST)
            
            gauth.credentials = credentials
            drive = GoogleDrive(gauth)
            
            # Create a new Google Docs file by specifying the Google Docs MIME type.
            # This helps Google Drive convert Word files into an editable Google Docs format.
            if text_content:
                # For text input, create a Google Doc directly.
                gfile = drive.CreateFile({'title': title})
                gfile.SetContentString(text_content)
            else:
                # For a file upload, do NOT specify a mimeType; let Google detect it and convert.
                gfile = drive.CreateFile({'title': title})
                import tempfile
                with tempfile.NamedTemporaryFile(delete=False) as temp:
                    for chunk in file_obj.chunks():
                        temp.write(chunk)
                    temp.flush()
                    file_path = temp.name
                gfile.SetContentFile(file_path)
            
            # Upload with conversion enabled.
            #gfile.Upload({'convert': True})

             # Retry upload (with conversion) up to max_attempts.
            max_attempts = 3
            for attempt in range(max_attempts):
                try:
                    gfile.Upload({'convert': True})
                    break  # if successful, exit the loop
                except Exception as upload_error:
                    logger.error("Upload attempt %s failed: %s", attempt + 1, upload_error)
                    if attempt == max_attempts - 1:
                        return Response({"error": "Failed to upload file after multiple attempts: " + str(upload_error)},
                                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                    time.sleep(2)  # wait before retrying

            # Insert permission to allow anyone to view the document.
            permission = {
                'type': 'anyone',
                'role': 'writer'
            }
            gfile.InsertPermission(permission)
            
            # Retry fetching metadata up to max_attempts.
            file_url = None
            for attempt in range(max_attempts):
                time.sleep(2)  # Add a delay before fetching metadata
                gfile.FetchMetadata(fields='id, webViewLink, webContentLink, title')
                file_url = gfile.get('alternateLink') or gfile.get('embedLink')
                logger.info("Attempt %s: Fetched file URL: %s", attempt + 1, file_url)
                if file_url:
                    break

            if not file_url:
                logger.error("No public file URL returned from Google Drive after %s attempts.", max_attempts)
                return Response({"error": "File URL not generated by Google Drive."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            drive_file_id = gfile.get('id')

            # Optionally remove the temporary file if used.
            if file_obj and not text_content:
                try:
                    os.remove(file_path)
                except Exception as e:
                    logger.warning("Could not remove temporary file: %s", e)
            
            # Save metadata in your database.
            document = Document.objects.create(
                title=title,
                file_url=file_url,
                google_drive_file_id=drive_file_id,
                owner=request.user,
                team=team
            )
            
            serializer = DocumentSerializer(document)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            logger.error("Error in GoogleDriveUploadView: %s", e, exc_info=True)
            return Response({"error": "An internal error occurred: " + str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        
class DocumentViewSet(viewsets.ReadOnlyModelViewSet):
    
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        return Document.objects.filter(Q(team__in=user.teams.all()) | Q(owner=user, team__isnull=True))
    
class GoogleDriveFileContentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, document_id):
        """ Retrieve content from a Google Doc and return as plain text. """
        document = get_object_or_404(Document, id=document_id)
        file_id = document.google_drive_file_id

        if not file_id:
            return Response({"error": "Document does not have an associated Google Drive file ID."}, status=400)

        # Load stored credentials from session.
        creds_json = request.session.get('google_drive_credentials')
        if not creds_json:
            return Response({"error": "Not authenticated with Google Drive."}, status=401)

        try:
            credentials = OAuth2Credentials.from_json(creds_json)
        except Exception as e:
            logger.error("Failed to load credentials: %s", e, exc_info=True)
            return Response({"error": "Invalid Google Drive credentials."}, status=400)

        # Prepare PyDrive2 authentication
        gauth = GoogleAuth()
        gauth.DEFAULT_SETTINGS['client_config_file'] = settings.GOOGLE_CLIENT_SECRETS_FILE
        gauth.credentials = credentials
        drive = GoogleDrive(gauth)

        # Fetch file metadata, ensuring we get the export links
        gfile = drive.CreateFile({'id': file_id})
        gfile.FetchMetadata(fields='id, title, mimeType, exportLinks')

        # Check if the file is a Google Doc
        if gfile.get('mimeType') != 'application/vnd.google-apps.document':
            return Response({"error": "This API only supports Google Docs files."}, status=400)

        # Fetch the export link for html, plain text removes formatting
        export_links = gfile.get('exportLinks', {})
        html_export_link = export_links.get('text/html')

        if not html_export_link:
            logger.error("No HTML export link available for this Google Doc.")
            return Response({"error": "Unable to export Google Doc as HTML."}, status=500)

        # Download the document content
        try:
            response = requests.get(html_export_link)
            response.raise_for_status()  # Raise an error for failed HTTP responses
            content = response.text
        except Exception as e:
            logger.error("Failed to download Google Docs HTML content: %s", e, exc_info=True)
            return Response({"error": "Failed to retrieve document content."}, status=500)

        return Response({"title":document.title, "content": content, "file_url": document.file_url}, status=200)
    