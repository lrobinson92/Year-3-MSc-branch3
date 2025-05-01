from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from sop.models import UserAccount, Team, TeamMembership, Task
from datetime import date, timedelta

class TaskManagementTests(TestCase):
    """Test suite for task management functionality"""

    def setUp(self):
        self.client = APIClient()

        self.owner = UserAccount.objects.create_user(
            email='owner@example.com', password='testpass123', name='Team Owner')
        self.member = UserAccount.objects.create_user(
            email='member@example.com', password='testpass123', name='Team Member')
        self.non_member = UserAccount.objects.create_user(
            email='nonmember@example.com', password='testpass123', name='Non Member')

        self.team = Team.objects.create(
            name='Test Team', description='A team for testing', created_by=self.owner)

        TeamMembership.objects.create(user=self.owner, team=self.team, role='owner')
        TeamMembership.objects.create(user=self.member, team=self.team, role='member')

        self.today = date.today()
        self.tomorrow = self.today + timedelta(days=1)
        self.yesterday = self.today - timedelta(days=1)

        self.owner_task = Task.objects.create(
            description='Owner Personal Task', assigned_to=self.owner,
            due_date=self.tomorrow, status='not_started')

        self.team_task = Task.objects.create(
            description='Team Task', assigned_to=self.member, team=self.team,
            due_date=self.tomorrow, status='not_started')

        self.completed_task = Task.objects.create(
            description='Completed Task', assigned_to=self.owner, team=self.team,
            due_date=self.yesterday, status='complete')

        self.task_list_url = reverse('task-list')
        self.task_user_and_team_tasks_url = reverse('task-user-and-team-tasks')
        self.team_users_url = reverse('team-users-in-same-team', args=[self.team.id])

    def test_user_assigned_team_task_appears_in_user_tasks(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.get(self.task_user_and_team_tasks_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user_task_ids = [task['id'] for task in response.data['user_tasks']]
        team_task_ids = [task['id'] for task in response.data['team_tasks']]
        self.assertIn(self.team_task.id, user_task_ids)
        self.assertNotIn(self.team_task.id, team_task_ids)

    def test_non_member_cannot_access_team_task(self):
        self.client.force_authenticate(user=self.non_member)
        response = self.client.get(self.task_user_and_team_tasks_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['user_tasks']), 0)
        self.assertEqual(len(response.data['team_tasks']), 0)

    def test_member_sees_unassigned_team_tasks_in_team_tasks(self):
        unassigned_task = Task.objects.create(
            description='Unassigned Team Task', team=self.team,
            due_date=self.tomorrow, status='not_started')
        self.client.force_authenticate(user=self.member)
        response = self.client.get(self.task_user_and_team_tasks_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(unassigned_task.id, [t['id'] for t in response.data['team_tasks']])
        self.assertNotIn(unassigned_task.id, [t['id'] for t in response.data['user_tasks']])

    def test_member_cannot_edit_team_task(self):
        self.client.force_authenticate(user=self.member)
        url = reverse('task-detail', args=[self.owner_task.id])
        update_data = {
            'description': 'Edited by member',
            'assigned_to': self.owner.id,
            'due_date': self.tomorrow.isoformat(),
            'status': 'in_progress'
        }
        response = self.client.put(url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_member_cannot_delete_team_task(self):
        self.client.force_authenticate(user=self.non_member)
        url = reverse('task-detail', args=[self.team_task.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_can_edit_and_delete_team_task(self):
        self.client.force_authenticate(user=self.owner)
        url = reverse('task-detail', args=[self.team_task.id])
        update_data = {
            'description': 'Edited by owner',
            'assigned_to': self.member.id,
            'team': self.team.id,
            'due_date': self.tomorrow.isoformat(),
            'status': 'in_progress'
        }
        update_response = self.client.put(url, update_data, format='json')
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        delete_response = self.client.delete(url)
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)

    def test_other_team_owner_cannot_edit_task(self):
        """A user who owns a different team should NOT be able to edit tasks from another team"""
        # Create another team where this new user is owner
        outsider = UserAccount.objects.create_user(
            email='outsider@example.com', password='testpass123', name='Other Team Owner'
        )
        other_team = Team.objects.create(name='Other Team', description='Outsider team', created_by=outsider)
        TeamMembership.objects.create(user=outsider, team=other_team, role='owner')

        self.client.force_authenticate(user=outsider)

        # Try to edit a task from self.team
        url = reverse('task-detail', args=[self.team_task.id])
        update_data = {
            'description': 'Hacked Edit',
            'assigned_to': self.member.id,
            'team': self.team.id,
            'due_date': self.tomorrow.isoformat(),
            'status': 'in_progress'
        }
        response = self.client.put(url, update_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
