from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.sites.shortcuts import get_current_site
from django.core.mail import send_mail
from django.db.models import Q  # Import Q
from django.http import JsonResponse, HttpResponse
from django.shortcuts import HttpResponseRedirect, redirect, get_object_or_404
from django.utils.dateparse import parse_datetime
from django.utils.decorators import method_decorator
from django.views import View
from pydrive2.auth import GoogleAuth
from pydrive2.drive import GoogleDrive
from oauth2client.client import OAuth2Credentials
from openai import OpenAI
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
import openai
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

    def perform_destroy(self, instance):
        """Only allow team owners to delete teams"""
        # Check if the requesting user is the owner
        is_owner = TeamMembership.objects.filter(
            user=self.request.user, 
            team=instance, 
            role='owner'
        ).exists()
        
        if is_owner:
            instance.delete()
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only team owners can delete a team.")

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
        gauth.DEFAULT_SETTINGS['client_config_file'] = settings.GOOGLE_CLIENT_SECRETS_FILE
        gauth.LoadClientConfigFile(settings.GOOGLE_CLIENT_SECRETS_FILE)

        # Force the correct web-based flow
        gauth.GetFlow()
        gauth.flow.redirect_uri = "http://localhost:8000/api/google-drive/callback/"  # This must match the authorized redirect URI
        auth_url = gauth.flow.step1_get_authorize_url()
        return redirect(auth_url)

