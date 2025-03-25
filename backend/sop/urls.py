from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TeamViewSet, UsersInSameTeamView, TaskViewSet, GoogleDriveLoginView, GoogleDriveCallbackView, ListDriveFilesView, GoogleDriveUploadView, DocumentViewSet, GoogleDriveFileContentView, GenerateSOPView, SummariseSOPView, ImproveSOPView

router = DefaultRouter()
router.register(r'teams', TeamViewSet, basename='team')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'documents', DocumentViewSet, basename='document')

urlpatterns = [
    path('', include(router.urls)),
    path('teams/<int:team_id>/users-in-same-team/', UsersInSameTeamView.as_view(), name='users-in-same-team'),
    path('google-drive/login/', GoogleDriveLoginView.as_view(), name='google_drive_login'),
    path('google-drive/callback/', GoogleDriveCallbackView.as_view(), name='google_drive_callback'),
    path('google-drive/files/', ListDriveFilesView.as_view(), name='list_drive_files'),
    path('google-drive/upload/', GoogleDriveUploadView.as_view(), name='google_drive_upload'),
    path('google-drive/file-content/<int:document_id>/', GoogleDriveFileContentView.as_view(), name='google_drive_file_content'),
    path('generate-sop/', GenerateSOPView.as_view(), name='generate_sop'),
    path('summarise-sop/', SummariseSOPView.as_view(), name='summarise_sop'),
    path('improve-sop/', ImproveSOPView.as_view(), name='improve_sop'),
]