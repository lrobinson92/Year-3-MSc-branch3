import logging
import datetime
from djoser.serializers import UserCreateSerializer as DjoserUserCreateSerializer
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from sop.models import Team, TeamMembership, Task, Document

# Get the user model from settings
User = get_user_model()

class UserCreateSerializer(DjoserUserCreateSerializer):
    """
    User registration and data serializer
    
    Extends Djoser's UserCreateSerializer to customize user registration
    and add team relationship data to user responses.
    """
    email = serializers.EmailField(
        required=True,
        validators=[
            UniqueValidator(queryset=User.objects.all(), message="This email is already in use.")
        ]
    )

    # Add teams field for retrieving user's team memberships
    teams = serializers.SerializerMethodField()

    class Meta(DjoserUserCreateSerializer.Meta):
        model = User
        fields = ('id', 'email', 'name', 'password', 'teams')

    def get_teams(self, obj):
        """
        Return list of team IDs the user belongs to
        """
        return list(obj.teams.values_list('id', flat=True))


class TeamMembershipSerializer(serializers.ModelSerializer):
    """
    Team membership serializer
    
    Handles the relationship between users and teams including user roles.
    Adds derived fields for user and team names for easier display.
    """
    # Add readable name fields from related objects
    user_name = serializers.ReadOnlyField(source='user.name')
    team_name = serializers.ReadOnlyField(source='team.name')

    class Meta:
        model = TeamMembership
        fields = ['id', 'user', 'team', 'role', 'user_name', 'team_name']


class TeamSerializer(serializers.ModelSerializer):
    """
    Team serializer with nested membership information
    
    Includes detailed information about team members through
    the nested TeamMembershipSerializer.
    """
    # Include nested serializer for team members with roles
    members = TeamMembershipSerializer(source='team_memberships', many=True, read_only=True)
    
    class Meta:
        model = Team
        fields = ['id', 'name', 'description', 'created_by', 'members']
        read_only_fields = ['created_by', 'members']


class TaskSerializer(serializers.ModelSerializer):
    """
    Task serializer with additional fields and validation
    
    Provides detailed task information including assignee and team names.
    Includes validation for task assignments, due dates and status values.
    """
    # Add read-only fields for displaying names instead of just IDs
    assigned_to_name = serializers.SerializerMethodField()
    team_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'description', 'assigned_to', 'assigned_to_name',
            'team', 'team_name', 'due_date', 'status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'assigned_to_name', 'team_name']
    
    def get_assigned_to_name(self, obj):
        """
        Return the name of the assigned user or 'Unassigned'
        """
        if obj.assigned_to:
            return obj.assigned_to.name
        return "Unassigned"
    
    def get_team_name(self, obj):
        """
        Return the team name if task belongs to a team
        """
        if obj.team:
            return obj.team.name
        return None
    
    def validate(self, data):
        """
        Additional validation for task data
        """
        # Ensure due date is provided
        if 'due_date' not in data:
            raise serializers.ValidationError({"due_date": "Due date is required"})
        
        # Ensure valid status
        status = data.get('status')
        valid_statuses = [choice[0] for choice in Task.Status.choices]
        if status and status not in valid_statuses:
            raise serializers.ValidationError({"status": f"Status must be one of: {', '.join(valid_statuses)}"})
        
        # Check team membership for assignment
        team = data.get('team')
        assigned_to = data.get('assigned_to')
        
        if team and assigned_to:
            # Ensure user is a member of the team they're being assigned a task for
            team_member_exists = team.members.filter(id=assigned_to.id).exists()
            if not team_member_exists:
                raise serializers.ValidationError(
                    {"assigned_to": "This user is not a member of the specified team"}
                )
        
        return data
    

class DocumentSerializer(serializers.ModelSerializer):
    """
    Document serializer for SOP documents
    
    Handles document metadata including Google Drive integration.
    Adds calculated field for days until review date to support
    review notifications and badges.
    """
    # Add derived fields for frontend display
    team_name = serializers.ReadOnlyField(source='team.name')
    owner_name = serializers.ReadOnlyField(source='owner.name')
    days_until_review = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            'id', 
            'title', 
            'file_url',
            'google_drive_file_id',
            'owner', 
            'owner_name', 
            'team', 
            'team_name', 
            'created_at', 
            'updated_at',
            'review_date',
            'days_until_review',
        ]

    def get_team_name(self, obj):
        """
        Return team name or "Personal" for documents not in a team
        """
        return obj.team.name if obj.team else "Personal"
    
    def get_days_until_review(self, obj):
        """
        Calculate days until document review is due
        
        Used for review notifications and UI indicators on documents
        that need review soon.
        """
        if not obj.review_date:
            return None
        
        today = timezone.now().date()
        
        # Convert review_date to a date object if it's a string
        if isinstance(obj.review_date, str):
            try:
                review_date = datetime.datetime.strptime(obj.review_date, '%Y-%m-%d').date()
            except ValueError:
                return None
        else:
            review_date = obj.review_date
            
        delta = review_date - today
        return delta.days