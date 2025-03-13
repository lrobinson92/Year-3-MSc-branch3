from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.conf import settings
from django.utils import timezone

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
        UserAccount,  # Reference your custom user model
        through='TeamMembership',  # Specify the through model
        related_name='teams'  # Allows reverse lookup like user.teams.all()
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
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('complete', 'Complete'),
    ]

    description = models.TextField(blank=True)
    assigned_to = models.ForeignKey(
        UserAccount, 
        on_delete=models.SET_NULL, 
        related_name='tasks',
        null=True,
        blank=True
    )
    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name='tasks',
        null=True,
        blank=True
    )
    due_date = models.DateField()
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='not_started'
    )

    def __str__(self):
        return self.description
    
    
class Document(models.Model):
    title = models.CharField(max_length=255)
    file_url = models.URLField()
    owner = models.ForeignKey(UserAccount, on_delete=models.CASCADE)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title