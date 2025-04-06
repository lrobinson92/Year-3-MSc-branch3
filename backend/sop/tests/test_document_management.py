from django.conf import settings
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from unittest.mock import patch, MagicMock
import datetime
import json

from sop.models import Document, Team, TeamMembership, UserAccount

class DocumentManagementTest(TestCase):
    """Tests for document management with mocked Google Drive services"""

    def setUp(self):
        self.owner = UserAccount.objects.create_user(email='owner@example.com', password='testpassword', name='Team Owner')
        self.member = UserAccount.objects.create_user(email='member@example.com', password='testpassword', name='Team Member')
        self.admin = UserAccount.objects.create_user(email='admin@example.com', password='testpassword', name='Team Admin')
        self.non_member = UserAccount.objects.create_user(email='nonmember@example.com', password='testpassword', name='Non Member')

        self.team = Team.objects.create(name='Test Team', description='A test team', created_by=self.owner)
        TeamMembership.objects.create(user=self.owner, team=self.team, role='owner')
        TeamMembership.objects.create(user=self.member, team=self.team, role='member')
        TeamMembership.objects.create(user=self.admin, team=self.team, role='admin')

        self.owner_doc = Document.objects.create(title='Owner Document', file_url='https://docs.google.com/document/d/123456', google_drive_file_id='123456', owner=self.owner, team=None, review_date=timezone.now().date() + datetime.timedelta(days=30))

        self.team_doc = Document.objects.create(title='Team Document', file_url='https://docs.google.com/document/d/789012', google_drive_file_id='789012', owner=self.owner, team=self.team, review_date=timezone.now().date() - datetime.timedelta(days=5))

        self.client = APIClient()


    @patch('sop.views.GoogleDrive')
    @patch('sop.views.GoogleAuth')
    def test_list_documents(self, mock_google_auth, mock_google_drive):
        self.client.force_authenticate(user=self.owner)
        url = reverse('document-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    @patch('sop.views.GoogleDrive')
    @patch('sop.views.GoogleAuth')
    def test_team_member_can_view_team_documents(self, mock_google_auth, mock_google_drive):
        self.client.force_authenticate(user=self.member)
        url = reverse('document-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.team_doc.id)

    @patch('sop.views.GoogleDrive')
    @patch('sop.views.GoogleAuth')
    def test_admin_can_view_team_documents(self, mock_google_auth, mock_google_drive):
        self.client.force_authenticate(user=self.admin)
        url = reverse('document-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    @patch('sop.views.GoogleDrive')
    @patch('sop.views.GoogleAuth')
    def test_non_member_cannot_view_team_documents(self, mock_google_auth, mock_google_drive):
        self.client.force_authenticate(user=self.non_member)
        url = reverse('document-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    @patch('sop.views.requests.post')
    @patch('sop.views.GoogleDrive')
    @patch('sop.views.GoogleAuth')
    def test_create_document(self, mock_google_auth, mock_drive_instance, mock_requests_post):
        # Set up the Google Drive mock
        drive_instance = MagicMock()
        mock_drive_instance.return_value = drive_instance
        mock_file = MagicMock()
        # Ensure index access returns a plain string if needed
        mock_file.__getitem__.return_value = "new_file_id"
        # Configure the .get() method to return a plain URL for webViewLink
        def fake_get(key):
            if key == 'webViewLink':
                return "https://docs.google.com/document/d/converted_file_id/edit"
            return None
        mock_file.get.side_effect = fake_get
        drive_instance.CreateFile.return_value = mock_file

        # Simulate a successful conversion via requests.post
        mock_response = MagicMock()
        mock_response.json.return_value = {"id": "converted_file_id"}
        mock_response.raise_for_status.return_value = None
        mock_requests_post.return_value = mock_response

        self.client.force_authenticate(user=self.owner)

        # Set and save the session data with proper credentials
        session = self.client.session
        session['google_drive_credentials'] = json.dumps({
            'access_token': 'test-token',
            'client_id': 'dummy-client',
            'client_secret': 'dummy-secret',
            'refresh_token': 'dummy-refresh',
            'token_expiry': '9999-12-31T23:59:59Z',
            'token_uri': 'https://oauth2.googleapis.com/token',
            'user_agent': None,
            'revoke_uri': 'https://oauth2.googleapis.com/revoke',
            'invalid': False  # Include required field
        })
        session.save()
        self.client.cookies[settings.SESSION_COOKIE_NAME] = session.session_key

        document_data = {
            'title': 'New Test Document',
            'team_id': self.team.id,
            'text_content': '<p>This is a test document content</p>',
            'content_type': 'html',
            'review_date': (timezone.now().date() + datetime.timedelta(days=90)).isoformat()
        }

        url = reverse('google_drive_upload')
        response = self.client.post(url, document_data, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Document.objects.filter(title='New Test Document').exists())
        self.assertEqual(drive_instance.CreateFile.call_count, 2)
        mock_file.Upload.assert_called_once()


    @patch('sop.views.GoogleDrive')
    @patch('sop.views.GoogleAuth')
    def test_delete_document(self, mock_google_auth, mock_google_drive):
        mock_drive_instance = MagicMock()
        mock_google_drive.return_value = mock_drive_instance
        mock_file = MagicMock()
        mock_drive_instance.CreateFile.return_value = mock_file

        self.client.force_authenticate(user=self.owner)
        doc_count_before = Document.objects.count()
        url = reverse('document-delete', args=[self.team_doc.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Document.objects.count(), doc_count_before - 1)
        self.assertFalse(Document.objects.filter(id=self.team_doc.id).exists())
        mock_file.Delete.assert_called_once()

    @patch('sop.views.GoogleDrive')
    @patch('sop.views.GoogleAuth')
    def test_member_cannot_delete_team_document(self, mock_google_auth, mock_google_drive):
        self.client.force_authenticate(user=self.member)
        url = reverse('document-delete', args=[self.team_doc.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Document.objects.filter(id=self.team_doc.id).exists())

    @patch('sop.views.GoogleDrive')
    @patch('sop.views.GoogleAuth')
    def test_admin_cannot_delete_team_document(self, mock_google_auth, mock_google_drive):
        self.client.force_authenticate(user=self.admin)
        url = reverse('document-delete', args=[self.team_doc.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Document.objects.filter(id=self.team_doc.id).exists())

    @patch('sop.views.OpenAI')
    @patch('sop.views.GoogleDrive')
    @patch('sop.views.GoogleAuth')
    def test_generate_sop(self, mock_google_auth, mock_google_drive, mock_openai):
        # Create a dummy OpenAI instance with a chat.completions.create method
        dummy_response = MagicMock()
        dummy_response.choices = [
            MagicMock(message=MagicMock(content='<h1>Generated SOP</h1><p>This is AI-generated content.</p>'))
        ]
        dummy_openai_instance = MagicMock()
        dummy_openai_instance.chat.completions.create.return_value = dummy_response
        mock_openai.return_value = dummy_openai_instance
        
        # Set up Google Drive mock for document creation
        mock_drive_instance = MagicMock()
        mock_google_drive.return_value = mock_drive_instance
        mock_file = MagicMock()
        mock_file.__getitem__.return_value = "new_file_id"
        mock_file.get.return_value = "https://docs.google.com/document/d/new_file_id/edit"
        mock_drive_instance.CreateFile.return_value = mock_file
        
        # Authenticate and set Google Drive credentials in session
        self.client.force_authenticate(user=self.owner)
        session = self.client.session
        session['google_drive_credentials'] = json.dumps({
            'access_token': 'test-token',
            'client_id': 'dummy-client',
            'client_secret': 'dummy-secret',
            'refresh_token': 'dummy-refresh',
            'token_expiry': '9999-12-31T23:59:59Z',
            'token_uri': 'https://oauth2.googleapis.com/token',
            'user_agent': None,
            'revoke_uri': 'https://oauth2.googleapis.com/revoke',
            'invalid': False
        })
        session.save()
        self.client.cookies[settings.SESSION_COOKIE_NAME] = session.session_key
        
        # Test data
        generate_data = {
            'prompt': 'Create an SOP for handling customer complaints',
            'title': 'Customer Complaints Handling SOP',
            'team_id': str(self.team.id)
        }
        url = reverse('generate_sop')
        response = self.client.post(url, generate_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        dummy_openai_instance.chat.completions.create.assert_called_once()
        # The view returns the SOP under the key 'sop'
        self.assertIn('<h1>Generated SOP</h1>', response.data.get('sop', ''))


    @patch('sop.views.OpenAI')
    @patch('sop.views.GoogleDrive')
    @patch('sop.views.GoogleAuth')
    def test_summarise_sop(self, mock_google_auth, mock_google_drive, mock_openai):
        # Create a dummy OpenAI instance
        dummy_response = MagicMock()
        dummy_response.choices = [
            MagicMock(message=MagicMock(content='This is a summarized version of the document.'))
        ]
        dummy_openai_instance = MagicMock()
        dummy_openai_instance.chat.completions.create.return_value = dummy_response
        mock_openai.return_value = dummy_openai_instance
        
        # Mock Google Drive file content retrieval
        mock_drive_instance = MagicMock()
        mock_google_drive.return_value = mock_drive_instance
        mock_file = MagicMock()
        mock_file.GetContentString.return_value = '<p>Original document content that is much longer and needs summarizing.</p>'
        mock_drive_instance.CreateFile.return_value = mock_file
        
        # Authenticate and set Google Drive credentials
        self.client.force_authenticate(user=self.owner)
        session = self.client.session
        session['google_drive_credentials'] = json.dumps({
            'access_token': 'test-token',
            'client_id': 'dummy-client',
            'client_secret': 'dummy-secret',
            'refresh_token': 'dummy-refresh',
            'token_expiry': '9999-12-31T23:59:59Z',
            'token_uri': 'https://oauth2.googleapis.com/token',
            'user_agent': None,
            'revoke_uri': 'https://oauth2.googleapis.com/revoke',
            'invalid': False
        })
        session.save()
        self.client.cookies[settings.SESSION_COOKIE_NAME] = session.session_key
        
        # Fix: Convert ID to string to ensure proper handling
        # Send proper payload with 'content'
        url = reverse('summarise_sop')
        response = self.client.post(url, {'content': 'Original document content that needs summarizing.'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        dummy_openai_instance.chat.completions.create.assert_called_once()
        self.assertEqual(response.data['summary'], 'This is a summarized version of the document.')


    @patch('sop.views.OpenAI')
    @patch('sop.views.GoogleDrive')
    @patch('sop.views.GoogleAuth')
    def test_improve_sop(self, mock_google_auth, mock_google_drive, mock_openai):
        # Create a dummy OpenAI instance
        dummy_response = MagicMock()
        dummy_response.choices = [
            MagicMock(message=MagicMock(content='<h1>Improved Document</h1><p>This is the improved version with better formatting and clarity.</p>'))
        ]
        dummy_openai_instance = MagicMock()
        dummy_openai_instance.chat.completions.create.return_value = dummy_response
        mock_openai.return_value = dummy_openai_instance

        
        # Mock Google Drive file content retrieval
        mock_drive_instance = MagicMock()
        mock_google_drive.return_value = mock_drive_instance
        mock_file = MagicMock()
        mock_file.GetContentString.return_value = '<p>Original document content that needs improvement.</p>'
        # Setup for the file that will be created for the improved version
        mock_file.__getitem__.return_value = "improved_file_id"
        mock_file.get.return_value = "https://docs.google.com/document/d/improved_file_id/edit"
        mock_drive_instance.CreateFile.return_value = mock_file
        
        # Authenticate and set Google Drive credentials
        self.client.force_authenticate(user=self.owner)
        session = self.client.session
        session['google_drive_credentials'] = json.dumps({
            'access_token': 'test-token',
            'client_id': 'dummy-client',
            'client_secret': 'dummy-secret',
            'refresh_token': 'dummy-refresh',
            'token_expiry': '9999-12-31T23:59:59Z',
            'token_uri': 'https://oauth2.googleapis.com/token',
            'user_agent': None,
            'revoke_uri': 'https://oauth2.googleapis.com/revoke',
            'invalid': False
        })
        session.save()
        self.client.cookies[settings.SESSION_COOKIE_NAME] = session.session_key
        
        # Fix: Send the correct payload format
        url = reverse('improve_sop')
        response = self.client.post(url, {'content': 'Original document content that needs improvement.'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        dummy_openai_instance.chat.completions.create.assert_called_once()
        self.assertIn('<h1>Improved Document</h1>', response.data.get('improved', ''))
