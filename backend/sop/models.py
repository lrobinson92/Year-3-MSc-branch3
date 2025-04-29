from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.conf import settings
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

class UserAccountManager(BaseUserManager):
    def create_user(self, email, name, password=None):
        if not email:
            raise ValueError('Users must have an email address')
        
        email = self.normalize_email(email) # normalises email so all lower case
        user = self.model(email=email, name=name)

        user.set_password(password) # built in function will hash password
        user.save(using=self._db)

        return user
    
    def create_superuser(self, email, name, password=None):
        user = self.create_user(email, name, password)
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)

        return user
        

class UserAccount(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(max_length=255, unique=True)
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserAccountManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    def get_full_name(self):
        return self.name
    
    def get_short_name(self):
        return self.name
    
    def __str__(self):
        return self.email
    
    

class Team(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(UserAccount, 
        on_delete=models.CASCADE, 
        related_name="created_teams"
    )
    members = models.ManyToManyField(
        UserAccount,  
        through='TeamMembership', 
        related_name='teams'  
    )

    def __str__(self):
        return self.name

class TeamMembership(models.Model):
    ROLE_CHOICES = [
        ('owner', 'Owner'),
        ('member', 'Member'),
        ('admin', 'Admin'),
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
        unique_together = ('user', 'team')  # Ensures no duplicate memberships

    def __str__(self):
        return f"{self.user.name} - {self.role} in {self.team.name}"

class Task(models.Model):
    """Task model with status choices and required fields"""
    
    class Status(models.TextChoices):
        NOT_STARTED = 'not_started', _('Not Started')
        IN_PROGRESS = 'in_progress', _('In Progress')
        COMPLETE = 'complete', _('Complete')
    
    description = models.TextField()
    assigned_to = models.ForeignKey(
        'UserAccount',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tasks'
    )
    team = models.ForeignKey(
        'Team',
        on_delete=models.CASCADE,
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
        return self.description
    
    
class Document(models.Model):
    title = models.CharField(max_length=255)
    file_url = models.URLField()
    google_drive_file_id = models.CharField(max_length=255, blank=True, null=True)
    owner = models.ForeignKey(UserAccount, on_delete=models.CASCADE)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)
    review_date = models.DateField(null=True, blank=True)  
    review_reminder_sent = models.BooleanField(default=False)  # Track if reminder has been sent

    def __str__(self):
        return self.title


