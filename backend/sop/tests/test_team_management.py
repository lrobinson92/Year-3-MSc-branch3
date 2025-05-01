from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from sop.models import UserAccount, Team, TeamMembership, Task
from datetime import date, timedelta

class TeamManagementTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.owner = UserAccount.objects.create_user(email='owner@example.com', password='testpass123', name='Owner')
        self.member = UserAccount.objects.create_user(email='member@example.com', password='testpass123', name='Member')
        self.other_user = UserAccount.objects.create_user(email='other@example.com', password='testpass123', name='Other')

        self.team = Team.objects.create(name='Team A', description='Test team', created_by=self.owner)
        TeamMembership.objects.create(user=self.owner, team=self.team, role='owner')
        TeamMembership.objects.create(user=self.member, team=self.team, role='member')

        self.today = date.today()
        self.tomorrow = self.today + timedelta(days=1)

        self.team_url = reverse('team-list')
        self.detail_url = reverse('team-detail', args=[self.team.id])
        self.users_in_team_url = reverse('team-users-in-same-team', args=[self.team.id])
        self.invite_url = reverse('team-invite-member', args=[self.team.id])
        self.update_role_url = reverse('team-update-member-role', args=[self.team.id])
        self.remove_member_url = reverse('team-remove-member', args=[self.team.id])
        self.task_url = reverse('task-list')

    def test_owner_can_create_team(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(self.team_url, {'name': 'New Team', 'description': 'Desc'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_only_owner_can_delete_team(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.owner)
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_owner_can_invite_member(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(self.invite_url, {'email': self.other_user.email, 'role': 'member'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_member_cannot_invite_member(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.post(self.invite_url, {'email': self.other_user.email, 'role': 'member'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_cannot_invite_existing_member(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(self.invite_url, {'email': self.member.email, 'role': 'member'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('User is already a member of the team', response.data.get('error', ''))

    def test_owner_can_update_member_role(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.patch(self.update_role_url, {'user_id': self.member.id, 'role': 'admin'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_member_cannot_update_roles(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.patch(self.update_role_url, {'user_id': self.owner.id, 'role': 'member'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_can_remove_member(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.delete(self.remove_member_url, data={'user_id': self.member.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_member_cannot_remove_another_member(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.delete(self.remove_member_url, data={'user_id': self.owner.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_cannot_remove_self(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.delete(self.remove_member_url, data={'user_id': self.owner.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_users_in_same_team(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.get(self.users_in_team_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)

    def test_owner_can_create_task_for_team(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(self.task_url, {
            'description': 'Team Task',
            'team': self.team.id,
            'assigned_to': self.member.id,
            'due_date': self.tomorrow.isoformat(),
            'status': 'not_started'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_member_can_create_task_assigned_to_self(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.post(self.task_url, {
            'description': 'Self-assigned Team Task',
            'team': self.team.id,
            'assigned_to': self.member.id,
            'due_date': self.tomorrow.isoformat(),
            'status': 'not_started'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_member_cannot_create_task_assigned_to_others(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.post(self.task_url, {
            'description': 'Invalid Task',
            'team': self.team.id,
            'assigned_to': self.owner.id,
            'due_date': self.tomorrow.isoformat(),
            'status': 'not_started'
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_member_can_create_personal_task(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.post(self.task_url, {
            'description': 'Personal Task',
            'assigned_to': self.member.id,
            'due_date': self.tomorrow.isoformat(),
            'status': 'not_started'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
