from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.conf import settings
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

class UserAccountManager(BaseUserManager):
    """
    Custom user account manager for handling user creation
    
    Extends Django's BaseUserManager to customize user creation,
    using email as the unique identifier instead of username.
    """
    def create_user(self, email, name, password=None):
        """
        Create and save a standard user with email authentication
        """
        if not email:
            raise ValueError('Users must have an email address')
        
        # Normalize email to lowercase
        email = self.normalize_email(email)
        user = self.model(email=email, name=name)
        
        # Hash password securely
        user.set_password(password)
        user.save(using=self._db)
        
        return user
    
    def create_superuser(self, email, name, password=None):
        """
        Create and save a superuser with staff and admin privileges
        """
        user = self.create_user(email, name, password)
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        
        return user
        

class UserAccount(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model using email as the username field
    
    Provides authentication and permission management for the application.
    Used as the base user model throughout the application.
    """
    email = models.EmailField(max_length=255, unique=True)
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    
    objects = UserAccountManager()
    
    USERNAME_FIELD = 'email'  # Field used for authentication
    REQUIRED_FIELDS = ['name']  # Required when creating user via CLI
    
    def get_full_name(self):
        """Return user's full name"""
        return self.name
    
    def get_short_name(self):
        """Return user's name for display purposes"""
        return self.name
    
    def __str__(self):
        """String representation of user"""
        return self.email
    

class Team(models.Model):
    """
    Team model for grouping users and managing shared resources
    
    Teams can have multiple users with different roles (owner, admin, member)
    and provide access control for documents and tasks.
    """
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(
        UserAccount, 
        on_delete=models.CASCADE, 
        related_name="created_teams"
    )
    members = models.ManyToManyField(
        UserAccount,  
        through='TeamMembership',  # Join table with role information
        related_name='teams'  
    )
    
    def __str__(self):
        """String representation of team"""
        return self.name


class TeamMembership(models.Model):
    """
    Join table for team membership with role information
    
    Establishes the relationship between users and teams,
    including permission roles (owner, admin, member).
    """
    ROLE_CHOICES = [
        ('owner', 'Owner'),    # Full control + can delete team
        ('member', 'Member'),  # Basic access
        ('admin', 'Admin'),    # Management access
    ]
    
    user = models.ForeignKey(
        UserAccount,
        on_delete=models.CASCADE, 
        related_name="team_memberships"
    )
    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE, 
        related_name="team_memberships"
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='member'
    )
    
    class Meta:
        unique_together = ('user', 'team')  # Prevents duplicate memberships
    
    def __str__(self):
        """String representation of membership"""
        return f"{self.user.name} - {self.role} in {self.team.name}"


class Task(models.Model):
    """
    Task model for tracking work items
    
    Tasks can be assigned to users and optionally associated with teams.
    Includes status tracking and due dates.
    """
    
    class Status(models.TextChoices):
        """Status choices for task progression tracking"""
        NOT_STARTED = 'not_started', _('Not Started')
        IN_PROGRESS = 'in_progress', _('In Progress')
        COMPLETE = 'complete', _('Complete')
    
    description = models.TextField()
    assigned_to = models.ForeignKey(
        'UserAccount',
        on_delete=models.SET_NULL,  # Keep task if user is deleted
        null=True,
        blank=True,
        related_name='assigned_tasks'
    )
    team = models.ForeignKey(
        'Team',
        on_delete=models.CASCADE,  # Remove tasks if team is deleted
        null=True,
        blank=True,
        related_name='team_tasks'
    )
    due_date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.NOT_STARTED
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        """String representation of task"""
        return self.description
    
    
class Document(models.Model):
    """
    Document model for storing SOP documents
    
    Stores metadata for Google Drive documents including review dates
    and team associations for access control.
    """
    title = models.CharField(max_length=255)
    file_url = models.URLField()  # URL to access the document
    google_drive_file_id = models.CharField(max_length=255, blank=True, null=True)
    owner = models.ForeignKey(UserAccount, on_delete=models.CASCADE)
    team = models.ForeignKey(
        Team, 
        on_delete=models.CASCADE,  # Delete documents if team is deleted
        null=True,  # Allows personal documents not associated with teams
        blank=True
    )
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)
    review_date = models.DateField(null=True, blank=True)  # Optional date for review reminder
    review_reminder_sent = models.BooleanField(default=False)  # Tracks if review reminder was sent
    
    def __str__(self):
        """String representation of document"""
        return self.title


