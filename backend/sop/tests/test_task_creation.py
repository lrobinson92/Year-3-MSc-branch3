from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from sop.models import UserAccount, Team, TeamMembership, Task

class TaskCreationTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = UserAccount.objects.create_user(email='user1@example.com', password='testpass', name='User One')
        self.user2 = UserAccount.objects.create_user(email='user2@example.com', password='testpass', name='User Two')
        self.user3 = UserAccount.objects.create_user(email='user3@example.com', password='testpass', name='User Three')
        self.team = Team.objects.create(name='Test Team', description='A test team', created_by=self.user1)
        TeamMembership.objects.create(user=self.user1, team=self.team, role='member')
        TeamMembership.objects.create(user=self.user2, team=self.team, role='member')
        # User3 is not added to the team

        self.client.force_authenticate(user=self.user1)

    def test_create_task_with_team_and_member(self):
        # Fetch users in the same team
        url = reverse('team-users-in-same-team', args=[self.team.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['id'], self.user1.id)
        self.assertEqual(response.data[1]['id'], self.user2.id)
        self.assertNotIn(self.user3.id, [user['id'] for user in response.data])

        # Create a task with a selected team and member
        task_url = reverse('task-list')
        task_data = {
            'description': 'Test Task',
            'assigned_to': self.user2.id,
            'team': self.team.id,
            'due_date': '2023-10-01',
            'status': 'not_started'
        }
        task_response = self.client.post(task_url, task_data, format='json')

        self.assertEqual(task_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(task_response.data['description'], 'Test Task')
        self.assertEqual(task_response.data['assigned_to'], self.user2.id)
        self.assertEqual(task_response.data['team'], self.team.id)
        self.assertEqual(task_response.data['due_date'], '2023-10-01')
        self.assertEqual(task_response.data['status'], 'not_started')