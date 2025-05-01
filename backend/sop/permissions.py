from rest_framework.permissions import BasePermission, SAFE_METHODS
from rest_framework import permissions
from .models import TeamMembership

class IsOwnerOrAssignedUser(BasePermission):
    def has_object_permission(self, request, view, obj):
        # Allow read-only access for all team members
        if request.method in SAFE_METHODS:
            return TeamMembership.objects.filter(user=request.user, team=obj.team).exists()
        
        # Check if the user is the assigned user of the task
        if obj.assigned_to == request.user:
            return True
        
        # Check if the user is an owner of the team
        if obj.team:
            membership = TeamMembership.objects.filter(user=request.user, team=obj.team, role='owner').exists()
            if membership:
                return True
        
        return False

class IsTeamOwner(BasePermission):
    """
    Custom permission to only allow team owners to perform certain actions.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any team member
        if request.method in SAFE_METHODS:
            return TeamMembership.objects.filter(user=request.user, team=obj).exists()
        
        # Write permissions are only allowed to the team owner
        return TeamMembership.objects.filter(
            user=request.user, 
            team=obj, 
            role='owner'
        ).exists()

class IsTeamMemberOrTaskOwner(permissions.BasePermission):
    """
    Allows:
    - Full access if assigned to a personal task (no team)
    - Read access if part of the task's team
    - Write access only if user is the owner of the task's specific team
    """
    def has_object_permission(self, request, view, obj):
        user = request.user

        # Personal task, assigned to this user
        if obj.assigned_to == user and obj.team is None:
            return True

        # Team task
        if obj.team:
            try:
                membership = TeamMembership.objects.get(user=user, team=obj.team)
            except TeamMembership.DoesNotExist:
                return False

            if request.method in permissions.SAFE_METHODS:
                return True

            # ✅ Only allow write access if they are the owner of the task's team
            return membership.role == 'owner'

        return False
