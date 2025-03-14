from rest_framework.permissions import BasePermission, SAFE_METHODS
from .models import TeamMembership

class IsOwnerOrAssignedUser(BasePermission):
    def has_object_permission(self, request, view, obj):
        # Allow read-only access for all team members
        if request.method in SAFE_METHODS:
            return TeamMembership.objects.filter(user=request.user, team=obj.team).exists()
        
        # Check if the user is the assigned user of the task
        if obj.assigned_to == request.user:
            return True
        
        # Check if the user is the owner of the document
        if obj.owner == request.user:
            return True
        
        # Check if the user is an owner of the team
        if obj.team:
            membership = TeamMembership.objects.filter(user=request.user, team=obj.team, role='owner').exists()
            if membership:
                return True
        
        return False