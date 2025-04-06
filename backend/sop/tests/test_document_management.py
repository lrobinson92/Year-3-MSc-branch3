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