class GoogleDriveCallbackView(View):
    def get(self, request, *args, **kwargs):
        """
        Handles the OAuth callback from Google, exchanges the code for credentials,
        and stores the credentials in the session.
        """
        code = request.GET.get('code')
        redirect_url = request.GET.get('state', '') or 'http://localhost:3000/view/documents'
        
        if not code:
            return HttpResponse("Error: No authorization code provided", status=400)
        
        gauth = GoogleAuth()
        gauth.DEFAULT_SETTINGS['client_config_file'] = settings.GOOGLE_CLIENT_SECRETS_FILE
        
        # Exchange the code for credentials
        gauth.Auth(code=code)
        
        # Save the credentials (as JSON) in the session
        request.session['google_drive_credentials'] = gauth.credentials.to_json()
        
        # Try to parse the state parameter if it exists (for redirect)
        try:
            # Redirect to the frontend callback page with a success indicator
            return redirect(f"{redirect_url}?drive_auth=success")
        except Exception as e:
            logger.error("Error parsing redirect URL: %s", str(e))
            # Default redirect
            return redirect("http://localhost:3000/view/documents?drive_auth=success")

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
            # Get form data
            title = request.data.get('title')
            team_id = request.data.get('team_id', None)
            file_obj = request.FILES.get('file')
            text_content = request.data.get('text_content')
            content_type = request.data.get('content_type')  # HTML or plain text
            review_date = request.data.get('review_date')
            
            if not title:
                return Response({"error": "Title is required."}, status=status.HTTP_400_BAD_REQUEST)
            
            if not file_obj and not text_content:
                return Response({"error": "You must provide either a file or text content."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Retrieve the team (if not provided, you could default to None for a personal document)
            team = None
            if team_id:
                team = get_object_or_404(Team, id=team_id)
            
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
            
            # Create file in Google Drive - don't specify mimeType yet
            gfile = drive.CreateFile({'title': title})
            
            # Create a temporary file
            temp_file = None
            file_path = None
            mime_type = 'text/plain'  # Default MIME type
            
            try:
                if text_content:
                    # For HTML content, write to a temporary HTML file
                    if content_type == 'html':
                        # Fix the HTML content structure
                        html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{title}</title>
</head>
<body>
{text_content}
</body>
</html>"""
                        
                        # Use .html extension for HTML files
                        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.html')
                        temp_file.write(html_content.encode('utf-8'))
                        temp_file.flush()
                        file_path = temp_file.name
                        mime_type = 'text/html'  # Set HTML MIME type
                    else:
                        # Plain text
                        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.txt')
                        temp_file.write(text_content.encode('utf-8'))
                        temp_file.flush()
                        file_path = temp_file.name
                        mime_type = 'text/plain'  # Set plain text MIME type
                        
                elif file_obj:
                    # For a file upload, write to a temporary file
                    suffix = '.' + file_obj.name.split('.')[-1].lower()
                    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
                    for chunk in file_obj.chunks():
                        temp_file.write(chunk)
                    temp_file.flush()
                    file_path = temp_file.name
                    
                    # Determine MIME type based on file extension
                    if suffix == '.docx':
                        mime_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                    elif suffix == '.doc':
                        mime_type = 'application/msword'
                    elif suffix == '.pdf':
                        mime_type = 'application/pdf'
                    elif suffix == '.txt':
                        mime_type = 'text/plain'
                    elif suffix == '.html' or suffix == '.htm':
                        mime_type = 'text/html'
                    else:
                        # Default to binary for unknown types
                        mime_type = 'application/octet-stream'
                
                # Explicitly set the content file with the correct MIME type
                gfile.SetContentFile(file_path)
                gfile['mimeType'] = mime_type
                
            finally:
                if temp_file:
                    temp_file.close()
            
            # Upload with conversion enabled
            max_attempts = 3
            for attempt in range(max_attempts):
                try:
                    gfile.Upload({'convert': True})
                    break
                except Exception as upload_error:
                    logger.error("Upload attempt %s failed: %s", attempt + 1, upload_error, exc_info=True)
                    if attempt == max_attempts - 1:
                        return Response({"error": f"Failed to upload file after {max_attempts} attempts: {str(upload_error)}"},
                                      status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                    time.sleep(2)  # wait before retrying
            
            # After successful upload, convert to Google Docs format
            try:
                # Get the file ID
                file_id = gfile['id']
                
                # Convert to Google Docs format by copying
                url = f"https://www.googleapis.com/drive/v2/files/{file_id}/copy"
                headers = {
                    'Authorization': f'Bearer {credentials.access_token}',
                    'Content-Type': 'application/json'
                }
                payload = {
                    'title': title,
                    'mimeType': 'application/vnd.google-apps.document'
                }
                
                response = requests.post(url, headers=headers, json=payload)
                response.raise_for_status()
                
                # Get the new file ID and delete the original file
                result = response.json()
                new_file_id = result.get('id')
                
                # Update gfile to point to the new converted file
                if new_file_id:
                    # Delete original file
                    gfile.Delete()
                    
                    # Update to the new Google Doc
                    gfile = drive.CreateFile({'id': new_file_id})
                    drive_file_id = new_file_id
                else:
                    drive_file_id = gfile['id']
            except Exception as e:
                # If conversion fails, keep the original file
                logger.warning("Failed to convert to Google Docs format: %s", e)
                drive_file_id = gfile['id']
            
            # Insert permission to allow anyone to view the document
            permission = {
                'type': 'anyone',
                'role': 'writer'
            }
            gfile.InsertPermission(permission)
            
            # Clean up the temporary file
            if file_path:
                try:
                    os.remove(file_path)
                except Exception as e:
                    logger.warning("Could not remove temporary file: %s", e)
            
            # Retry fetching metadata up to max_attempts
            file_url = None
            for attempt in range(max_attempts):
                try:
                    time.sleep(2)  # Add a delay before fetching metadata
                    gfile.FetchMetadata(fields='id, webViewLink, webContentLink, alternateLink, embedLink')
                    
                    # Try multiple fields that might contain the URL
                    file_url = (gfile.get('webViewLink') or 
                               gfile.get('alternateLink') or 
                               gfile.get('embedLink'))
                    
                    logger.info("Attempt %s: Fetched file metadata: %s", attempt + 1, {
                        'id': gfile.get('id'),
                        'webViewLink': gfile.get('webViewLink'),
                        'webContentLink': gfile.get('webContentLink'),
                        'alternateLink': gfile.get('alternateLink'),
                        'embedLink': gfile.get('embedLink')
                    })
                    
                    if file_url:
                        logger.info("Successfully found URL: %s", file_url)
                        break
                        
                    # If webViewLink not available, manually construct the URL
                    if not file_url and gfile.get('id'):
                        file_url = f"https://docs.google.com/document/d/{gfile.get('id')}/edit"
                        logger.info("Manually constructed URL: %s", file_url)
                        break
                except Exception as e:
                    logger.error("Error fetching metadata: %s", e)
                    
                # If last attempt, try a different approach
                if attempt == max_attempts - 1 and not file_url and gfile.get('id'):
                    try:
                        # Try direct API call to get sharing link
                        url = f"https://www.googleapis.com/drive/v3/files/{gfile.get('id')}?fields=webViewLink"
                        headers = {'Authorization': f'Bearer {credentials.access_token}'}
                        response = requests.get(url, headers=headers)
                        response.raise_for_status()
                        data = response.json()
                        file_url = data.get('webViewLink')
                        logger.info("Retrieved URL via direct API: %s", file_url)
                    except Exception as e:
                        logger.error("Failed to retrieve URL via direct API: %s", e)
                        # Last resort - construct URL manually
                        file_url = f"https://docs.google.com/document/d/{gfile.get('id')}/edit"
                        logger.info("Last resort manual URL: %s", file_url)

            if not file_url and gfile.get('id'):
                # If we still don't have a URL but have an ID, construct it
                file_url = f"https://docs.google.com/document/d/{gfile.get('id')}/edit"
                logger.warning("No URL from Google Drive API. Using constructed URL: %s", file_url)

            if not file_url:
                logger.error("No file URL could be generated from Google Drive.")
                return Response({"error": "File URL not generated by Google Drive."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Save metadata to database
            document = Document.objects.create(
                title=title,
                file_url=file_url,
                google_drive_file_id=drive_file_id,
                owner=request.user,
                team=team,
                review_date=review_date if review_date else None
            )
            
            serializer = DocumentSerializer(document)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error("Error in GoogleDriveUploadView: %s", e, exc_info=True)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GenerateSOPView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        prompt = request.data.get('prompt')
        if not prompt:
            return Response({'error': 'Prompt is required.'}, status=400)

        try:
            client = OpenAI(api_key=settings.OPENAI_API_KEY)

            completion = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "developer", "content": "You are an assistant that helps users write effective and clear Standard Operating Procedures (SOPs)."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )

            sop_text = completion.choices[0].message.content
            return Response({"sop": sop_text})

        except Exception as e:
            return Response({"error": f"OpenAI error: {str(e)}"}, status=500)


class SummariseSOPView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        content = request.data.get('content', '')
        if not content:
            return Response({'error': 'No content provided'}, status=400)

        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "Summarise the following SOP as clearly and concisely as possible."},
                {"role": "user", "content": content}
            ],
            max_tokens=300
        )
        summary = response.choices[0].message.content
        return Response({'summary': summary})


class ImproveSOPView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        content = request.data.get('content', '')
        if not content:
            return Response({'error': 'No content provided.'}, status=400)

        try:
            client = OpenAI(api_key=settings.OPENAI_API_KEY)

            completion = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that improves Standard Operating Procedures (SOPs) for clarity, formality, and tone."},
                    {"role": "user", "content": f"Please improve this SOP:\n\n{content}"}
                ],
                temperature=0.7,
                max_tokens=1500
            )

            improved = completion.choices[0].message.content
            return Response({"improved": improved})

        except Exception as e:
            return Response({"error": str(e)}, status=500)



class DocumentViewSet(viewsets.ReadOnlyModelViewSet):
    
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        return Document.objects.filter(
            Q(team__in=user.teams.all()) | 
            Q(owner=user, team__isnull=True))
    
    @action(detail=False, methods=['get'], url_path='team/(?P<team_id>\d+)')
    def team_documents(self, request, team_id=None):
        """Get all documents for a specific team"""
        team = get_object_or_404(Team, id=team_id)
        documents = Document.objects.filter(team=team)
        serializer = DocumentSerializer(documents, many=True)
        return Response(serializer.data)
    
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
        gfile.FetchMetadata(fields='id, title, mimeType, modifiedDate, exportLinks')

        # Update document metadata in your DB
        document.title = gfile['title']

        # Update `updated_at` using modifiedDate from Google (parse it into Django datetime format)
        if 'modifiedDate' in gfile:
            document.updated_at = parse_datetime(gfile['modifiedDate'])

        document.save(update_fields=['title', 'updated_at'])

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

class DocumentDeleteView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, document_id):
        try:
            # Get the document
            document = get_object_or_404(Document, id=document_id)
            
            # Check if user has permission to delete
            if request.user != document.owner:
                # Check if user is team owner
                if document.team:
                    team_member = TeamMember.objects.filter(
                        team=document.team,
                        user=request.user,
                        role='owner'
                    ).first()
                    
                    if not team_member:
                        return Response(
                            {"error": "You don't have permission to delete this document."},
                            status=status.HTTP_403_FORBIDDEN
                        )
                else:
                    # Not a team document and user is not the owner
                    return Response(
                        {"error": "You don't have permission to delete this document."},
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            # Get Google Drive credentials
            creds_json = request.session.get('google_drive_credentials')
            if not creds_json:
                return Response(
                    {"error": "Not authenticated with Google Drive."},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            try:
                credentials = OAuth2Credentials.from_json(creds_json)
            except Exception as e:
                logger.error("Failed to load Google Drive credentials: %s", e)
                return Response(
                    {"error": "Invalid Google Drive credentials."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Delete from Google Drive if file ID exists
            if document.google_drive_file_id:
                try:
                    # Initialize PyDrive
                    gauth = GoogleAuth()
                    gauth.credentials = credentials
                    drive = GoogleDrive(gauth)
                    
                    # Get the file
                    gfile = drive.CreateFile({'id': document.google_drive_file_id})
                    
                    # Delete the file
                    gfile.Delete()
                except Exception as e:
                    logger.error("Error deleting file from Google Drive: %s", e)
                    # Continue with database deletion even if Drive deletion fails
            
            # Delete from database
            document.delete()
            
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except Exception as e:
            logger.error("Error in DocumentDeleteView: %s", e)
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
