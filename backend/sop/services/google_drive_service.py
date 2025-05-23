# Disclaimer: Portions of this code were generated by ChatGPT and were reviewed and modified to fit the requirements of the project.
import json
import logging
import os
import tempfile
import time
import requests
from django.conf import settings
from pydrive2.auth import GoogleAuth
from pydrive2.drive import GoogleDrive
from oauth2client.client import OAuth2Credentials

logger = logging.getLogger(__name__)

# the following was modified from Google Drive documentation:
class GoogleDriveService:
    def __init__(self, credentials_json):
        self.gauth = GoogleAuth()
        self.gauth.DEFAULT_SETTINGS['client_config_file'] = settings.GOOGLE_CLIENT_SECRETS_FILE
        
        try:
            credentials = OAuth2Credentials.from_json(credentials_json)
            self.gauth.credentials = credentials
            self.drive = GoogleDrive(self.gauth)
        except Exception as e:
            logger.error("Failed to initialize Google Drive service: %s", e, exc_info=True)
            raise ValueError("Invalid Google Drive credentials.")

    def upload_document(self, title, text_content=None, file_obj=None, content_type='text/plain'):
        """Upload a document to Google Drive and return its metadata"""
        # Create file in Google Drive
        gfile = self.drive.CreateFile({'title': title})
        
        # Create a temporary file
        temp_file = None
        file_path = None
        mime_type = content_type
        
        try:
            if text_content:
                file_path, mime_type = self._create_temp_file_from_text(text_content, content_type, title)
            elif file_obj:
                file_path, mime_type = self._create_temp_file_from_upload(file_obj)
                
            # Set content file and MIME type
            gfile.SetContentFile(file_path)
            gfile['mimeType'] = mime_type
            
            # Upload and convert the file
            self._upload_file(gfile)
            
            # Convert to Google Docs and set permissions
            drive_file_id = self._convert_to_google_docs(gfile)
            self._set_permissions(drive_file_id or gfile['id'])
            
            # Get file URL
            file_url = self._get_file_url(drive_file_id or gfile['id'])
            
            return {
                'file_id': drive_file_id or gfile['id'],
                'file_url': file_url
            }
        finally:
            # Clean up temporary file
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception as e:
                    logger.warning("Could not remove temporary file: %s", e)
    
    # The following function was generated by ChatGPT and modified to fit the requirements of the project.
    def _create_temp_file_from_text(self, text_content, content_type, title):
        """Create a temporary file from text content"""
        if content_type == 'html':
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
            
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.html')
            temp_file.write(html_content.encode('utf-8'))
            temp_file.flush()
            return temp_file.name, 'text/html'
        else:
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.txt')
            temp_file.write(text_content.encode('utf-8'))
            temp_file.flush()
            return temp_file.name, 'text/plain'
    
    # The following function was generated by ChatGPT and modified to fit the requirements of the project.
    def _create_temp_file_from_upload(self, file_obj):
        """Create a temporary file from an uploaded file"""
        suffix = '.' + file_obj.name.split('.')[-1].lower()
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        for chunk in file_obj.chunks():
            temp_file.write(chunk)
        temp_file.flush()
        
        # Determine MIME type based on file extension
        mime_type = self._get_mime_type(suffix)
        return temp_file.name, mime_type
    
    # The following function was generated by ChatGPT and modified to fit the requirements of the project.
    def _get_mime_type(self, suffix):
        """Get MIME type based on file extension"""
        mime_types = {
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.doc': 'application/msword',
            '.pdf': 'application/pdf',
            '.txt': 'text/plain',
            '.html': 'text/html',
            '.htm': 'text/html'
        }
        return mime_types.get(suffix, 'application/octet-stream')
    
    def _upload_file(self, gfile, max_attempts=3):
        """Upload file with retry logic"""
        for attempt in range(max_attempts):
            try:
                gfile.Upload({'convert': True})
                return
            except Exception as upload_error:
                logger.error("Upload attempt %s failed: %s", attempt + 1, upload_error, exc_info=True)
                if attempt == max_attempts - 1:
                    raise
                time.sleep(2)  # wait before retrying
    
    def _convert_to_google_docs(self, gfile):
        """Convert file to Google Docs format"""
        try:
            file_id = gfile['id']
            
            url = f"https://www.googleapis.com/drive/v2/files/{file_id}/copy"
            headers = {
                'Authorization': f'Bearer {self.gauth.credentials.access_token}',
                'Content-Type': 'application/json'
            }
            payload = {
                'title': gfile['title'],
                'mimeType': 'application/vnd.google-apps.document'
            }
            
            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()
            
            result = response.json()
            new_file_id = result.get('id')
            
            if new_file_id:
                # Delete original file
                gfile.Delete()
                return new_file_id
                
            return None
        except Exception as e:
            logger.warning("Failed to convert to Google Docs format: %s", e)
            return None
    
    def _set_permissions(self, file_id):
        """Set file permissions to allow writing"""
        try:
            gfile = self.drive.CreateFile({'id': file_id})
            permission = {
                'type': 'anyone',
                'role': 'writer'
            }
            gfile.InsertPermission(permission)
        except Exception as e:
            logger.error("Failed to set permissions: %s", e)
    
    def _get_file_url(self, file_id, max_attempts=3):
        """Get file URL with retry logic"""
        gfile = self.drive.CreateFile({'id': file_id})
        
        for attempt in range(max_attempts):
            try:
                time.sleep(1)  # Add a delay before fetching metadata
                gfile.FetchMetadata(fields='id, webViewLink, webContentLink, alternateLink, embedLink')
                
                file_url = (gfile.get('webViewLink') or 
                          gfile.get('alternateLink') or 
                          gfile.get('embedLink'))
                
                if file_url:
                    return file_url
                    
                # If webViewLink not available, manually construct the URL
                if gfile.get('id'):
                    return f"https://docs.google.com/document/d/{gfile.get('id')}/edit"
                    
            except Exception as e:
                logger.error("Error fetching metadata attempt %s: %s", attempt + 1, e)
                
                if attempt == max_attempts - 1:
                    # Last resort - construct URL manually
                    return f"https://docs.google.com/document/d/{file_id}/edit"
        
        return f"https://docs.google.com/document/d/{file_id}/edit"