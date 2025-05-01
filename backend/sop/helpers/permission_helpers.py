from rest_framework import status
from rest_framework.response import Response
from ..models import Team, TeamMembership

def validate_team_membership(user, team_id):
    """Validate a user's membership in a team"""
    if not team_id:
        return None, None
    
    try:
        team = Team.objects.get(id=team_id)
        # Verify user is a member of the team
        if not TeamMembership.objects.filter(team=team, user=user).exists():
            return None, Response(
                {"error": "You are not a member of this team"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        return team, None
    except Team.DoesNotExist:
        return None, Response(
            {"error": f"Team with ID {team_id} not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )