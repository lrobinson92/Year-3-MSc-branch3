import logging
import datetime  # Add this import
from djoser.serializers import UserCreateSerializer as DjoserUserCreateSerializer
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from sop.models import Team, TeamMembership, Task, Document

User = get_user_model()

class UserCreateSerializer(DjoserUserCreateSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[
            UniqueValidator(queryset=User.objects.all(), message="This email is already in use.")
        ]
    )

    teams = serializers.SerializerMethodField()

    class Meta(DjoserUserCreateSerializer.Meta):
        model = User
        fields = ('id', 'email', 'name', 'password', 'teams')

    def get_teams(self, obj):
        return list(obj.teams.values_list('id', flat=True))



class TeamMembershipSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.name')
    team_name = serializers.ReadOnlyField(source='team.name')

    class Meta:
        model = TeamMembership
        fields = ['id', 'user', 'team', 'role', 'user_name', 'team_name']



class TeamSerializer(serializers.ModelSerializer):
    members = TeamMembershipSerializer(source='team_memberships', many=True, read_only=True)
    
    class Meta:
        model = Team
        fields = ['id', 'name', 'description', 'created_by', 'members']
        read_only_fields = ['created_by', 'members']


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.SerializerMethodField()
    team_name = serializers.ReadOnlyField(source='team.name')

    class Meta:
        model = Task
        fields = ['id', 'description', 'assigned_to', 'assigned_to_name', 'team', 'team_name', 'due_date', 'status']
        read_only_fields = ['id']

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.name if obj.assigned_to else 'Unassigned'
    

class DocumentSerializer(serializers.ModelSerializer):
    team_name = serializers.ReadOnlyField(source='team.name')
    owner_name = serializers.ReadOnlyField(source='owner.name')
    days_until_review = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            'id', 
            'title', 
            'file_url',
            'google_drive_file_id',  # Include the new field
            'owner', 
            'owner_name', 
            'team', 
            'team_name', 
            'created_at', 
            'updated_at',
            'review_date',  # Add review date
            'days_until_review',  # Add calculated field
        ]

    def get_team_name(self, obj):
        return obj.team.name if obj.team else "Personal"
    
    def get_days_until_review(self, obj):
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